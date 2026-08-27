/* =========================================================
   INKORA - API cache

   A very small data cache, so the hooks the pages already
   use (useAllBlogs, useSaved, useCurrentUser...) can keep
   the same shape now that the data comes from MySQL instead
   of localStorage.

   Without something like this, every page would have to grow
   its own loading state and its own refetch-after-mutation
   logic, and the same blog list would be fetched five times
   on one screen.

   It does three things:
   - hands back cached data straight away so nothing flashes
   - de-duplicates concurrent requests for the same key
   - refetches a key after something changes it

   TanStack Query does all this properly. This is the small
   version of it that avoids adding a dependency.
========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

/* key -> { data, error, loading, loadedAt, promise } */
const cache = new Map();

/* key -> Set of callbacks */
const listeners = new Map();

/* key -> the fetcher last used, so invalidate() can refetch
   without the component telling it how. */
const fetchers = new Map();

function getEntry(key) {
  if (!cache.has(key)) {
    cache.set(key, {
      data: undefined,
      error: null,
      loading: false,
      loadedAt: 0,
      promise: null,
    });
  }

  return cache.get(key);
}

function emit(key) {
  const group = listeners.get(key);

  if (!group) {
    return;
  }

  group.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error("INKORA cache listener failed:", error);
    }
  });
}

function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  listeners.get(key).add(callback);

  return () => {
    const group = listeners.get(key);

    if (!group) {
      return;
    }

    group.delete(callback);

    if (group.size === 0) {
      listeners.delete(key);
    }
  };
}

/* ---------------------------------------------------------
   FETCHING
--------------------------------------------------------- */

export function load(key, fetcher, { force = false } = {}) {
  const entry = getEntry(key);

  if (fetcher) {
    fetchers.set(key, fetcher);
  }

  /* Already in flight - join it instead of firing a second
     identical request. */
  if (entry.promise) {
    return entry.promise;
  }

  if (!force && entry.loadedAt > 0) {
    return Promise.resolve(entry.data);
  }

  const run = fetcher || fetchers.get(key);

  if (!run) {
    return Promise.resolve(undefined);
  }

  entry.loading = true;
  entry.error = null;
  emit(key);

  entry.promise = Promise.resolve()
    .then(run)
    .then((data) => {
      entry.data = data;
      entry.error = null;
      entry.loadedAt = Date.now();

      return data;
    })
    .catch((error) => {
      /* A 401 just means "not signed in" - that's an answer,
         not a failure worth showing the user. */
      if (error?.status === 401) {
        entry.data = undefined;
        entry.error = null;
        entry.loadedAt = Date.now();

        return undefined;
      }

      entry.error = error;

      console.error(`INKORA request failed (${key}):`, error);

      return undefined;
    })
    .finally(() => {
      entry.loading = false;
      entry.promise = null;
      emit(key);
    });

  return entry.promise;
}

/* ---------------------------------------------------------
   INVALIDATION

   invalidate("blogs") also clears "blogs?q=react" and
   friends, so a new post shows up in every filtered list.
--------------------------------------------------------- */

export function invalidate(...prefixes) {
  const keys = [...cache.keys()];

  keys.forEach((key) => {
    const matches = prefixes.some(
      (prefix) => key === prefix || key.startsWith(`${prefix}?`) || key.startsWith(`${prefix}/`)
    );

    if (!matches) {
      return;
    }

    const entry = cache.get(key);

    entry.loadedAt = 0;

    /* Refetch immediately if something is on screen using
       it, otherwise let it reload lazily next time. */
    if (listeners.has(key)) {
      load(key, fetchers.get(key), { force: true });
    } else {
      emit(key);
    }
  });
}

/* Write a value straight into the cache. Used for optimistic
   updates so a bookmark fills in on the tap rather than
   after the round trip. */
export function setCache(key, updater) {
  const entry = getEntry(key);

  entry.data = typeof updater === "function" ? updater(entry.data) : updater;
  entry.loadedAt = Date.now();

  emit(key);
}

export function peek(key) {
  return cache.get(key)?.data;
}

/* On logout, everything held about the old user has to go. */
export function clearCache() {
  cache.clear();
  fetchers.clear();

  [...listeners.keys()].forEach(emit);
}

/* ---------------------------------------------------------
   THE HOOK
--------------------------------------------------------- */

export function useResource(key, fetcher, fallback) {
  /* Keep the newest fetcher without making it a dependency -
     it's an inline arrow, so it's a new function every
     render and would loop forever. */
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!key) {
      return undefined;
    }

    const unsubscribe = subscribe(key, () => forceRender((n) => n + 1));

    load(key, (...args) => fetcherRef.current(...args));

    return unsubscribe;
  }, [key]);

  const reload = useCallback(
    () => load(key, (...args) => fetcherRef.current(...args), { force: true }),
    [key]
  );

  const entry = key ? getEntry(key) : null;

  return {
    data: entry?.data === undefined ? fallback : entry.data,
    loading: entry ? entry.loading && entry.loadedAt === 0 : false,
    error: entry?.error || null,
    reload,
  };
}
