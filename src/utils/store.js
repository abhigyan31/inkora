/* =========================================================
   INKORA SHARED STORE

   A very small localStorage layer with live updates.

   Every page (Feed, Discover, Profile, Blog...) reads and
   writes through here, so a bookmark saved on Home instantly
   appears on Profile without a page refresh.
========================================================= */

import { useCallback, useEffect, useState } from "react";

/* =========================================================
   STORAGE KEYS

   "inkora-saved-blogs" keeps its original name so bookmarks
   saved before this refactor are not lost.
========================================================= */

export const KEYS = {
  blogs: "inkora_blogs",
  saved: "inkora-saved-blogs",
  likes: "inkora_likes",
  likeCounts: "inkora_like_counts",
  following: "inkora_following",
  followers: "inkora_followers",
  comments: "inkora_comments",
  commentLikes: "inkora_comment_likes",
  notifications: "inkora_notifications",
  users: "inkora_users",
  session: "inkora_session",
  profile: "inkora_profile",
  settings: "inkora_settings",
  views: "inkora_views",
};

/* =========================================================
   LISTENERS
========================================================= */

const listeners = new Map();

export function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  listeners.get(key).add(callback);

  return () => {
    const group = listeners.get(key);

    if (group) {
      group.delete(callback);
    }
  };
}

export function notify(key) {
  const group = listeners.get(key);

  if (!group) {
    return;
  }

  group.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error("INKORA store listener failed:", error);
    }
  });
}

/* Keep other browser tabs in sync. */

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key) {
      notify(event.key);
    }
  });
}

/* =========================================================
   READ / WRITE
========================================================= */

export function readStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) {
      return fallback;
    }

    const parsed = JSON.parse(stored);

    return parsed === null || parsed === undefined
      ? fallback
      : parsed;
  } catch (error) {
    console.error(`Failed to read "${key}" from INKORA storage:`, error);
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save "${key}" to INKORA storage:`, error);

    if (error?.name === "QuotaExceededError") {
      console.error(
        "INKORA storage is full. Large files belong in the file store " +
          "(src/utils/fileStore.js), not in localStorage."
      );
    }

    return false;
  }

  notify(key);

  return true;
}

export function updateStore(key, fallback, updater) {
  const current = readStore(key, fallback);

  const next =
    typeof updater === "function"
      ? updater(current)
      : updater;

  writeStore(key, next);

  return next;
}

export function removeStore(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove "${key}" from INKORA storage:`, error);
  }

  notify(key);
}

/* =========================================================
   REACT HOOK

   const [saved, setSaved] = useStore(KEYS.saved, {});

   Any component using the same key re-renders automatically
   when the value changes anywhere in the app.
========================================================= */

export function useStore(key, fallback) {
  const [value, setValue] = useState(() => readStore(key, fallback));

  useEffect(() => {
    function sync() {
      setValue(readStore(key, fallback));
    }

    sync();

    return subscribe(key, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setStoredValue = useCallback(
    (next) => {
      updateStore(key, fallback, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, setStoredValue];
}

/* =========================================================
   ID HELPER
========================================================= */

export function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
