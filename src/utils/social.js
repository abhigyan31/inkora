/* =========================================================
   INKORA SOCIAL LAYER

   Bookmarks, likes, follows, comments, views and sharing.

   Every page reads through these hooks, which is what makes
   a bookmark tapped on Home appear on Profile immediately,
   and disappear from both when it is tapped again.
========================================================= */

import { useCallback, useMemo } from "react";
import { KEYS, readStore, writeStore, createId, useStore } from "./store";
import { getCurrentUser } from "./session";
import {
  notifyLike,
  notifyComment,
  notifyReply,
  notifyFollow,
} from "./notifications";
import { getAuthorUsername } from "./blogStorage";

/* =========================================================
   BOOKMARKS

   Shape: { "<blogId>": true }
   Key:   "inkora-saved-blogs"
========================================================= */

export function getSavedMap() {
  const saved = readStore(KEYS.saved, {});

  return saved && typeof saved === "object" ? saved : {};
}

export function isBlogSaved(id) {
  return Boolean(getSavedMap()[String(id)]);
}

export function toggleSaveBlog(id) {
  const key = String(id);
  const current = getSavedMap();

  const next = { ...current };

  if (next[key]) {
    delete next[key];
  } else {
    next[key] = true;
  }

  writeStore(KEYS.saved, next);

  return Boolean(next[key]);
}

export function useSaved() {
  const [savedRaw] = useStore(KEYS.saved, {});

  const saved = useMemo(
    () => (savedRaw && typeof savedRaw === "object" ? savedRaw : {}),
    [savedRaw]
  );

  const toggleSave = useCallback((id) => toggleSaveBlog(id), []);

  const isSaved = useCallback(
    (id) => Boolean(saved[String(id)]),
    [saved]
  );

  const savedCount = useMemo(
    () => Object.values(saved).filter(Boolean).length,
    [saved]
  );

  return { saved, isSaved, toggleSave, savedCount };
}

/* =========================================================
   LIKES

   Shape: { "<blogId>": true }
========================================================= */

export function getLikedMap() {
  const liked = readStore(KEYS.likes, {});

  return liked && typeof liked === "object" ? liked : {};
}

export function toggleLikeBlog(blog) {
  if (!blog) {
    return false;
  }

  const key = String(blog.id);
  const current = getLikedMap();

  const next = { ...current };
  const nowLiked = !next[key];

  if (nowLiked) {
    next[key] = true;
  } else {
    delete next[key];
  }

  writeStore(KEYS.likes, next);

  if (nowLiked) {
    notifyAuthorOf(blog, notifyLike);
  }

  return nowLiked;
}

export function useLikes() {
  const [likedRaw] = useStore(KEYS.likes, {});

  const liked = useMemo(
    () => (likedRaw && typeof likedRaw === "object" ? likedRaw : {}),
    [likedRaw]
  );

  const isLiked = useCallback(
    (id) => Boolean(liked[String(id)]),
    [liked]
  );

  const toggleLike = useCallback((blog) => toggleLikeBlog(blog), []);

  const likeCount = useCallback(
    (blog) => {
      const base = Number(blog?.likes) || 0;

      return base + (liked[String(blog?.id)] ? 1 : 0);
    },
    [liked]
  );

  return { liked, isLiked, toggleLike, likeCount };
}

/* =========================================================
   FOLLOWING

   Shape: ["@michaellee", "@sarahj"]
========================================================= */

export function getFollowing() {
  const list = readStore(KEYS.following, []);

  return Array.isArray(list) ? list : [];
}

export function toggleFollowWriter(username, writer) {
  if (!username) {
    return false;
  }

  const current = getFollowing();
  const alreadyFollowing = current.includes(username);

  const next = alreadyFollowing
    ? current.filter((item) => item !== username)
    : [...current, username];

  writeStore(KEYS.following, next);

  if (!alreadyFollowing) {
    const actor = currentActor();

    if (actor.username !== username) {
      notifyFollow(actor, writer?.name || username);
    }
  }

  return !alreadyFollowing;
}

export function useFollowing() {
  const [followingRaw] = useStore(KEYS.following, []);

  const following = useMemo(
    () => (Array.isArray(followingRaw) ? followingRaw : []),
    [followingRaw]
  );

  const isFollowing = useCallback(
    (username) => following.includes(username),
    [following]
  );

  const toggleFollow = useCallback(
    (username, writer) => toggleFollowWriter(username, writer),
    []
  );

  return {
    following,
    isFollowing,
    toggleFollow,
    followingCount: following.length,
  };
}

/* =========================================================
   COMMENTS

   Shape: { "<blogId>": [comment, comment, ...] }
   A reply is a comment with parentId set.
========================================================= */

export function getCommentMap() {
  const map = readStore(KEYS.comments, {});

  return map && typeof map === "object" ? map : {};
}

export function getComments(blogId) {
  const list = getCommentMap()[String(blogId)];

  return Array.isArray(list) ? list : [];
}

export function countComments(blog) {
  const base = Number(blog?.comments) || 0;

  return base + getComments(blog?.id).length;
}

export function addComment(blog, text, parentId = null) {
  const value = String(text || "").trim();

  if (!blog || !value) {
    return null;
  }

  const actor = currentActor();

  const comment = {
    id: createId(),
    blogId: String(blog.id),
    parentId: parentId ? String(parentId) : null,
    authorId: actor.id || "",
    authorName: actor.name,
    authorUsername: actor.username,
    authorAvatar: actor.avatar,
    text: value,
    createdAt: new Date().toISOString(),
  };

  const map = getCommentMap();
  const key = String(blog.id);

  writeStore(KEYS.comments, {
    ...map,
    [key]: [...(Array.isArray(map[key]) ? map[key] : []), comment],
  });

  notifyAuthorOf(blog, parentId ? notifyReply : notifyComment);

  return comment;
}

export function deleteComment(blogId, commentId) {
  const map = getCommentMap();
  const key = String(blogId);

  const list = Array.isArray(map[key]) ? map[key] : [];

  writeStore(KEYS.comments, {
    ...map,
    [key]: list.filter(
      (comment) =>
        String(comment.id) !== String(commentId) &&
        String(comment.parentId) !== String(commentId)
    ),
  });
}

export function deleteCommentsForBlog(blogId) {
  const map = getCommentMap();
  const next = { ...map };

  delete next[String(blogId)];

  writeStore(KEYS.comments, next);
}

export function useComments(blogId) {
  const [map] = useStore(KEYS.comments, {});

  return useMemo(() => {
    const safeMap = map && typeof map === "object" ? map : {};
    const list = safeMap[String(blogId)];

    return Array.isArray(list) ? list : [];
  }, [map, blogId]);
}

export function useCommentCount(blog) {
  const comments = useComments(blog?.id);

  return (Number(blog?.comments) || 0) + comments.length;
}

/* =========================================================
   COMMENT LIKES
========================================================= */

export function toggleCommentLike(commentId) {
  const key = String(commentId);
  const current = readStore(KEYS.commentLikes, {}) || {};

  const next = { ...current };

  if (next[key]) {
    delete next[key];
  } else {
    next[key] = true;
  }

  writeStore(KEYS.commentLikes, next);

  return Boolean(next[key]);
}

export function useCommentLikes() {
  const [likesRaw] = useStore(KEYS.commentLikes, {});

  const likes = likesRaw && typeof likesRaw === "object" ? likesRaw : {};

  return {
    isCommentLiked: (id) => Boolean(likes[String(id)]),
    toggleCommentLike,
  };
}

/* =========================================================
   VIEWS
========================================================= */

export function recordView(blogId) {
  if (!blogId) {
    return;
  }

  const key = String(blogId);
  const current = readStore(KEYS.views, {}) || {};

  writeStore(KEYS.views, {
    ...current,
    [key]: (Number(current[key]) || 0) + 1,
  });
}

export function useViews(blogId) {
  const [views] = useStore(KEYS.views, {});

  const safeViews = views && typeof views === "object" ? views : {};

  return Number(safeViews[String(blogId)]) || 0;
}

export function useAllViews() {
  const [views] = useStore(KEYS.views, {});

  return views && typeof views === "object" ? views : {};
}

/* =========================================================
   SHARING
========================================================= */

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
      /* Fall through to clipboard. */
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

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function currentActor() {
  const user = getCurrentUser();

  if (!user) {
    return {
      id: "",
      name: "Guest Reader",
      username: "@guest",
      avatar: "",
    };
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
  };
}

/* TODO: move this to the server. The notification should go
   to the author's inbox, not mine - doing it here is just so
   the feature works before there's a backend.
   Never notify someone about their own blog. */

function notifyAuthorOf(blog, trigger) {
  const actor = currentActor();
  const authorHandle = getAuthorUsername(blog);

  if (authorHandle && authorHandle === actor.username) {
    return;
  }

  trigger(actor, blog);
}

export { currentActor };
