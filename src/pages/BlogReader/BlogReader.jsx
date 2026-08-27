/* =========================================================
   INKORA BLOG READER

   A distraction-free reading view of a blog, reachable at
   /read/:id and linked from the "Reader view" button on the
   full blog page. No comment box, no action bar, just the
   story and the document.
========================================================= */

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import BlogPdf from "../../components/BlogPdf";
import SafeImage from "../../components/SafeImage";

import {
  useBlog,
  getAuthorName,
  getAuthorUsername,
  getAuthorAvatar,
  getBlogImage,
  estimateReadTime,
} from "../../utils/blogStorage";

import {
  useSaved,
  useLikes,
  useComments,
  recordView,
} from "../../utils/social";
import { blogDate, formatCount, initialsOf } from "../../utils/format";

function BookmarkIcon({ active }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

/* Reading progress bar across the top of the page. */

function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollable <= 0) {
        setProgress(0);
        return;
      }

      setProgress(
        Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
      );
    }

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

function BlogReader() {
  const { id } = useParams();

  const { blog, loading } = useBlog(id);

  const { isSaved, toggleSave } = useSaved();
  const { likeCount } = useLikes();
  const comments = useComments(id);

  const progress = useReadingProgress();

  const viewedRef = useRef("");

  useEffect(() => {
    if (!blog || viewedRef.current === String(blog.id)) {
      return;
    }

    viewedRef.current = String(blog.id);

    recordView(blog.id);
  }, [blog]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-bold text-neutral-500 dark:text-neutral-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white">
            I
          </div>

          <h1 className="mt-6 text-3xl font-black dark:text-white">
            Blog not found
          </h1>

          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            This blog may have been deleted or does not exist.
          </p>

          <Link
            to="/home"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const authorName = getAuthorName(blog);
  const authorUsername = getAuthorUsername(blog);
  const authorAvatar = getAuthorAvatar(blog);
  const thumbnail = getBlogImage(blog);

  const tags = Array.isArray(blog.tags) ? blog.tags : [];
  const paragraphs = Array.isArray(blog.content) ? blog.content : [];

  const saved = isSaved(blog.id);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-neutral-100">
      {/* READING PROGRESS */}

      <div
        className="fixed left-0 top-0 z-[60] h-1 bg-violet-600 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/home"
            className="text-xl font-black tracking-[-0.04em]"
          >
            INKORA
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSave(blog.id)}
              aria-pressed={saved}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                saved
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "bg-neutral-100 text-neutral-600 hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              <BookmarkIcon active={saved} />
              {saved ? "Saved" : "Save"}
            </button>

            <Link
              to={`/blog/${blog.id}`}
              className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* BLOG */}

      <main className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8 sm:py-14">
        {/* CATEGORY */}

        <div className="text-center">
          <span className="rounded-full bg-violet-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {blog.category}
          </span>
        </div>

        {/* TITLE */}

        <h1 className="mx-auto mt-6 max-w-4xl text-center text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl">
          {blog.title}
        </h1>

        {/* DESCRIPTION */}

        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-neutral-500 dark:text-neutral-400 sm:text-lg">
          {blog.description}
        </p>

        {/* AUTHOR */}

        <div className="mt-8 flex items-center justify-center gap-3">
          {authorAvatar ? (
            <SafeImage
              src={authorAvatar}
              alt={authorName}
              className="h-11 w-11 rounded-full object-cover"
              fallbackLabel=""
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-black text-violet-600 dark:bg-violet-500/10">
              {initialsOf(authorName)}
            </div>
          )}

          <div>
            <Link
              to={`/u/${encodeURIComponent(
                String(authorUsername).replace("@", "")
              )}`}
              className="text-sm font-black hover:text-violet-600"
            >
              {authorName}
            </Link>

            <p className="text-xs text-neutral-400">
              {authorUsername}
              {blogDate(blog) ? ` · ${blogDate(blog)}` : ""}
            </p>
          </div>
        </div>

        {/* THUMBNAIL */}

        {thumbnail && (
          <div className="mt-10 overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <SafeImage
              src={thumbnail}
              alt={blog.title}
              className="h-[280px] w-full object-cover sm:h-[500px]"
            />
          </div>
        )}

        {/* META */}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-400">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm dark:bg-neutral-900">
            {estimateReadTime(blog)}
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm dark:bg-neutral-900">
            ❤️ {formatCount(likeCount(blog))}
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm dark:bg-neutral-900">
            💬 {formatCount((Number(blog.comments) || 0) + comments.length)}
          </span>
        </div>

        {/* TAGS */}

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/discover?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-neutral-200 px-3 py-1.5 text-[10px] font-bold text-neutral-500 transition hover:bg-violet-100 hover:text-violet-700 dark:bg-neutral-800 dark:text-neutral-400"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* ARTICLE TEXT */}

        {paragraphs.length > 0 && (
          <article className="mx-auto mt-12 max-w-[680px] space-y-6">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-lg leading-9 text-neutral-700 dark:text-neutral-300"
              >
                {paragraph}
              </p>
            ))}
          </article>
        )}

        {/* PDF */}

        {blog.pdf && (
          <section className="mt-12">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">
                Blog document
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Read the full story
              </h2>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <BlogPdf file={blog.pdf} />
            </div>
          </section>
        )}

        {/* NOTHING TO READ */}

        {!blog.pdf && paragraphs.length === 0 && (
          <div className="mt-12 rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
              Full article content
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              This blog was published without a PDF or written body.
            </p>
          </div>
        )}

        {/* BOTTOM */}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            to={`/blog/${blog.id}#comments`}
            className="rounded-xl border border-neutral-200 px-6 py-3 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Join the discussion
          </Link>

          <Link
            to="/home"
            className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white hover:bg-violet-700"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default BlogReader;
