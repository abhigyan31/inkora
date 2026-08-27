import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import SafeImage from "../../components/SafeImage";
import { BlogCardSkeleton, EmptyState, Toast } from "../../components/States";

import {
  useAllBlogs,
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
  useComments,
  shareBlog,
} from "../../utils/social";
import { useUnreadCount } from "../../utils/notifications";
import { useCurrentUser } from "../../utils/session";
import { useToast } from "../../utils/useToast";
import { blogDate, formatCount } from "../../utils/format";

/* Sample blogs live in demoData.js so Feed, Discover and the
   reader all resolve the same id to the same blog.
   useAllBlogs() puts real posts above them. */

import { demoWriters as writers, topics } from "../../utils/demoData";

function HomeIcon({ active }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function UsersIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg
      width="19"
      height="19"
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

function EditIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

function UserIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.41 1.41-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5h-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.41-1.41.06-.06A1.65 1.65 0 0 0 9.6 15a1.65 1.65 0 0 0-1.51-1H8v-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.41-1.41.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V6.5h2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.41 1.41-.06.06A1.65 1.65 0 0 0 19.4 11c.08.38.38.69.76.78H20v2h-.09a1.65 1.65 0 0 0-.51 1.22Z" />
    </svg>
  );
}

function HeartIcon({ liked }) {
  return (
    <svg
      width="18"
      height="18"
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
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function ShareIcon() {
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
      <path d="m4 12 16-8-5 16-4-7-7-1Z" />
      <path d="m11 13 4-4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/* =========================================================
   FEED CARD

   Pulled into its own component so each card can read its
   own live comment count.
========================================================= */

function FeedCard({
  blog,
  liked,
  likeCount,
  isSaved,
  onToggleLike,
  onToggleSave,
  onShare,
}) {
  const comments = useComments(blog.id);

  const commentCount = (Number(blog.comments) || 0) + comments.length;

  const authorName = getAuthorName(blog);
  const authorUsername = getAuthorUsername(blog);

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      {/* Author */}

      <div className="flex items-center gap-3 px-5 pt-5">
        <Link
          to={`/u/${encodeURIComponent(
            String(authorUsername).replace("@", "")
          )}`}
          className="shrink-0"
        >
          <SafeImage
            src={getAuthorAvatar(blog)}
            alt={authorName}
            className="h-10 w-10 rounded-full object-cover"
            fallbackLabel=""
          />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/u/${encodeURIComponent(
                String(authorUsername).replace("@", "")
              )}`}
              className="text-sm font-bold hover:text-violet-600 dark:text-white"
            >
              {authorName}
            </Link>

            <span className="text-xs text-neutral-400">·</span>

            <span className="text-xs text-neutral-400">
              {blogDate(blog)}
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            {authorUsername}
          </p>
        </div>

        <div className="ml-auto rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          {blog.category}
        </div>
      </div>

      {/* Text */}

      <div className="px-5 pt-4">
        <Link to={`/blog/${blog.id}`}>
          <h2 className="text-xl font-black leading-tight tracking-[-0.025em] transition hover:text-violet-600 dark:text-white sm:text-2xl">
            {blog.title}
          </h2>
        </Link>

        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {blog.description}
        </p>
      </div>

      {/* Image */}

      <Link
        to={`/blog/${blog.id}`}
        className="mt-4 block overflow-hidden"
      >
        <SafeImage
          src={getBlogImage(blog)}
          alt={blog.title}
          className="h-[300px] w-full object-cover transition duration-500 hover:scale-[1.02] sm:h-[350px]"
        />
      </Link>

      {/* Actions */}

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between border-b border-neutral-100 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onToggleLike(blog)}
              aria-pressed={liked}
              aria-label={
                liked
                  ? `Unlike ${blog.title}`
                  : `Like ${blog.title}`
              }
              className={`flex items-center gap-2 text-sm transition ${
                liked
                  ? "text-red-500"
                  : "text-neutral-400 hover:text-red-500"
              }`}
            >
              <HeartIcon liked={liked} />
              {formatCount(likeCount)}
            </button>

            <Link
              to={`/blog/${blog.id}#comments`}
              aria-label={`${commentCount} comments on ${blog.title}`}
              className="flex items-center gap-2 text-sm text-neutral-400 transition hover:text-violet-600"
            >
              <CommentIcon />
              {formatCount(commentCount)}
            </Link>

            <button
              type="button"
              onClick={() => onToggleSave(blog.id)}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Remove ${blog.title} from saved blogs`
                  : `Save ${blog.title}`
              }
              className={`transition ${
                isSaved
                  ? "text-violet-600"
                  : "text-neutral-400 hover:text-violet-600"
              }`}
            >
              <BookmarkIcon active={isSaved} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onShare(blog)}
            aria-label={`Share ${blog.title}`}
            className="text-neutral-400 transition hover:text-violet-600"
          >
            <ShareIcon />
          </button>
        </div>

        <div className="pt-3 text-xs text-neutral-400">
          {estimateReadTime(blog)}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   FEED
========================================================= */

function Feed() {
  const [activeTab, setActiveTab] = useState("For You");

  const user = useCurrentUser();
  const unreadCount = useUnreadCount();

  const { isSaved, toggleSave, savedCount } = useSaved();
  const { isLiked, toggleLike, likeCount } = useLikes();
  const { isFollowing, toggleFollow, followingCount } = useFollowing();

  const { toast, showToast } = useToast();

  /* User-created blogs first, demo blogs underneath. */
  const blogs = useAllBlogs();

  /* First paint has nothing committed yet, so the feed shows
     placeholder cards for a frame instead of jumping. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const visibleBlogs = useMemo(() => {
    if (activeTab === "Following") {
      return blogs.filter((blog) =>
        isFollowing(getAuthorUsername(blog))
      );
    }

    if (activeTab === "Trending") {
      return [...blogs].sort(
        (first, second) => likeCount(second) - likeCount(first)
      );
    }

    return blogs;
  }, [blogs, activeTab, isFollowing, likeCount]);

  async function handleShare(blog) {
    const result = await shareBlog(blog);

    if (result.method === "clipboard") {
      showToast("Link copied to clipboard", "success");
    } else if (result.method === "none") {
      showToast("Could not share this blog", "error");
    }
  }

  const profileHandle = user?.username || "@alexwrites";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <a href="#feed-content" className="skip-link">
        Skip to blogs
      </a>

      {/* ================= DESKTOP SIDEBAR ================= */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[245px] border-r border-neutral-200 bg-white lg:block dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-full flex-col px-4 py-5">
          {/* Logo */}

          <Link
            to="/"
            className="mb-8 flex items-center gap-2.5 px-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-lg font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          {/* Navigation */}

          <nav className="space-y-1" aria-label="Main">
            <Link
              to="/home"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
            >
              <HomeIcon active />
              Home
            </Link>

            <Link
              to="/discover"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <SearchIcon />
              Discover
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("Following")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                activeTab === "Following"
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
              }`}
            >
              <UsersIcon />
              Following

              {followingCount > 0 && (
                <span className="ml-auto text-[10px] font-black text-neutral-400">
                  {followingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("Trending")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                activeTab === "Trending"
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
              }`}
            >
              <TrendingIcon />
              Trending
            </button>
          </nav>

          <div className="my-6 h-px bg-neutral-100 dark:bg-neutral-800" />

          <nav className="space-y-1" aria-label="Your account">
            <Link
              to="/create"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              <EditIcon />
              Create Blog
            </Link>

            <Link
              to="/notifications"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              <BellIcon />
              <span>Notifications</span>

              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[9px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Sidebar navigation only — this is not the card
                bookmark button. */}
            <Link
              to="/profile?tab=saved"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <BookmarkIcon />
              Saved Blogs

              {savedCount > 0 && (
                <span className="ml-auto text-[10px] font-black text-neutral-400">
                  {savedCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              <UserIcon />
              Profile
            </Link>

            <Link
              to="/settings"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-500 transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              <SettingsIcon />
              Settings
            </Link>
          </nav>

          {/* User */}

          <div className="mt-auto rounded-2xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
            <div className="flex items-center gap-3">
              <SafeImage
                src={user?.avatar}
                alt={user?.name || "Your profile"}
                className="h-9 w-9 rounded-full object-cover"
                fallbackLabel=""
              />

              <div className="min-w-0">
                <p className="truncate text-xs font-bold">
                  {user?.name || "Guest"}
                </p>

                <p className="truncate text-[11px] text-neutral-400">
                  {profileHandle}
                </p>
              </div>

              <Link
                to="/settings"
                aria-label="Account settings"
                className="ml-auto text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <MoreIcon />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE HEADER ================= */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl lg:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex h-[64px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-black text-white">
              I
            </div>

            <span className="font-black tracking-tight">INKORA</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/discover"
              aria-label="Search blogs"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500"
            >
              <SearchIcon />
            </Link>

            <Link
              to="/notifications"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500"
            >
              <BellIcon />

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-600" />
              )}
            </Link>

            <Link to="/profile" aria-label="Your profile">
              <SafeImage
                src={user?.avatar}
                alt={user?.name || "Profile"}
                className="h-8 w-8 rounded-full object-cover"
                fallbackLabel=""
              />
            </Link>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="lg:ml-[245px]" id="feed-content">
        <div className="mx-auto grid max-w-[1250px] grid-cols-1 gap-6 px-4 pb-24 pt-5 sm:px-6 lg:grid-cols-[minmax(0,680px)_280px] lg:px-8 lg:pb-7 lg:pt-7 xl:grid-cols-[minmax(0,700px)_300px]">
          {/* ================= FEED ================= */}

          <section>
            {/* Tabs */}

            <div className="sticky top-[64px] z-30 mb-5 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-xl lg:top-0 dark:border-neutral-800 dark:bg-neutral-950/95">
              <div
                className="flex items-center gap-7"
                role="tablist"
                aria-label="Feed filters"
              >
                {["For You", "Following", "Trending"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-4 text-sm font-bold transition ${
                      activeTab === tab
                        ? "text-violet-600"
                        : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    }`}
                  >
                    {tab}

                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed cards */}

            {!ready ? (
              <div className="space-y-5">
                <BlogCardSkeleton />
                <BlogCardSkeleton />
              </div>
            ) : visibleBlogs.length === 0 ? (
              <EmptyState
                icon={<UsersIcon />}
                title={
                  activeTab === "Following"
                    ? "You're not following anyone yet"
                    : "No blogs yet"
                }
                description={
                  activeTab === "Following"
                    ? "Follow a few writers and their newest stories will show up right here."
                    : "Publish your first blog and it will appear at the top of this feed."
                }
                actionLabel={
                  activeTab === "Following"
                    ? "Find writers"
                    : "Create a blog"
                }
                actionTo={
                  activeTab === "Following" ? "/discover" : "/create"
                }
              />
            ) : (
              <div className="space-y-5">
                {visibleBlogs.map((blog) => (
                  <FeedCard
                    key={blog.id}
                    blog={blog}
                    liked={isLiked(blog.id)}
                    likeCount={likeCount(blog)}
                    isSaved={isSaved(blog.id)}
                    onToggleLike={toggleLike}
                    onToggleSave={toggleSave}
                    onShare={handleShare}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ================= RIGHT SIDEBAR ================= */}

          <aside className="hidden lg:block">
            <div className="sticky top-7 space-y-5">
              {/* Trending topics */}

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider">
                    Trending Topics
                  </h2>

                  <Link
                    to="/discover"
                    className="text-[11px] font-bold text-violet-600"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-5 space-y-1">
                  {topics.slice(0, 8).map((topic, index) => (
                    <Link
                      key={topic}
                      to={`/discover?category=${encodeURIComponent(topic)}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-[10px] font-black text-violet-600 dark:bg-violet-500/10">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                        {topic}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Suggested writers */}

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider">
                    Suggested Writers
                  </h2>

                  <span className="text-[11px] font-bold text-violet-600">
                    For you
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {writers.slice(0, 3).map((writer) => {
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
                            src={writer.image}
                            alt={writer.name}
                            className="h-9 w-9 rounded-full object-cover"
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
                            {writer.followers} followers
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleFollow(writer.username, writer)
                          }
                          aria-pressed={following}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
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

                <Link
                  to="/discover"
                  className="mt-5 block w-full text-center text-xs font-bold text-violet-600"
                >
                  View more
                </Link>
              </div>

              {/* Create CTA */}

              <div className="rounded-3xl bg-violet-600 p-5 text-white shadow-xl shadow-violet-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <EditIcon />
                </div>

                <h2 className="mt-4 text-lg font-black">
                  Have a story to tell?
                </h2>

                <p className="mt-2 text-xs leading-5 text-violet-100">
                  Share your ideas, experiences, and knowledge with the INKORA
                  community.
                </p>

                <Link
                  to="/create"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                >
                  <PlusIcon />
                  Create Blog
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ================= MOBILE BOTTOM NAV ================= */}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden dark:border-neutral-800 dark:bg-neutral-900/95"
        aria-label="Mobile"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link
            to="/home"
            aria-current="page"
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-violet-600"
          >
            <HomeIcon active />
            <span className="text-[9px] font-bold">Home</span>
          </Link>

          <Link
            to="/discover"
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-neutral-400"
          >
            <SearchIcon />
            <span className="text-[9px] font-bold">Discover</span>
          </Link>

          <Link
            to="/create"
            aria-label="Create a blog"
            className="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-300"
          >
            <PlusIcon />
          </Link>

          <Link
            to="/notifications"
            className="relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-neutral-400"
          >
            <BellIcon />
            <span className="text-[9px] font-bold">Alerts</span>

            {unreadCount > 0 && (
              <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-violet-600" />
            )}
          </Link>

          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-neutral-400 transition hover:text-violet-600"
          >
            <UserIcon />
            <span className="text-[9px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

export default Feed;
