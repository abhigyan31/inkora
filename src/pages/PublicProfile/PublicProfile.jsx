/* =========================================================
   INKORA PUBLIC PROFILE  —  /u/:username

   Works for two kinds of writer:
   - a real account created through signup
   - one of the demo writers behind the sample blogs
========================================================= */

import { useMemo } from "react";
import { Link, useParams } from "react-router";

import SafeImage from "../../components/SafeImage";
import { EmptyState, Toast } from "../../components/States";

import {
  useAllBlogs,
  getAuthorUsername,
  getBlogImage,
  estimateReadTime,
} from "../../utils/blogStorage";

import {
  useSaved,
  useLikes,
  useFollowing,
  shareBlog,
} from "../../utils/social";

import {
  findUserByUsername,
  normalizeUsername,
  useCurrentUser,
} from "../../utils/session";

import { findWriter } from "../../utils/demoData";
import { useStore, KEYS } from "../../utils/store";
import { useToast } from "../../utils/useToast";
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

function PublicProfile() {
  const { username } = useParams();

  const handle = normalizeUsername(username);

  const currentUser = useCurrentUser();

  /* Re-read when accounts or blogs change. */
  const [users] = useStore(KEYS.users, []);

  const blogs = useAllBlogs();

  const { isSaved, toggleSave } = useSaved();
  const { isLiked, toggleLike, likeCount } = useLikes();
  const { isFollowing, toggleFollow } = useFollowing();

  const { toast, showToast } = useToast();

  const writer = useMemo(() => {
    const account = findUserByUsername(handle);

    if (account) {
      return {
        name: account.name,
        username: account.username,
        bio: account.bio,
        avatar: account.avatar,
        coverImage: account.coverImage,
        isAccount: true,
      };
    }

    const demoWriter = findWriter(handle);

    if (demoWriter) {
      return {
        name: demoWriter.name,
        username: demoWriter.username,
        bio: `Writing about ${demoWriter.category?.toLowerCase() || "life"} on INKORA.`,
        avatar: demoWriter.image,
        coverImage: "",
        followers: demoWriter.followers,
        isAccount: false,
      };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, users]);

  const writerBlogs = useMemo(
    () =>
      blogs.filter(
        (blog) =>
          String(getAuthorUsername(blog)).toLowerCase() ===
          handle.toLowerCase()
      ),
    [blogs, handle]
  );

  async function handleShare(blog) {
    const result = await shareBlog(blog);

    if (result.method === "clipboard") {
      showToast("Link copied to clipboard", "success");
    }
  }

  /* =========================================================
     UNKNOWN WRITER
  ========================================================= */

  if (!writer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white">
            I
          </div>

          <h1 className="mt-6 text-3xl font-black dark:text-white">
            Writer not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Nobody on this device writes under {handle}.
          </p>

          <Link
            to="/discover"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-700"
          >
            Discover writers
          </Link>
        </div>
      </div>
    );
  }

  const following = isFollowing(writer.username);

  const isYou =
    currentUser && currentUser.username === writer.username;

  const totalLikes = writerBlogs.reduce(
    (sum, blog) => sum + likeCount(blog),
    0
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-5 sm:px-8">
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
              className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Feed
            </Link>

            <Link
              to="/discover"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
            >
              Discover
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
        {/* WRITER CARD */}

        <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative h-[180px] sm:h-[240px]">
            {writer.coverImage ? (
              <SafeImage
                src={writer.coverImage}
                alt=""
                className="h-full w-full object-cover"
                fallbackLabel=""
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-600 via-violet-500 to-purple-700" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="relative px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="-mt-16 flex flex-col sm:flex-row sm:items-end">
              {writer.avatar ? (
                <SafeImage
                  src={writer.avatar}
                  alt={writer.name}
                  className="h-28 w-28 rounded-[26px] border-[6px] border-white object-cover shadow-xl dark:border-neutral-900 sm:h-32 sm:w-32"
                  fallbackLabel=""
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-[26px] border-[6px] border-white bg-violet-100 text-3xl font-black text-violet-600 shadow-xl dark:border-neutral-900 sm:h-32 sm:w-32">
                  {initialsOf(writer.name)}
                </div>
              )}

              <div className="mt-5 sm:ml-auto sm:mt-0 sm:pb-1">
                {isYou ? (
                  <Link
                    to="/profile"
                    className="inline-flex rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit your profile
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      toggleFollow(writer.username, writer)
                    }
                    aria-pressed={following}
                    className={`rounded-xl px-6 py-2.5 text-xs font-bold transition ${
                      following
                        ? "border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                        : "bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                    }`}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {writer.name}
              </h1>

              <p className="mt-1 text-sm font-medium text-neutral-400">
                {writer.username}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {writer.bio}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <Stat
                value={writer.followers || (following ? "1" : "0")}
                label="Followers"
              />

              <Stat value={writerBlogs.length} label="Blogs" />

              <Stat value={formatCount(totalLikes)} label="Likes" />
            </div>
          </div>
        </section>

        {/* BLOGS */}

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              Published
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight">
              Blogs by {writer.name.split(" ")[0]}
            </h2>
          </div>

          {writerBlogs.length === 0 ? (
            <EmptyState
              title="Nothing published yet"
              description={`${writer.name} hasn't published a blog on this device.`}
              actionLabel="Browse other writers"
              actionTo="/discover"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {writerBlogs.map((blog) => {
                const liked = isLiked(blog.id);
                const saved = isSaved(blog.id);

                return (
                  <article
                    key={blog.id}
                    className="group overflow-hidden rounded-[24px] border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none"
                  >
                    <Link to={`/blog/${blog.id}`}>
                      <div className="relative overflow-hidden">
                        <SafeImage
                          src={getBlogImage(blog)}
                          alt={blog.title}
                          className="h-[200px] w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-violet-700 shadow-lg">
                          {blog.category}
                        </span>
                      </div>
                    </Link>

                    <div className="p-5">
                      <Link to={`/blog/${blog.id}`}>
                        <h3 className="line-clamp-2 text-lg font-black leading-tight transition group-hover:text-violet-600">
                          {blog.title}
                        </h3>
                      </Link>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                        {blog.description}
                      </p>

                      <p className="mt-3 text-[10px] text-neutral-400">
                        {blogDate(blog)} · {estimateReadTime(blog)}
                      </p>

                      <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 pt-4 text-[10px] font-semibold text-neutral-400 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => toggleLike(blog)}
                          aria-pressed={liked}
                          aria-label={liked ? "Unlike" : "Like"}
                          className={`flex items-center gap-1 transition ${
                            liked ? "text-red-500" : "hover:text-red-500"
                          }`}
                        >
                          <HeartIcon liked={liked} />
                          {formatCount(likeCount(blog))}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSave(blog.id)}
                          aria-pressed={saved}
                          aria-label={saved ? "Remove from saved" : "Save"}
                          className={`flex items-center gap-1 transition ${
                            saved
                              ? "text-violet-600"
                              : "hover:text-violet-600"
                          }`}
                        >
                          <BookmarkIcon active={saved} />
                          {saved ? "Saved" : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(blog)}
                          aria-label="Share"
                          className="ml-auto transition hover:text-violet-600"
                        >
                          <ShareIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-lg font-black">{value}</p>

      <p className="mt-0.5 text-[10px] font-semibold text-neutral-400">
        {label}
      </p>
    </div>
  );
}

export default PublicProfile;
