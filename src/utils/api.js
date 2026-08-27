/* =========================================================
   INKORA - API client

   Thin wrapper around fetch. Everything that talks to the
   PHP backend goes through here.

   The API sits on the same domain as the app (/api), so the
   session cookie is sent automatically and there's no CORS
   to deal with. In dev, Vite proxies /api across to
   wherever the PHP server is running.
========================================================= */

const BASE = import.meta.env.VITE_API_URL || "/api";

/* PHP checks for this header on every write. A cross-site
   HTML form can't set a custom header, and a cross-origin
   fetch that tries gets stopped by the preflight, so this
   closes the CSRF gap that SameSite=Lax leaves open. */
const CSRF_HEADER = { "X-Inkora-Request": "1" };

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(method, path, options = {}) {
  const { body, isForm = false, signal } = options;

  const headers = { ...CSRF_HEADER };

  let payload;

  if (isForm) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: payload,
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
      null
    );
  }

  /* 204 has no body to parse. */
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      /* A PHP fatal error or an Apache error page arrives as
         HTML. Say something useful instead of letting a
         JSON.parse error surface. */
      throw new ApiError(
        response.ok
          ? "The server sent back something unexpected."
          : `Server error (${response.status}).`,
        response.status,
        text.slice(0, 500)
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed (${response.status}).`,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  delete: (path, body, options) => request("DELETE", path, { ...options, body }),

  upload: (path, formData, options) =>
    request("POST", path, { ...options, body: formData, isForm: true }),
};

/* Build a query string, skipping empty values so the URL
   stays clean. */
export function qs(params) {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    search.set(key, String(value));
  });

  const string = search.toString();

  return string ? `?${string}` : "";
}

export default api;
