/* =========================================================
   INKORA FORMATTING HELPERS
========================================================= */

export function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLongDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* Demo blogs carry a pre-written "date" string. User blogs
   carry an ISO "createdAt". This handles both. */

export function blogDate(blog) {
  if (!blog) {
    return "";
  }

  return blog.date || formatDate(blog.createdAt) || "Recently";
}

export function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 0) {
    return formatDate(value);
  }

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(value);
}

export function formatCount(value) {
  const number = Number(value) || 0;

  if (number < 1000) {
    return String(number);
  }

  if (number < 1000000) {
    const thousands = number / 1000;

    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K`;
  }

  const millions = number / 1000000;

  return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
}

export function initialsOf(name) {
  const value = String(name || "").trim();

  if (!value) {
    return "?";
  }

  return value.charAt(0).toUpperCase();
}
