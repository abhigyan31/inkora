/* =========================================================
   INKORA NOTIFICATIONS

   These are created by the server now, in the same request
   as the like, comment or follow that caused them, and they
   are addressed to the person who should receive them.

   The browser-only version could only ever write to its own
   device, which is why "someone liked your blog" used to
   appear in the inbox of the person doing the liking.
========================================================= */

import { api } from "./api";
import { useResource, invalidate, setCache, peek } from "./apiStore";
import { useSession } from "./session";

const KEY = "notifications";

function fetchNotifications() {
  return api.get("/notifications").then((data) => ({
    list: data?.notifications ?? [],
    unread: data?.unread ?? 0,
  }));
}

export function useNotifications() {
  const { user } = useSession();

  const { data } = useResource(user ? KEY : null, fetchNotifications, {
    list: [],
    unread: 0,
  });

  return data?.list ?? [];
}

export function useUnreadCount() {
  const { user } = useSession();

  const { data } = useResource(user ? KEY : null, fetchNotifications, {
    list: [],
    unread: 0,
  });

  return data?.unread ?? 0;
}

/* ---------------------------------------------------------
   WRITES

   Each of these updates the cache first so the dot clears
   the moment you tap, then confirms with the server.
--------------------------------------------------------- */

export async function markAsRead(id) {
  const before = peek(KEY);

  setCache(KEY, (current) => {
    const list = current?.list ?? [];

    const wasUnread = list.some(
      (item) => String(item.id) === String(id) && item.unread
    );

    return {
      list: list.map((item) =>
        String(item.id) === String(id) ? { ...item, unread: false } : item
      ),
      unread: Math.max(0, (current?.unread ?? 0) - (wasUnread ? 1 : 0)),
    };
  });

  try {
    await api.post("/notifications/read", { ids: [String(id)] });
  } catch (error) {
    console.error("Could not mark that as read:", error);
    setCache(KEY, before);
  }
}

export async function markAllAsRead() {
  const before = peek(KEY);

  setCache(KEY, (current) => ({
    list: (current?.list ?? []).map((item) => ({ ...item, unread: false })),
    unread: 0,
  }));

  try {
    await api.post("/notifications/read", { all: true });
  } catch (error) {
    console.error("Could not mark those as read:", error);
    setCache(KEY, before);
  }
}

export async function removeNotification(id) {
  const before = peek(KEY);

  setCache(KEY, (current) => {
    const list = current?.list ?? [];

    const removed = list.find((item) => String(item.id) === String(id));

    return {
      list: list.filter((item) => String(item.id) !== String(id)),
      unread: Math.max(0, (current?.unread ?? 0) - (removed?.unread ? 1 : 0)),
    };
  });

  try {
    await api.delete(`/notifications/${encodeURIComponent(id)}`);
  } catch (error) {
    console.error("Could not remove that notification:", error);
    setCache(KEY, before);
  }
}

export async function clearNotifications() {
  const before = peek(KEY);

  setCache(KEY, { list: [], unread: 0 });

  try {
    await api.delete("/notifications");
  } catch (error) {
    console.error("Could not clear your notifications:", error);
    setCache(KEY, before);
  }
}

export function refreshNotifications() {
  invalidate(KEY);
}
