/* =========================================================
   INKORA SHARED STATE BLOCKS

   Loading, empty and error views used across every page so
   they look and behave the same everywhere.
========================================================= */

import { Link } from "react-router";

/* =========================================================
   SPINNER
========================================================= */

export function Spinner({ size = 8, label = "Loading" }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block h-${size} w-${size} animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600`}
      style={{
        height: `${size * 4}px`,
        width: `${size * 4}px`,
      }}
    />
  );
}

/* =========================================================
   LOADING BLOCK
========================================================= */

export function LoadingBlock({
  title = "Loading...",
  description = "This will only take a moment.",
  className = "",
}) {
  return (
    <div
      className={`flex min-h-[240px] items-center justify-center rounded-[28px] border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600" />

        <p className="mt-4 text-sm font-bold text-neutral-700 dark:text-neutral-200">
          {title}
        </p>

        <p className="mt-1 text-xs text-neutral-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FEED SKELETON
========================================================= */

export function BlogCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />

        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>

      <div className="space-y-3 px-5 pt-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div className="mt-4 h-[300px] w-full animate-pulse bg-neutral-100 dark:bg-neutral-800 sm:h-[350px]" />

      <div className="flex gap-5 px-5 py-5">
        <div className="h-4 w-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-4 w-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-4 w-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      aria-hidden="true"
    >
      <div className="h-[210px] w-full animate-pulse bg-neutral-100 dark:bg-neutral-800" />

      <div className="space-y-3 p-5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`rounded-[28px] border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10">
          {icon}
        </div>
      )}

      <h3 className="mt-5 text-xl font-black dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
          {description}
        </p>
      )}

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-violet-700"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionTo && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-violet-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ERROR STATE
========================================================= */

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`rounded-[28px] border border-red-100 bg-white p-10 text-center dark:border-red-500/20 dark:bg-neutral-900 ${className}`}
      role="alert"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <h3 className="mt-5 text-xl font-black dark:text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-neutral-900 px-5 py-3 text-xs font-bold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

export function Toast({ message, tone = "default" }) {
  if (!message) {
    return null;
  }

  const tones = {
    default: "bg-neutral-900 text-white",
    success: "bg-green-600 text-white",
    error: "bg-red-500 text-white",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-2xl px-5 py-3 text-xs font-bold shadow-2xl sm:left-auto sm:right-6 sm:translate-x-0 ${
        tones[tone] || tones.default
      }`}
    >
      {message}
    </div>
  );
}
