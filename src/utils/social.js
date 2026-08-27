/* =========================================================
   INKORA SOCIAL LAYER

   Likes, bookmarks, follows, comments, views and sharing,
   all backed by MySQL now.

   Likes and bookmarks update the screen before the request
   finishes and roll back if it fails. Over a slow phone
   connection, waiting 400ms for a bookmark icon to fill in
   feels broken even though nothing is wrong.
========================================================= */

import { useCallback, useMemo } from "react";
import { api } from "./api";
import { useResource, invalidate, setCache, peek } from "./apiStore";
import { useSession } from "./session";

const BOOKMARKS = "bookmarks";
const LIKES = "likes";
const FOLLOWING = "following";

/* ---------------------------------------------------------
   BOOKMARKS
--------------------------------------------------------- */

function fetchBookmarks() {
  return api.get("/me/bookmarks").then((data) => data?.blogIds ?? []);
}

export function useSaved() {
  const { user } = useSession();

  const { data } = useResource(
    user ? BOOKMARKS : null,
    fetchBookmarks,
    []
  );

  const ids = useMemo(() => new Set(data || []), [data]);

  const isSaved = useCallback((id) => ids.has(String(id)), [ids]);

  const toggleSave = useCallback(
    (id) => toggleSaveBlog(id, ids.has(String(id))),
    [ids]
  );

  /* Kept as a map because the pages were written against
     the old { blogId: true } shape. */
  const saved = useMemo(() => {
    const map = {};
    ids.forEach((id) => {
      map[id] = true;
    });
    return map;
  }, [ids]);

  return { saved, isSaved, toggleSave, savedCount: ids.size };
}

export async function toggleSaveBlog(id, currentlySaved) {
  const key = String(id);
  const before = peek(BOOKMARKS) || [];

  const next = currentlySaved
    ? before.filter((item) => item !== key)
    : [key, ...before];

  setCache(BOOKMARKS, next);

  try {
    if (currentlySaved) {
      await api.delete(`/blogs/${encodeURIComponent(key)}/bookmark`);
    } else {
      await api.put(`/blogs/${encodeURIComponent(key)}/bookmark`);
    }
  } catch (error) {
    setCache(BOOKMARKS, before);
    throw error;
  }

  return !currentlySaved;
}

/* ---------------------------------------------------------
   LIKES
--------------------------------------------------------- */

function fetchLikes() {
  return api.get("/me/likes").then((data) => data?.blogIds ?? []);
}

export function useLikes() {
  const { user } = useSession();

  const { data } = useResource(user ? LIKES : null, fetchLikes, []);

  const ids = useMemo(() => new Set(data || []), [data]);

  const isLiked = useCallback((id) => ids.has(String(id)), [ids]);

  const toggleLike = useCallback(
    (blog) => toggleLikeBlog(blog, ids.has(String(blog?.id))),
    [ids]
  );

  /* blog.likes is the server's count at fetch time and
     blog.likedByMe is what it thought at that moment. If the
     local state has moved since, adjust by one rather than
     refetching the whole list on every tap. */
  const likeCount = useCallback(
    (blog) => {
      const base = Number(blog?.likes) || 0;
      const wasLiked = Boolean(blog?.likedByMe);
      const nowLiked = ids.has(String(blog?.id));

      return Math.max(0, base + (nowLiked ? 1 : 0) - (wasLiked ? 1 : 0));
    },
    [ids]
  );

  return { liked: data || [], isLiked, toggleLike, likeCount };
}

export async function toggleLikeBlog(blog, currentlyLiked) {
  if (!blog) {
    return false;
  }

  const key = String(blog.id);
  const before = peek(LIKES) || [];

  const next = currentlyLiked
    ? before.filter((item) => item !== key)
    : [key, ...before];

  setCache(LIKES, next);

  try {
    if (currentlyLiked) {
      await api.delete(`/blogs/${encodeURIComponent(key)}/like`);
    } else {
      await api.put(`/blogs/${encodeURIComponent(key)}/like`);
    }
  } catch (error) {
    setCache(LIKES, before);
    throw error;
  }

  return !currentlyLiked;
}

/* ---------------------------------------------------------
   FOLLOWING
--------------------------------------------------------- */

function fetchFollowing() {
  return api.get("/me/following").then((data) => data?.usernames ?? []);
}

export function useFollowing() {
  const { user } = useSession();

  const { data } = useResource(user ? FOLLOWING : null, fetchFollowing, []);

  const following = useMemo(() => data || [], [data]);

  const isFollowing = useCallback(
    (username) => following.includes(username),
    [following]
  );

  const toggleFollow = useCallback(
    (username) => toggleFollowWriter(username, following.includes(username)),
    [following]
  );

  return {
    following,
    isFollowing,
    toggleFollow,
    followingCount: following.length,
  };
}

export async function toggleFollowWriter(username, currentlyFollowing) {
  if (!username) {
    return false;
  }

  const handle = String(username).replace(/^@/, "");
  const before = peek(FOLLOWING) || [];

  const next = currentlyFollowing
    ? before.filter((item) => item !== username)
    : [username, ...before];

  setCache(FOLLOWING, next);

  try {
    if (currentlyFollowing) {
      await api.delete(`/users/${encodeURIComponent(handle)}/follow`);
    } else {
      await api.put(`/users/${encodeURIComponent(handle)}/follow`);
    }

    /* Follower counts and the Following feed both move. */
    invalidate("users", "blogs?following=1");
  } catch (error) {
    setCache(FOLLOWING, before);
    throw error;
  }

  return !currentlyFollowing;
}

/* ---------------------------------------------------------
   COMMENTS
--------------------------------------------------------- */

function commentsKey(blogId) {
  return blogId ? `comments/${blogId}` : null;
}

export function useComments(blogId) {
  const { data } = useResource(
    commentsKey(blogId),
    () =>
      api
        .get(`/blogs/${encodeURIComponent(blogId)}/comments`)
        .then((response) => response?.comments ?? []),
    []
  );

  return data;
}

export function useCommentCount(blog) {
  const comments = useComments(blog?.id);

  /* blog.comments is already the server's count. Use the
     loaded list when we have it so a new comment shows
     immediately. */
  return comments.length > 0 ? comments.length : Number(blog?.comments) || 0;
}

export async function addComment(blog, text, parentId = null) {
  const value = String(text || "").trim();

  if (!blog || !value) {
    return null;
  }

  const response = await api.post(
    `/blogs/${encodeURIComponent(blog.id)}/comments`,
    { text: value, parentId }
  );

  invalidate(commentsKey(blog.id), "blogs", "notifications");

  return response?.comment ?? null;
}

export async function deleteComment(blogId, commentId) {
  await api.delete(`/comments/${encodeURIComponent(commentId)}`);

  invalidate(commentsKey(blogId), "blogs");
}

/* The API cascades comments when a blog is deleted, so this
   only has to clear what's cached. */
export function deleteCommentsForBlog(blogId) {
  invalidate(commentsKey(blogId));
}

/* ---------------------------------------------------------
   COMMENT LIKES
--------------------------------------------------------- */

/* Each comment already arrives with likedByMe and likes on
   it, so there is no separate list to keep in step - the
   component reads the flag straight off the comment. */

export function useCommentLikes(blogId) {
  const toggleCommentLike = useCallback(
    async (comment) => {
      if (!comment) {
        return false;
      }

      const liked = Boolean(comment.likedByMe);
      const key = commentsKey(blogId);

      /* Flip it locally first so the heart responds on tap. */
      setCache(key, (list) =>
        (list || []).map((item) =>
          String(item.id) === String(comment.id)
            ? {
                ...item,
                likedByMe: !liked,
                likes: Math.max(0, (item.likes || 0) + (liked ? -1 : 1)),
              }
            : item
        )
      );

      try {
        if (liked) {
          await api.delete(`/comments/${encodeURIComponent(comment.id)}/like`);
        } else {
          await api.put(`/comments/${encodeURIComponent(comment.id)}/like`);
        }
      } catch (error) {
        console.error("Could not update that like:", error);
        invalidate(key);
      }

      return !liked;
    },
    [blogId]
  );

  return { toggleCommentLike };
}

/* ---------------------------------------------------------
   VIEWS
--------------------------------------------------------- */

export async function recordView(blogId) {
  if (!blogId) {
    return;
  }

  try {
    const data = await api.post(`/blogs/${encodeURIComponent(blogId)}/view`);

    setCache(`views/${blogId}`, data?.views ?? 0);
  } catch (error) {
    /* A missed view count is not worth bothering anyone about. */
    console.error("Could not record that view:", error);
  }
}

export function useViews(blogId) {
  const { data } = useResource(
    blogId ? `views/${blogId}` : null,
    () =>
      api
        .get(`/blogs/${encodeURIComponent(blogId)}`)
        .then((response) => response?.blog?.views ?? 0),
    0
  );

  return data || 0;
}

/* ---------------------------------------------------------
   SHARING
--------------------------------------------------------- */

export function getBlogUrl(blogId) {
  if (typeof window === "undefined") {
    return `/blog/${blogId}`;
  }

  return `${window.location.origin}/blog/${blogId}`;
}

export async function shareBlog(blog) {
  const url = getBlogUrl(blog?.id);

  const payload = {
    title: blog?.title || "INKORA",
    text: blog?.description || "Read this on INKORA.",
    url,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, method: "cancelled" };
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, method: "clipboard" };
    } catch (error) {
      console.error("Could not copy the blog link:", error);
    }
  }

  return { ok: false, method: "none", url };
}
