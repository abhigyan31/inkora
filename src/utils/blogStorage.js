/* =========================================================
   INKORA BLOG STORAGE

   Backed by MySQL through the PHP API.

   The exported names and hook shapes are the same as the
   localStorage version, so none of the pages had to change
   when the backend arrived - which was the point of routing
   everything through this file in the first place.
========================================================= */

import { api, qs } from "./api";
import { useResource, invalidate, load, peek } from "./apiStore";

/* ---------------------------------------------------------
   LISTS
--------------------------------------------------------- */

function blogsKey(params) {
  return `blogs${qs(params)}`;
}

function fetchBlogs(params) {
  return api.get(`/blogs${qs(params)}`).then((data) => data?.blogs ?? []);
}

/* Every blog in the feed. */
export function useAllBlogs(params) {
  const key = blogsKey(params);

  const { data } = useResource(key, () => fetchBlogs(params), []);

  return data;
}

export function useBlogs(params) {
  const key = blogsKey(params);

  const { data, loading, error, reload } = useResource(
    key,
    () => fetchBlogs(params),
    []
  );

  return { blogs: data, loading, error, reload };
}

/* Only the signed-in user's own posts. */
export function useUserBlogs() {
  const { data } = useResource(
    "blogs?author=me",
    () => fetchBlogs({ author: "me" }),
    []
  );

  return data;
}

export function useBlogsByAuthor(username) {
  const handle = String(username || "").replace(/^@/, "");

  const { data, loading } = useResource(
    handle ? `users/${handle}/blogs` : null,
    () => api.get(`/users/${encodeURIComponent(handle)}/blogs`).then((d) => d?.blogs ?? []),
    []
  );

  return { blogs: data, loading };
}

/* ---------------------------------------------------------
   ONE BLOG
--------------------------------------------------------- */

export function useBlog(id) {
  const key = id ? `blogs/${id}` : null;

  const { data, loading, error, reload } = useResource(
    key,
    () => api.get(`/blogs/${encodeURIComponent(id)}`).then((d) => d?.blog ?? null),
    null
  );

  return { blog: data, loading, error, reload };
}

export function getBlogById(id) {
  return api.get(`/blogs/${encodeURIComponent(id)}`).then((d) => d?.blog ?? null);
}

/* Synchronous peek at whatever is already cached. Used by
   the edit form so it can prefill without a second request
   when you came straight from the blog page. */
export function cachedBlog(id) {
  return peek(`blogs/${id}`) ?? null;
}

/* ---------------------------------------------------------
   WRITES
--------------------------------------------------------- */

export async function saveBlog(blog) {
  const created = await api.post("/blogs", blog);

  invalidate("blogs", "users");

  return created?.blog ?? null;
}

export async function updateBlog(id, changes) {
  const updated = await api.patch(`/blogs/${encodeURIComponent(id)}`, changes);

  invalidate("blogs", "users");

  return updated?.blog ?? null;
}

export async function deleteBlog(id) {
  await api.delete(`/blogs/${encodeURIComponent(id)}`);

  invalidate("blogs", "users", "bookmarks", "likes");
}

/* ---------------------------------------------------------
   UPLOADS
--------------------------------------------------------- */

export async function uploadBlogFile(file, kind) {
  const form = new FormData();

  form.append("file", file);
  form.append("kind", kind);

  return api.upload("/uploads", form);
}

/* ---------------------------------------------------------
   AUTHOR HELPERS

   The API always sends author as an object, but these are
   kept because every page calls them and they cost nothing.
--------------------------------------------------------- */

export function getAuthorName(blog) {
  if (!blog) {
    return "";
  }

  return typeof blog.author === "object"
    ? blog.author?.name || "Unknown writer"
    : blog.author || "Unknown writer";
}

export function getAuthorUsername(blog) {
  if (!blog) {
    return "";
  }

  return typeof blog.author === "object"
    ? blog.author?.username || ""
    : blog.username || "";
}

export function getAuthorAvatar(blog) {
  if (!blog) {
    return "";
  }

  return typeof blog.author === "object"
    ? blog.author?.avatar || ""
    : blog.avatar || "";
}

export function getBlogImage(blog) {
  if (!blog) {
    return "";
  }

  return blog.thumbnail || blog.image || "";
}

/* ---------------------------------------------------------
   READ TIME

   Worked out on the client when a post is created, then
   stored, so it doesn't get recalculated on every render.
--------------------------------------------------------- */

export function estimateReadTime(blog) {
  if (blog?.readTime) {
    return blog.readTime;
  }

  const words = [blog?.title || "", blog?.description || ""]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const pages = blog?.pdf ? 4 : 0;

  const minutes = Math.max(1, Math.round((words + pages * 250) / 200));

  return `${minutes} min read`;
}

/* Force a refresh of the feed - used after publishing. */
export function refreshBlogs() {
  invalidate("blogs");
}

export { load as preloadBlogs };
