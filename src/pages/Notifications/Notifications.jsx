import { Link } from "react-router";

import SafeImage from "../../components/SafeImage";
import { EmptyState } from "../../components/States";

import {
  useNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} from "../../utils/notifications";

import { formatRelativeTime, initialsOf } from "../../utils/format";

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3-.5L4 20l1.5-4A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 21c.7-4 2.9-6 6.5-6 2.1 0 3.7.7 4.8 2" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 17 4 12l5-5" />
      <path d="M4 12h10a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function NotificationIcon({ type }) {
  if (type === "like") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
        <HeartIcon />
      </div>
    );
  }

  if (type === "comment") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600">
        <MessageIcon />
      </div>
    );
  }

  if (type === "follow") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <UserPlusIcon />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
      <ReplyIcon />
    </div>
  );
}

/* =========================================================
   ONE ROW
========================================================= */

function NotificationRow({ notification, isLast }) {
  const body = (
    <>
      {/* AVATAR */}

      <div className="relative shrink-0">
        {notification.avatar ? (
          <SafeImage
            src={notification.avatar}
            alt={notification.name}
            className="h-11 w-11 rounded-full object-cover"
            fallbackLabel=""
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-600 dark:bg-violet-500/10">
            {initialsOf(notification.name)}
          </div>
        )}

        <div className="absolute -bottom-1 -right-1">
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      {/* CONTENT */}

      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              <span className="font-bold text-neutral-900 dark:text-white">
                {notification.name}
              </span>{" "}
              {notification.text}
            </p>

            {notification.blog && (
              <p className="mt-1 truncate text-xs font-semibold text-violet-600">
                {notification.blog}
              </p>
            )}

            <p className="mt-2 text-[10px] font-medium text-neutral-400">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>

          {notification.unread && (
            <span
              className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-600"
              aria-label="Unread"
            />
          )}
        </div>
      </div>
    </>
  );

  const rowClass = `flex w-full items-start gap-3 px-5 py-5 text-left transition hover:bg-neutral-50 sm:px-6 dark:hover:bg-neutral-800/50 ${
    isLast ? "" : "border-b border-neutral-100 dark:border-neutral-800"
  } ${
    notification.unread
      ? "bg-violet-50/30 dark:bg-violet-500/5"
      : "bg-white dark:bg-neutral-900"
  }`;

  return (
    <div className="group relative">
      {notification.blogId ? (
        <Link
          to={`/blog/${notification.blogId}`}
          onClick={() => markAsRead(notification.id)}
          className={rowClass}
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => markAsRead(notification.id)}
          className={rowClass}
        >
          {body}
        </button>
      )}

      <button
        type="button"
        onClick={() => removeNotification(notification.id)}
        aria-label="Remove this notification"
        className="absolute right-3 top-3 hidden rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-400 transition hover:bg-neutral-100 hover:text-red-500 group-hover:block dark:hover:bg-neutral-800"
      >
        Remove
      </button>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function Notifications() {
  const notifications = useNotifications();

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto flex h-[68px] max-w-[1050px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-lg font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/home"
              className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Back to Feed
            </Link>

            <Link
              to="/profile"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-[850px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10">
                <BellIcon />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Notifications
                </h1>

                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Stay updated with what's happening on INKORA.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-violet-600 transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
              >
                <CheckIcon />
                Mark all as read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="rounded-xl px-3 py-2 text-xs font-bold text-neutral-400 transition hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* UNREAD COUNT */}

        {notifications.length > 0 && (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
            <div>
              <p className="text-xs font-bold text-violet-900 dark:text-violet-200">
                {unreadCount === 0
                  ? "You're all caught up!"
                  : `${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }`}
              </p>

              <p className="mt-0.5 text-[10px] text-violet-600 dark:text-violet-300">
                Likes, comments and follows show up here as they happen.
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-violet-600 px-2 text-[10px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </div>
        )}

        {/* NOTIFICATION LIST */}

        {notifications.length > 0 ? (
          <div className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {notifications.map((notification, index) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                isLast={index === notifications.length - 1}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BellIcon />}
            title="No notifications yet"
            description="When people interact with your blogs or follow you, their activity will appear here."
            actionLabel="Back to Feed"
            actionTo="/home"
          />
        )}

        {/* MOBILE ACTIONS */}

        {notifications.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 sm:hidden">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-violet-600 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <CheckIcon />
                Mark all as read
              </button>
            )}

            <button
              type="button"
              onClick={clearNotifications}
              className="w-full rounded-xl px-4 py-3 text-xs font-bold text-neutral-400"
            >
              Clear all
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;
