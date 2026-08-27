/* =========================================================
   INKORA ACCOUNTS & SESSION

   Backed by MySQL through the PHP API.

   The password never touches localStorage now - it goes to
   the server, gets hashed with password_hash(), and what
   comes back is an HttpOnly cookie that JavaScript cannot
   read. That's the part the old browser-only version could
   never do.
========================================================= */

import { api } from "./api";
import { useResource, invalidate, setCache, clearCache } from "./apiStore";

const ME = "me";

/* The account api/seed.php creates, so there's something to
   log into on a fresh install. */
export const DEMO_CREDENTIALS = {
  email: "alex@inkora.app",
  password: "inkora123",
};

/* ---------------------------------------------------------
   READING THE SIGNED-IN USER
--------------------------------------------------------- */

function fetchMe() {
  return api.get("/auth/me").then((data) => data?.user ?? null);
}

/* Returns { user, loading }.

   The loading flag matters: without it, RequireAuth would
   see user === null on the very first render and bounce a
   signed-in person to the login page before /auth/me had
   even answered. */
export function useSession() {
  const { data, loading } = useResource(ME, fetchMe, null);

  return { user: data ?? null, loading };
}

export function useCurrentUser() {
  return useSession().user;
}

export function getCurrentUser() {
  return api.get("/auth/me").then((data) => data?.user ?? null);
}

/* ---------------------------------------------------------
   USERNAMES
--------------------------------------------------------- */

export function normalizeUsername(username) {
  const value = String(username || "").trim();

  if (!value) {
    return "";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

export function usernameHandle(username) {
  return String(username || "").replace(/^@/, "");
}

/* ---------------------------------------------------------
   SIGN UP / IN / OUT
--------------------------------------------------------- */

export async function signUp({ name, email, password }) {
  const data = await api.post("/auth/signup", { name, email, password });

  setCache(ME, data.user);
  invalidate("blogs", "bookmarks", "likes", "following", "notifications", "settings");

  return data.user;
}

export async function signIn({ email, password }) {
  const data = await api.post("/auth/login", { email, password });

  setCache(ME, data.user);
  invalidate("blogs", "bookmarks", "likes", "following", "notifications", "settings");

  return data.user;
}

export async function signOut() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    /* Even if the request fails, drop the local copy so the
       UI doesn't keep showing a signed-in state. */
    console.error("Sign out request failed:", error);
  }

  clearCache();
  setCache(ME, null);
}

/* ---------------------------------------------------------
   PROFILE
--------------------------------------------------------- */

export async function updateCurrentUser(changes) {
  const data = await api.patch("/auth/profile", changes);

  setCache(ME, data.user);

  /* The author block on every blog card carries the name and
     avatar, so those lists are stale now. */
  invalidate("blogs", "users");

  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  await api.post("/auth/password", { currentPassword, newPassword });
}

export async function deleteAccount(password) {
  await api.delete("/auth/account", { password });

  clearCache();
  setCache(ME, null);
}

/* ---------------------------------------------------------
   PUBLIC PROFILES

   Returns the writer plus their stats. Every count is worked
   out by the database at read time, so they can't drift out
   of step with the rows they describe.
--------------------------------------------------------- */

export function useUserProfile(username) {
  const handle = usernameHandle(username);

  const { data, loading, error } = useResource(
    handle ? `users/${handle}` : null,
    () => api.get(`/users/${encodeURIComponent(handle)}`),
    null
  );

  return {
    user: data?.user ?? null,
    stats: data?.stats ?? null,
    loading,
    error,
  };
}

/* ---------------------------------------------------------
   AVATAR / COVER UPLOADS
--------------------------------------------------------- */

export async function uploadImage(file) {
  const form = new FormData();

  form.append("file", file);
  form.append("kind", "image");

  const data = await api.upload("/uploads", form);

  return data.path;
}
