/* =========================================================
   INKORA NOTIFICATIONS

   Real, persisted notifications with triggers for likes,
   comments, replies and follows.

   The original sample notifications are kept as seed data so
   the page is never empty on a fresh install.
========================================================= */

import { KEYS, readStore, writeStore, createId, useStore } from "./store";

/* =========================================================
   SEED DATA
========================================================= */

const seedNotifications = [
  {
    id: "seed-1",
    type: "like",
    name: "Sarah Johnson",
    username: "@sarahj",
    avatar: "https://i.pravatar.cc/100?img=47",
    text: "liked your blog",
    blog: "The Things College Taught Me",
    blogId: "demo-1",
    createdAt: "2026-08-26T09:00:00.000Z",
    unread: true,
  },
  {
    id: "seed-2",
    type: "comment",
    name: "Rahul Sharma",
    username: "@rahulthoughts",
    avatar: "https://i.pravatar.cc/100?img=12",
    text: "commented on your blog",
    blog: "The Things College Taught Me",
    blogId: "demo-1",
    createdAt: "2026-08-26T08:40:00.000Z",
    unread: true,
  },
  {
    id: "seed-3",
    type: "follow",
    name: "Maya Patel",
    username: "@mayawrites",
    avatar: "https://i.pravatar.cc/100?img=32",
    text: "started following you",
    blog: "",
    blogId: "",
    createdAt: "2026-08-26T07:50:00.000Z",
    unread: true,
  },
  {
    id: "seed-4",
    type: "reply",
    name: "Alex Kumar",
    username: "@alexwrites",
    avatar: "https://i.pravatar.cc/100?img=11",
    text: "replied to your comment",
    blog: "Finding Peace in Small Moments",
    blogId: "demo-2",
    createdAt: "2026-08-26T06:50:00.000Z",
    unread: false,
  },
  {
    id: "seed-5",
    type: "like",
    name: "Emma Davis",
    username: "@emmadavis",
    avatar: "https://i.pravatar.cc/100?img=44",
    text: "liked your blog",
    blog: "A Weekend in the Mountains",
    blogId: "demo-4",
    createdAt: "2026-08-26T04:50:00.000Z",
    unread: false,
  },
  {
    id: "seed-6",
    type: "follow",
    name: "Michael Lee",
    username: "@michaellee",
    avatar: "https://i.pravatar.cc/100?img=68",
    text: "started following you",
    blog: "",
    blogId: "",
    createdAt: "2026-08-26T02:50:00.000Z",
    unread: false,
  },
  {
    id: "seed-7",
    type: "comment",
    name: "David Wilson",
    username: "@davidwrites",
    avatar: "https://i.pravatar.cc/100?img=13",
    text: "commented on your blog",
    blog: "Building My First Web App",
    blogId: "demo-7",
    createdAt: "2026-08-25T09:00:00.000Z",
    unread: false,
  },
];

export function ensureSeedNotifications() {
  const stored = readStore(KEYS.notifications, null);

  if (stored === null) {
    writeStore(KEYS.notifications, seedNotifications);
  }
}

/* =========================================================
   READS
========================================================= */

export function getNotifications() {
  const list = readStore(KEYS.notifications, seedNotifications);

  return Array.isArray(list) ? list : [];
}

export function useNotifications() {
  const [list] = useStore(KEYS.notifications, seedNotifications);

  return Array.isArray(list) ? list : [];
}

export function useUnreadCount() {
  const list = useNotifications();

  return list.filter((notification) => notification.unread).length;
}

/* =========================================================
   SETTINGS GATE

   Notification toggles in Settings actually silence the
   matching triggers.
========================================================= */

function notificationsAllowed(type) {
  const settings = readStore(KEYS.settings, null);

  if (!settings) {
    return true;
  }

  if (settings.pushNotifications === false) {
    return false;
  }

  if (
    (type === "comment" || type === "reply") &&
    settings.commentNotifications === false
  ) {
    return false;
  }

  if (type === "follow" && settings.followNotifications === false) {
    return false;
  }

  return true;
}

/* =========================================================
   WRITES
========================================================= */

export function addNotification(notification) {
  const type = notification.type || "like";

  if (!notificationsAllowed(type)) {
    return null;
  }

  const entry = {
    id: createId(),
    type,
    name: notification.name || "Someone",
    username: notification.username || "",
    avatar: notification.avatar || "",
    text: notification.text || "interacted with your blog",
    blog: notification.blog || "",
    blogId: notification.blogId || "",
    createdAt: new Date().toISOString(),
    unread: true,
  };

  writeStore(KEYS.notifications, [entry, ...getNotifications()]);

  return entry;
}

export function markAsRead(id) {
  writeStore(
    KEYS.notifications,
    getNotifications().map((notification) =>
      String(notification.id) === String(id)
        ? { ...notification, unread: false }
        : notification
    )
  );
}

export function markAllAsRead() {
  writeStore(
    KEYS.notifications,
    getNotifications().map((notification) => ({
      ...notification,
      unread: false,
    }))
  );
}

export function removeNotification(id) {
  writeStore(
    KEYS.notifications,
    getNotifications().filter(
      (notification) => String(notification.id) !== String(id)
    )
  );
}

export function clearNotifications() {
  writeStore(KEYS.notifications, []);
}

/* =========================================================
   TRIGGERS

   Called from social.js whenever the signed-in reader acts
   on somebody else's blog.
========================================================= */

export function notifyLike(actor, blog) {
  return addNotification({
    type: "like",
    name: actor?.name,
    username: actor?.username,
    avatar: actor?.avatar,
    text: "liked your blog",
    blog: blog?.title,
    blogId: blog?.id,
  });
}

export function notifyComment(actor, blog) {
  return addNotification({
    type: "comment",
    name: actor?.name,
    username: actor?.username,
    avatar: actor?.avatar,
    text: "commented on your blog",
    blog: blog?.title,
    blogId: blog?.id,
  });
}

export function notifyReply(actor, blog) {
  return addNotification({
    type: "reply",
    name: actor?.name,
    username: actor?.username,
    avatar: actor?.avatar,
    text: "replied to your comment",
    blog: blog?.title,
    blogId: blog?.id,
  });
}

export function notifyFollow(actor, targetUsername) {
  return addNotification({
    type: "follow",
    name: actor?.name,
    username: actor?.username,
    avatar: actor?.avatar,
    text: `started following ${targetUsername || "you"}`,
    blog: "",
    blogId: "",
  });
}
