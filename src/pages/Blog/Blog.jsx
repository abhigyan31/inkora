import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import BlogPdf from "../../components/BlogPdf";
import SafeImage from "../../components/SafeImage";
import { EmptyState, Toast } from "../../components/States";

import {
  useBlog,
  deleteBlog,
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
  useCommentLikes,
  addComment,
  deleteComment,
  deleteCommentsForBlog,
  recordView,
  useViews,
  shareBlog,
} from "../../utils/social";

import { useCurrentUser } from "../../utils/session";
import { useToast } from "../../utils/useToast";
import {
  blogDate,
  formatCount,
  formatRelativeTime,
  initialsOf,
} from "../../utils/format";

/* =========================================================
   ICONS
========================================================= */

function HeartIcon({ liked }) {
  return (
    <svg
      width="17"
      height="17"
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
      width="17"
      height="17"
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
      width="17"
      height="17"
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

function EyeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* =========================================================
   COMMENT
========================================================= */

function Comment({
  comment,
  replies,
  onToggleCommentLike,
  onReply,
  onDelete,
  depth = 0,
}) {
  /* The API decides both of these - it knows whether you own
     the comment, or the blog it's on. */
  const liked = Boolean(comment.likedByMe);
  const canDelete = Boolean(comment.canDelete);

  return (
    <div className={depth > 0 ? "ml-8 sm:ml-12" : ""}>
      <div className="flex gap-3">
        {comment.authorAvatar ? (
          <SafeImage
            src={comment.authorAvatar}
            alt={comment.authorName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            fallbackLabel=""
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-black dark:bg-neutral-800">
            {initialsOf(comment.authorName)}
          </div>
        )}

        <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black dark:text-white">
                {comment.authorName}
              </p>

              <p className="truncate text-[10px] text-neutral-400">
                {comment.authorUsername}
              </p>
            </div>

            <span className="shrink-0 text-[10px] text-neutral-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {comment.text}
          </p>

          <div className="mt-3 flex gap-4 text-[10px] font-bold text-neutral-400">
            <button
              type="button"
              onClick={() => onToggleCommentLike(comment)}
              aria-pressed={liked}
              className={`transition ${
                liked ? "text-red-500" : "hover:text-red-500"
              }`}
            >
              {liked ? "♥ Liked" : "♡ Like"}
              {comment.likes > 0 ? ` ${comment.likes}` : ""}
            </button>

            {depth === 0 && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="transition hover:text-violet-600"
              >
                Reply
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="ml-auto transition hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              replies={[]}
              onToggleCommentLike={onToggleCommentLike}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   BLOG
========================================================= */

function Blog() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = useCurrentUser();

  const { blog, loading } = useBlog(id);

  const { isSaved, toggleSave } = useSaved();
  const { isLiked, toggleLike, likeCount } = useLikes();
  const { isFollowing, toggleFollow } = useFollowing();
  const { toggleCommentLike } = useCommentLikes(id);

  const comments = useComments(id);
  const views = useViews(id);

  const { toast, showToast } = useToast();

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [visibleComments, setVisibleComments] = useState(5);
  const [showDelete, setShowDelete] = useState(false);
  const [posting, setPosting] = useState(false);

  /* Count one view per page visit. The ref keeps React's
     development double-effect from counting twice. */

  const viewedRef = useRef("");

  useEffect(() => {
    if (!blog || viewedRef.current === String(blog.id)) {
      return;
    }

    viewedRef.current = String(blog.id);

    recordView(blog.id);
  }, [blog]);

  /* Support /blog/:id#comments coming from the feed. */

  useEffect(() => {
    if (!blog || window.location.hash !== "#comments") {
      return;
    }

    const target = document.getElementById("comments");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [blog]);

  const topLevelComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments]
  );

  const repliesFor = useMemo(() => {
    const map = {};

    comments.forEach((comment) => {
      if (!comment.parentId) {
        return;
      }

      const key = String(comment.parentId);

      map[key] = [...(map[key] || []), comment];
    });

    return map;
  }, [comments]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-bold text-neutral-500 dark:text-neutral-400">
            Loading this blog...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white">
            I
          </div>

          <h1 className="mt-6 text-3xl font-black dark:text-white">
            Blog not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            This blog doesn't exist, or it was deleted. If you published it in
            a different browser, it won't be on this device.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/home"
              className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              Back to Feed
            </Link>

            <Link
              to="/discover"
              className="rounded-xl border border-neutral-200 px-5 py-3 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
            >
              Discover blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     DERIVED
  ========================================================= */

  const authorName = getAuthorName(blog);
  const authorUsername = getAuthorUsername(blog);
  const authorHandle = String(authorUsername).replace("@", "");

  const liked = isLiked(blog.id);
  const saved = isSaved(blog.id);
  const following = isFollowing(authorUsername);

  /* The API decides this too, but the button still has to
     know whether to render. The server re-checks on the
     actual edit or delete request. */
  const isOwnBlog =
    Boolean(currentUser) &&
    (blog.author?.id === currentUser.id ||
      authorUsername === currentUser.username);

  const paragraphs = Array.isArray(blog.content) ? blog.content : [];

  /* =========================================================
     ACTIONS
  ========================================================= */

  async function handleComment() {
    const value = commentText.trim();

    if (!value || posting) {
      return;
    }

    if (!currentUser) {
      showToast("Sign in to join the conversation", "error");
      return;
    }

    const wasReply = Boolean(replyTo);

    setPosting(true);

    try {
      await addComment(blog, value, replyTo?.id || null);

      setCommentText("");
      setReplyTo(null);

      showToast(wasReply ? "Reply posted" : "Comment posted", "success");
    } catch (error) {
      showToast(error?.message || "Could not post that comment", "error");
    } finally {
      setPosting(false);
    }
  }

  async function handleToggleLike() {
    try {
      await toggleLike(blog);
    } catch (error) {
      showToast(error?.message || "Could not update that like", "error");
    }
  }

  async function handleToggleSave() {
    try {
      await toggleSave(blog.id);
    } catch (error) {
      showToast(error?.message || "Could not update your saved blogs", "error");
    }
  }

  async function handleToggleFollow() {
    try {
      await toggleFollow(authorUsername);
    } catch (error) {
      showToast(error?.message || "Could not update who you follow", "error");
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(blog.id, commentId);
    } catch (error) {
      showToast(error?.message || "Could not delete that comment", "error");
    }
  }

  async function handleShare() {
    const result = await shareBlog(blog);

    if (result.method === "clipboard") {
      showToast("Link copied to clipboard", "success");
    } else if (result.method === "none") {
      showToast("Could not share this blog", "error");
    }
  }

  async function handleDeleteBlog() {
    try {
      await deleteBlog(blog.id);

      deleteCommentsForBlog(blog.id);

      setShowDelete(false);

      navigate("/profile", { replace: true });
    } catch (error) {
      setShowDelete(false);
      showToast(error?.message || "Could not delete that blog", "error");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-violet-600 dark:text-neutral-300"
          >
            <span className="text-lg" aria-hidden="true">←</span>
            Back
          </button>

          <Link
            to="/home"
            className="text-xl font-black tracking-tight"
          >
            INKORA
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/read/${blog.id}`}
              className="hidden rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 transition hover:bg-violet-50 hover:text-violet-700 sm:block dark:bg-neutral-800 dark:text-neutral-300"
            >
              Reader view
            </Link>

            <button
              type="button"
              onClick={handleToggleSave}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save this blog"}
              className={`rounded-xl px-3 py-2 transition ${
                saved
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "bg-neutral-100 text-neutral-600 hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              <BookmarkIcon active={saved} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this blog"
              className="rounded-xl bg-neutral-100 px-3 py-2 text-neutral-600 transition hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <ShareIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        {/* ================= THUMBNAIL ================= */}

        {getBlogImage(blog) && (
          <div className="overflow-hidden rounded-[28px]">
            <SafeImage
              src={getBlogImage(blog)}
              alt={blog.title}
              className="h-[260px] w-full object-cover sm:h-[420px]"
            />
          </div>
        )}

        {/* ================= BLOG CONTENT ================= */}

        <section className="mx-auto max-w-4xl">
          {/* META */}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {blog.category && (
              <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                {blog.category}
              </span>
            )}

            <span className="text-xs text-neutral-400">
              {estimateReadTime(blog)}
            </span>

            <span className="text-xs text-neutral-400">•</span>

            <span className="text-xs text-neutral-400">
              {blogDate(blog)}
            </span>

            {blog.updatedAt && (
              <>
                <span className="text-xs text-neutral-400">•</span>

                <span className="text-xs text-neutral-400">
                  edited
                </span>
              </>
            )}
          </div>

          {/* TITLE */}

          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            {blog.title}
          </h1>

          {/* DESCRIPTION */}

          <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-500 dark:text-neutral-400 sm:text-lg">
            {blog.description}
          </p>

          {/* ================= AUTHOR ================= */}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-y border-neutral-200 py-5 dark:border-neutral-800">
            <Link
              to={`/u/${encodeURIComponent(authorHandle)}`}
              className="flex items-center gap-3"
            >
              {getAuthorAvatar(blog) ? (
                <SafeImage
                  src={getAuthorAvatar(blog)}
                  alt={authorName}
                  className="h-12 w-12 rounded-full object-cover"
                  fallbackLabel=""
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-black text-violet-600 dark:bg-violet-500/10">
                  {initialsOf(authorName)}
                </div>
              )}

              <div>
                <p className="text-sm font-black">
                  {authorName}
                </p>

                <p className="text-xs text-neutral-400">
                  {authorUsername}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {isOwnBlog ? (
                <>
                  <Link
                    to={`/blog/${blog.id}/edit`}
                    className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="rounded-xl bg-red-50 px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  aria-pressed={following}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                    following
                      ? "border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* ================= TAGS ================= */}

          {Array.isArray(blog.tags) && blog.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/discover?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold text-neutral-500 transition hover:bg-violet-50 hover:text-violet-700 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* ================= ARTICLE TEXT ================= */}

          {paragraphs.length > 0 && (
            <article className="mt-10 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-8 text-neutral-700 dark:text-neutral-300"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          )}

          {/* ================= PDF ================= */}

          {blog.pdf && (
            <section className="mt-10">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-wider">
                  Blog Document
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Read the complete story below.
                </p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {blog.title}
                    </p>

                    <p className="mt-1 text-[10px] text-neutral-400">
                      Published by {authorUsername}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    PDF
                  </span>
                </div>

                <div className="bg-neutral-50 p-4 dark:bg-neutral-950 sm:p-6">
                  <BlogPdf file={blog.pdf} />
                </div>
              </div>
            </section>
          )}

          {!blog.pdf && paragraphs.length === 0 && (
            <div className="mt-10">
              <EmptyState
                title="No document attached"
                description="This blog was published without a PDF or written body."
              />
            </div>
          )}

          {/* ================= ACTION BAR ================= */}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-neutral-200 py-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLike}
                aria-pressed={liked}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  liked
                    ? "bg-red-50 text-red-500 dark:bg-red-500/10"
                    : "bg-neutral-100 text-neutral-600 hover:bg-red-50 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                <HeartIcon liked={liked} />
                {formatCount(likeCount(blog))}
              </button>

              <a
                href="#comments"
                className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <CommentIcon />
                {formatCount((Number(blog.comments) || 0) + comments.length)}
              </a>

              <button
                type="button"
                onClick={handleToggleSave}
                aria-pressed={saved}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  saved
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                    : "bg-neutral-100 text-neutral-600 hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                <BookmarkIcon active={saved} />
                {saved ? "Saved" : "Save"}
              </button>

              <span className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-400">
                <EyeIcon />
                {formatCount(views)} views
              </span>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-violet-50 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <ShareIcon />
              Share
            </button>
          </div>

          {/* ================= COMMENTS ================= */}

          <section id="comments" className="mt-10 scroll-mt-24">
            <h2 className="text-2xl font-black">
              Comments
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              {topLevelComments.length === 0
                ? "Be the first to say something."
                : "Join the conversation."}
            </p>

            {/* COMMENT INPUT */}

            {replyTo && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3 dark:bg-violet-500/10">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300">
                  Replying to {replyTo.authorName}
                </p>

                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-[10px] font-bold text-violet-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {currentUser?.avatar ? (
                <SafeImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  fallbackLabel=""
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-600 dark:bg-violet-500/10">
                  {initialsOf(currentUser?.name || "Guest")}
                </div>
              )}

              <div className="flex flex-1 gap-2">
                <label htmlFor="comment-input" className="sr-only">
                  Write a comment
                </label>

                <input
                  id="comment-input"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleComment();
                    }
                  }}
                  maxLength={500}
                  placeholder={
                    currentUser
                      ? "Write a comment..."
                      : "Sign in to write a comment"
                  }
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-neutral-800 dark:bg-neutral-900"
                />

                <button
                  type="button"
                  onClick={handleComment}
                  disabled={!commentText.trim() || posting}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {posting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>

            {/* COMMENT LIST */}

            {topLevelComments.length > 0 ? (
              <div className="mt-8 space-y-5">
                {topLevelComments
                  .slice(0, visibleComments)
                  .map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      replies={repliesFor[String(comment.id)] || []}
                      onToggleCommentLike={toggleCommentLike}
                      onReply={setReplyTo}
                      onDelete={handleDeleteComment}
                    />
                  ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 p-8 text-center dark:border-neutral-800">
                <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  No comments yet
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Your comment will be saved on this device.
                </p>
              </div>
            )}

            {topLevelComments.length > visibleComments && (
              <button
                type="button"
                onClick={() =>
                  setVisibleComments((current) => current + 5)
                }
                className="mt-8 w-full rounded-xl border border-neutral-200 py-3 text-xs font-bold text-violet-600 transition hover:bg-violet-50 dark:border-neutral-800 dark:hover:bg-violet-500/10"
              >
                View more comments
              </button>
            )}
          </section>
        </section>
      </main>

      {/* ================= DELETE MODAL ================= */}

      {showDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-neutral-900 shadow-2xl dark:bg-neutral-900 dark:text-white">
            <h2 className="text-center text-2xl font-black">
              Delete this blog?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              "{blog.title}" and its comments will be removed from this device.
              This cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteBlog}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-xs font-bold text-white hover:bg-red-600"
              >
                Delete Blog
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

export default Blog;
