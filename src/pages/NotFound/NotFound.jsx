/* =========================================================
   INKORA 404

   Shown for any address that isn't a real INKORA page.
========================================================= */

import { Link, useLocation } from "react-router";

function NotFound() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-16 dark:bg-neutral-950">
      <div className="w-full max-w-lg rounded-[32px] border border-neutral-200 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white shadow-lg shadow-violet-200">
          I
        </div>

        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] dark:text-white sm:text-5xl">
          This page doesn't exist.
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          We couldn't find anything at{" "}
          <span className="break-all font-semibold text-neutral-700 dark:text-neutral-200">
            {location.pathname}
          </span>
          . It may have been moved, or the link may be incomplete.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/home"
            className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            Back to Feed
          </Link>

          <Link
            to="/discover"
            className="rounded-xl border border-neutral-200 px-6 py-3 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Discover blogs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
