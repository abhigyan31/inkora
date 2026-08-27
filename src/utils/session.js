/* =========================================================
   INKORA ACCOUNTS & SESSION

   Signup, login and logout, stored on this device.

   WARNING: this is not secure auth. Passwords are salted and
   hashed with SHA-256 so they aren't sitting in localStorage
   as plain text, but any script in this browser can read the
   hashes. Real auth has to run on a server - see BACKEND.md.
   Swap SHA-256 for argon2id there too.
========================================================= */

import {
  KEYS,
  readStore,
  writeStore,
  createId,
  useStore,
  notify,
} from "./store";

/* =========================================================
   PASSWORD HASHING
========================================================= */

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();

  const data = encoder.encode(`${salt}:${password}`);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  }

  /* Fallback for very old browsers. Weak, but never reached
     in a modern dev environment. */

  let hash = 0;

  for (let index = 0; index < data.length; index += 1) {
    hash = (hash << 5) - hash + data[index];
    hash |= 0;
  }

  return `fallback-${hash}`;
}

function createSalt() {
  return createId().replace(/-/g, "").slice(0, 16);
}

/* =========================================================
   USERS
========================================================= */

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=90";

export function getUsers() {
  const users = readStore(KEYS.users, []);

  return Array.isArray(users) ? users : [];
}

export function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const value = String(email).trim().toLowerCase();

  return (
    getUsers().find(
      (user) => String(user.email).toLowerCase() === value
    ) || null
  );
}

export function findUserByUsername(username) {
  if (!username) {
    return null;
  }

  const value = normalizeUsername(username).toLowerCase();

  return (
    getUsers().find(
      (user) => normalizeUsername(user.username).toLowerCase() === value
    ) || null
  );
}

export function normalizeUsername(username) {
  const value = String(username || "").trim();

  if (!value) {
    return "";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

/* =========================================================
   SEEDING

   INKORA has always shown "Alex Kumar" as the signed-in
   writer. On first run that identity becomes a real account
   so nothing in the UI suddenly loses its author, and any
   profile the user already customised is carried over.
========================================================= */

const DEMO_EMAIL = "alex@inkora.app";
export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: "inkora123",
};

let seeding = false;

export function ensureSeedAccount() {
  if (seeding) {
    return;
  }

  const users = getUsers();

  if (users.length > 0) {
    ensureSession(users);
    return;
  }

  seeding = true;

  const savedProfile = readStore(KEYS.profile, null) || {};

  const seedUser = {
    id: createId(),
    name: savedProfile.name || "Alex Kumar",
    username: normalizeUsername(savedProfile.username || "@alexwrites"),
    email: savedProfile.email || DEMO_EMAIL,
    bio:
      savedProfile.bio ||
      "Writing about technology, life, and everything in between. Every story you read might make you see life a little differently.",
    contact: savedProfile.contact || "",
    dob: savedProfile.dob || "",
    avatar: savedProfile.profileImage || DEFAULT_AVATAR,
    coverImage: savedProfile.coverImage || DEFAULT_COVER,
    passwordHash: "",
    salt: "",
    seeded: true,
    createdAt: new Date().toISOString(),
  };

  /* Give the seeded account a usable password in the
     background so "log out then log back in" works. */

  const salt = createSalt();

  hashPassword(DEMO_CREDENTIALS.password, salt)
    .then((passwordHash) => {
      const current = getUsers();

      writeStore(
        KEYS.users,
        current.map((user) =>
          user.id === seedUser.id
            ? { ...user, salt, passwordHash }
            : user
        )
      );
    })
    .catch((error) => {
      console.error("Failed to prepare the INKORA demo account:", error);
    })
    .finally(() => {
      seeding = false;
    });

  writeStore(KEYS.users, [seedUser]);
  writeStore(KEYS.session, { userId: seedUser.id });
  syncProfileMirror(seedUser);
}

function ensureSession(users) {
  /* An explicit sign-out writes null here. Only a browser
     that has never had a session at all gets signed in
     automatically — otherwise logging out would undo itself
     on the very next page load. */

  let rawSession = null;

  try {
    rawSession = localStorage.getItem(KEYS.session);
  } catch (error) {
    console.error("Could not read the INKORA session:", error);
  }

  if (rawSession !== null) {
    const session = readStore(KEYS.session, null);

    if (!session || !session.userId) {
      /* Signed out on purpose. Leave it that way. */
      return;
    }

    if (users.some((user) => user.id === session.userId)) {
      return;
    }

    /* The account this session pointed at is gone. */
    writeStore(KEYS.session, null);
    return;
  }

  const seeded = users.find((user) => user.seeded);

  if (seeded) {
    writeStore(KEYS.session, { userId: seeded.id });
  }
}

/* =========================================================
   CURRENT USER
========================================================= */

export function getCurrentUser() {
  const session = readStore(KEYS.session, null);

  if (!session || !session.userId) {
    return null;
  }

  return getUsers().find((user) => user.id === session.userId) || null;
}

export function isSignedIn() {
  return Boolean(getCurrentUser());
}

export function useCurrentUser() {
  const [session] = useStore(KEYS.session, null);
  const [users] = useStore(KEYS.users, []);

  if (!session || !session.userId) {
    return null;
  }

  const list = Array.isArray(users) ? users : [];

  return list.find((user) => user.id === session.userId) || null;
}

/* =========================================================
   SIGN UP / SIGN IN / SIGN OUT
========================================================= */

export async function signUp({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Please enter your full name.");
  }

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  if (!password || password.length < 6) {
    throw new Error("Your password must be at least 6 characters long.");
  }

  if (findUserByEmail(cleanEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);

  const baseHandle =
    cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 14) || "writer";

  let handle = normalizeUsername(baseHandle);
  let suffix = 1;

  while (findUserByUsername(handle)) {
    suffix += 1;
    handle = normalizeUsername(`${baseHandle}${suffix}`);
  }

  const user = {
    id: createId(),
    name: cleanName,
    username: handle,
    email: cleanEmail,
    bio: "New on INKORA.",
    contact: "",
    dob: "",
    avatar: DEFAULT_AVATAR,
    coverImage: DEFAULT_COVER,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  writeStore(KEYS.users, [...getUsers(), user]);
  writeStore(KEYS.session, { userId: user.id });
  syncProfileMirror(user);

  return user;
}

export async function signIn({ email, password }) {
  const user = findUserByEmail(email);

  if (!user) {
    throw new Error("No account found with this email address.");
  }

  if (!user.passwordHash) {
    /* Seeded account whose hash is still being prepared. */
    throw new Error("This account is still being set up. Try again shortly.");
  }

  const attempt = await hashPassword(password, user.salt);

  if (attempt !== user.passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  writeStore(KEYS.session, { userId: user.id });
  syncProfileMirror(user);

  return user;
}

export function signOut() {
  writeStore(KEYS.session, null);
}

/* =========================================================
   PROFILE UPDATES
========================================================= */

export function updateCurrentUser(changes) {
  const current = getCurrentUser();

  if (!current) {
    return null;
  }

  let updated = null;

  const users = getUsers().map((user) => {
    if (user.id !== current.id) {
      return user;
    }

    updated = {
      ...user,
      ...changes,
      id: user.id,
      username: changes.username
        ? normalizeUsername(changes.username)
        : user.username,
    };

    return updated;
  });

  writeStore(KEYS.users, users);

  if (updated) {
    syncProfileMirror(updated);
  }

  return updated;
}

export async function changePassword(currentPassword, newPassword) {
  const user = getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to change your password.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Your new password must be at least 6 characters long.");
  }

  if (user.passwordHash) {
    const attempt = await hashPassword(currentPassword, user.salt);

    if (attempt !== user.passwordHash) {
      throw new Error("Your current password is incorrect.");
    }
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  updateCurrentUser({ salt, passwordHash, seeded: false });
}

export function deleteAccount() {
  const user = getCurrentUser();

  if (!user) {
    return;
  }

  writeStore(
    KEYS.users,
    getUsers().filter((item) => item.id !== user.id)
  );

  writeStore(KEYS.session, null);
}

/* =========================================================
   PROFILE MIRROR

   The original app stored the profile under "inkora_profile".
   It is kept up to date so nothing that still reads that key
   suddenly goes blank.
========================================================= */

function syncProfileMirror(user) {
  if (!user) {
    return;
  }

  writeStore(KEYS.profile, {
    name: user.name,
    username: user.username,
    bio: user.bio,
    email: user.email,
    contact: user.contact,
    dob: user.dob,
    profileImage: user.avatar,
    coverImage: user.coverImage,
  });

  notify(KEYS.profile);
}

/* =========================================================
   AUTHOR BLOCK FOR NEW BLOGS
========================================================= */

export function getAuthorBlock() {
  const user = getCurrentUser();

  if (!user) {
    return {
      name: "Guest Writer",
      username: "@guest",
      avatar: DEFAULT_AVATAR,
    };
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
  };
}

export { DEFAULT_AVATAR, DEFAULT_COVER };
