import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import SafeImage from "../../components/SafeImage";
import { GridCardSkeleton, EmptyState, Toast } from "../../components/States";

import {
  useBlogs,
  getAuthorName,
  getAuthorUsername,
  getAuthorAvatar,
  getBlogImage,
  estimateReadTime,
} from "../../utils/blogStorage";
import {
  useSaved,
  useLikes,
  useFollowing,
  shareBlog,
} from "../../utils/social";
import { useCurrentUser } from "../../utils/session";
import { useToast } from "../../utils/useToast";
import { formatCount } from "../../utils/format";

import { categories, trendingTopics } from "../../utils/demoData";

function SearchIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ArrowIcon() {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function HeartIcon({ liked }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  return (
    <svg
      width="17"
      height="17"
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

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 12 16-8-5 16-4-7-7-1Z" />
      <path d="m11 13 4-4" />
    </svg>
  );
}

function TrendingIcon() {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/* =========================================================
   DISCOVER
========================================================= */

function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(
    () => searchParams.get("q") || ""
  );

  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get("category") || "All"
  );

  const user = useCurrentUser();

  const { isSaved, toggleSave } = useSaved();
  const { isLiked, toggleLike, likeCount } = useLikes();
  const { isFollowing, toggleFollow } = useFollowing();

  const { toast, showToast } = useToast();

  /* Wait for typing to settle before asking the server.
     Firing a query per keystroke would hammer the database
     for results nobody reads. */
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { blogs: filteredBlogs, loading } = useBlogs({
    q: debouncedSearch.trim(),
    category: activeCategory === "All" ? "" : activeCategory,
  });

  /* Keep the address bar in step with the filters so a
     search can be shared or bookmarked. */

  useEffect(() => {
    const next = {};

    if (search.trim()) {
      next.q = search.trim();
    }

    if (activeCategory !== "All") {
      next.category = activeCategory;
    }

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory]);

  /* Writers to follow are pulled from real blog authors, so
     the follow button always points at an account that
     exists. */
  const { blogs: allBlogs } = useBlogs({});

  const filteredWriters = useMemo(() => {
    const seen = new Map();

    allBlogs.forEach((blog) => {
      const author = blog.author;

      if (!author?.username || author.username === user?.username) {
        return;
      }

      if (!seen.has(author.username)) {
        seen.set(author.username, { ...author, category: blog.category });
      }
    });

    return [...seen.values()].slice(0, 4);
  }, [allBlogs, user]);

  async function handleShare(blog) {
    const result = await shareBlog(blog);

    if (result.method === "clipboard") {
      showToast("Link copied to clipboard", "success");
    } else if (result.method === "none") {
      showToast("Could not share this blog", "error");
    }
  }

  async function guard(action, fallback) {
    try {
      await action();
    } catch (error) {
      showToast(error?.message || fallback, "error");
    }
  }

  function clearFilters() {
    setSearch("");
    setActiveCategory("All");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <a href="#discover-results" className="skip-link">
        Skip to results
      </a>

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-lg font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link
              to="/home"
              className="text-sm font-medium text-neutral-500 hover:text-violet-600"
            >
              Home
            </Link>

            <span
              aria-current="page"
              className="text-sm font-bold text-violet-600"
            >
              Discover
            </span>

            {user ? (
              <>
                <Link
                  to="/create"
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Create Blog
                </Link>

                <Link
                  to="/profile"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                >
                  {user.name.split(" ")[0]}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          <Link
            to="/home"
            className="text-sm font-bold text-violet-600 md:hidden"
          >
            Feed
          </Link>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
        {/* HERO */}

        <section className="rounded-[32px] bg-neutral-950 px-6 py-12 text-center sm:px-10 sm:py-16 dark:bg-neutral-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            Discover something new
          </p>

          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            Find stories worth
            <span className="text-violet-400"> reading.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
            Search through stories, explore topics, discover new writers, and
            find your next favorite blog.
          </p>

          {/* SEARCH */}

          <div className="mx-auto mt-8 max-w-2xl">
            <label htmlFor="discover-search" className="sr-only">
              Search blogs, writers and topics
            </label>

            <div className="flex items-center rounded-2xl border border-white/10 bg-white px-4 py-1 shadow-2xl">
              <SearchIcon />

              <input
                id="discover-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search blogs, writers, topics..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================= CATEGORIES ================= */}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight">
              Browse topics
            </h2>

            <span className="text-xs text-neutral-400" aria-live="polite">
              {filteredBlogs.length}{" "}
              {filteredBlogs.length === 1 ? "story" : "stories"}
            </span>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  activeCategory === category
                    ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* ================= CONTENT GRID ================= */}

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* BLOGS */}

          <section id="discover-results">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
                  {search.trim() ? "Search results" : "Recommended"}
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  {search.trim()
                    ? `Results for "${search.trim()}"`
                    : "Stories for you"}
                </h2>
              </div>

              <span className="hidden text-xs text-neutral-400 sm:block">
                Updated regularly
              </span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <GridCardSkeleton />
                <GridCardSkeleton />
              </div>
            ) : filteredBlogs.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {filteredBlogs.map((blog) => {
                  const liked = isLiked(blog.id);
                  const saved = isSaved(blog.id);
                  const authorHandle = String(
                    getAuthorUsername(blog)
                  ).replace("@", "");

                  return (
                    <article
                      key={blog.id}
                      className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none"
                    >
                      <Link to={`/blog/${blog.id}`}>
                        <div className="relative overflow-hidden">
                          <SafeImage
                            src={getBlogImage(blog)}
                            alt={blog.title}
                            className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-violet-700 shadow">
                            {blog.category}
                          </span>
                        </div>
                      </Link>

                      <div className="p-5">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/u/${encodeURIComponent(authorHandle)}`}
                            className="shrink-0"
                          >
                            <SafeImage
                              src={getAuthorAvatar(blog)}
                              alt={getAuthorName(blog)}
                              className="h-8 w-8 rounded-full object-cover"
                              fallbackLabel=""
                            />
                          </Link>

                          <div className="min-w-0">
                            <Link
                              to={`/u/${encodeURIComponent(authorHandle)}`}
                              className="block truncate text-xs font-bold hover:text-violet-600"
                            >
                              {getAuthorName(blog)}
                            </Link>

                            <p className="truncate text-[10px] text-neutral-400">
                              {getAuthorUsername(blog)}
                            </p>
                          </div>
                        </div>

                        <Link to={`/blog/${blog.id}`}>
                          <h3 className="mt-4 text-xl font-black leading-tight tracking-tight transition group-hover:text-violet-600">
                            {blog.title}
                          </h3>
                        </Link>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                          {blog.description}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                          <span className="text-[11px] text-neutral-400">
                            {estimateReadTime(blog)}
                          </span>

                          <div className="flex items-center gap-3 text-xs text-neutral-400">
                            <button
                              type="button"
                              onClick={() =>
                                guard(
                                  () => toggleLike(blog),
                                  "Sign in to like blogs"
                                )
                              }
                              aria-pressed={liked}
                              aria-label={
                                liked
                                  ? `Unlike ${blog.title}`
                                  : `Like ${blog.title}`
                              }
                              className={`flex items-center gap-1 transition ${
                                liked
                                  ? "text-red-500"
                                  : "hover:text-red-500"
                              }`}
                            >
                              <HeartIcon liked={liked} />
                              {formatCount(likeCount(blog))}
                            </button>

                            <Link
                              to={`/blog/${blog.id}#comments`}
                              aria-label={`Comments on ${blog.title}`}
                              className="flex items-center gap-1 transition hover:text-violet-600"
                            >
                              <CommentIcon />
                              {formatCount(blog.comments || 0)}
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                guard(
                                  () => toggleSave(blog.id),
                                  "Sign in to save blogs"
                                )
                              }
                              aria-pressed={saved}
                              aria-label={
                                saved
                                  ? `Remove ${blog.title} from saved blogs`
                                  : `Save ${blog.title}`
                              }
                              className={`transition ${
                                saved
                                  ? "text-violet-600"
                                  : "hover:text-violet-600"
                              }`}
                            >
                              <BookmarkIcon active={saved} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShare(blog)}
                              aria-label={`Share ${blog.title}`}
                              className="transition hover:text-violet-600"
                            >
                              <ShareIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<SearchIcon />}
                title="No stories found"
                description="Try another search term or choose a different category."
                actionLabel="Clear filters"
                onAction={clearFilters}
                className="border-dashed"
              />
            )}
          </section>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-5">
            {/* Trending */}

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    What's hot
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Trending topics
                  </h2>
                </div>

                <TrendingIcon />
              </div>

              <div className="mt-5 space-y-2">
                {trendingTopics.map((topic, index) => (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => {
                      setSearch(topic.name);
                      setActiveCategory("All");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600 dark:bg-violet-500/10">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-neutral-700 dark:text-neutral-200">
                        {topic.name}
                      </span>

                      <span className="mt-0.5 block text-[10px] text-neutral-400">
                        {topic.posts}
                      </span>
                    </span>

                    <ArrowIcon />
                  </button>
                ))}
              </div>
            </div>

            {/* Writers */}

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Community
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Writers to follow
                  </h2>
                </div>
              </div>

              {filteredWriters.length === 0 && (
                <p className="mt-5 text-xs text-neutral-400">
                  No other writers yet.
                </p>
              )}

              <div className="mt-5 space-y-4">
                {filteredWriters.map((writer) => {
                  const following = isFollowing(writer.username);

                  return (
                    <div
                      key={writer.username}
                      className="flex items-center gap-3"
                    >
                      <Link
                        to={`/u/${writer.username.replace("@", "")}`}
                        className="shrink-0"
                      >
                        <SafeImage
                          src={writer.avatar}
                          alt={writer.name}
                          className="h-10 w-10 rounded-full object-cover"
                          fallbackLabel=""
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/u/${writer.username.replace("@", "")}`}
                          className="block truncate text-xs font-bold hover:text-violet-600"
                        >
                          {writer.name}
                        </Link>

                        <p className="truncate text-[10px] text-neutral-400">
                          {writer.username}
                        </p>

                        <p className="mt-0.5 text-[10px] text-violet-600">
                          {writer.category}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          guard(
                            () => toggleFollow(writer.username),
                            "Sign in to follow writers"
                          )
                        }
                        aria-pressed={following}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                          following
                            ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            : "bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white dark:bg-violet-500/10 dark:text-violet-300"
                        }`}
                      >
                        {following ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}

            <div className="rounded-3xl bg-violet-600 p-6 text-white shadow-xl shadow-violet-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <span className="text-lg font-black">I</span>
              </div>

              <h2 className="mt-5 text-xl font-black">
                Have something to say?
              </h2>

              <p className="mt-2 text-xs leading-5 text-violet-100">
                Turn your ideas into stories and share them with the INKORA
                community.
              </p>

              <Link
                to="/create"
                className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-xs font-bold text-violet-700 hover:bg-violet-50"
              >
                Start Writing
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

export default Discover;
