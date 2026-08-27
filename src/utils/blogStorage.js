/* =========================================================
   INKORA BLOG STORAGE

   CRUD for blogs, plus the helpers that paper over the fact
   that demo blogs store author as a string and real posts
   store it as an object.
========================================================= */

import { KEYS, readStore, writeStore, createId, useStore } from "./store";
import { deleteFile } from "./fileStore";
import { demoBlogs } from "./demoData";

const BLOG_STORAGE_KEY = KEYS.blogs;

/* =========================================================
   ORIGINAL API
========================================================= */

export function getBlogs() {
  try {
    const stored = localStorage.getItem(BLOG_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load INKORA blogs:", error);
    return [];
  }
}

export function getBlogById(id) {
  const blogs = getBlogs();

  return blogs.find((blog) => String(blog.id) === String(id));
}

export function saveBlog(blog) {
  const blogs = getBlogs();

  const newBlog = {
    ...blog,
    id: blog.id || createId(),
    createdAt: new Date().toISOString(),
  };

  const updatedBlogs = [newBlog, ...blogs];

  writeStore(BLOG_STORAGE_KEY, updatedBlogs);

  return newBlog;
}

export function deleteBlog(id) {
  const blogs = getBlogs();

  const target = blogs.find((blog) => String(blog.id) === String(id));

  const updatedBlogs = blogs.filter(
    (blog) => String(blog.id) !== String(id)
  );

  writeStore(BLOG_STORAGE_KEY, updatedBlogs);

  /* Free the thumbnail and PDF from the file store too. */

  if (target) {
    deleteFile(target.thumbnail);
    deleteFile(target.pdf);
  }
}

export function clearBlogs() {
  const blogs = getBlogs();

  blogs.forEach((blog) => {
    deleteFile(blog.thumbnail);
    deleteFile(blog.pdf);
  });

  writeStore(BLOG_STORAGE_KEY, []);
}

/* =========================================================
   UPDATE
========================================================= */

export function updateBlog(id, changes) {
  const blogs = getBlogs();

  let updatedBlog = null;

  const updatedBlogs = blogs.map((blog) => {
    if (String(blog.id) !== String(id)) {
      return blog;
    }

    updatedBlog = {
      ...blog,
      ...changes,
      id: blog.id,
      createdAt: blog.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return updatedBlog;
  });

  if (!updatedBlog) {
    return null;
  }

  writeStore(BLOG_STORAGE_KEY, updatedBlogs);

  return updatedBlog;
}

/* =========================================================
   COMBINED READS (user blogs + demo blogs)
========================================================= */

export function getAllBlogs() {
  return [...getBlogs(), ...demoBlogs];
}

export function getAnyBlogById(id) {
  if (id === undefined || id === null) {
    return null;
  }

  return (
    getAllBlogs().find((blog) => String(blog.id) === String(id)) || null
  );
}

export function getBlogsByAuthor(username) {
  if (!username) {
    return [];
  }

  const handle = String(username).toLowerCase();

  return getAllBlogs().filter(
    (blog) => String(getAuthorUsername(blog)).toLowerCase() === handle
  );
}

/* =========================================================
   AUTHOR HELPERS

   User-created blogs store author as an object.
   Demo blogs store author as a plain string.
========================================================= */

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

/* =========================================================
   READ TIME
========================================================= */

export function estimateReadTime(blog) {
  if (blog?.readTime) {
    return blog.readTime;
  }

  const words = [
    blog?.title || "",
    blog?.description || "",
    ...(Array.isArray(blog?.content) ? blog.content : []),
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  /* A PDF blog is longer than its description suggests. */

  const pages = blog?.pdf ? 4 : 0;

  const minutes = Math.max(1, Math.round((words + pages * 250) / 200));

  return `${minutes} min read`;
}

/* =========================================================
   REACT HOOK

   Re-renders whenever a blog is published, edited or deleted.
========================================================= */

export function useAllBlogs() {
  const [userBlogs] = useStore(KEYS.blogs, []);

  const safeBlogs = Array.isArray(userBlogs) ? userBlogs : [];

  return [...safeBlogs, ...demoBlogs];
}

export function useUserBlogs() {
  const [userBlogs] = useStore(KEYS.blogs, []);

  return Array.isArray(userBlogs) ? userBlogs : [];
}

/* Kept for symmetry with readStore usage elsewhere. */

export function readBlogsRaw() {
  return readStore(BLOG_STORAGE_KEY, []);
}
