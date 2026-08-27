/* =========================================================
   INKORA SETTINGS

   Settings live in MySQL so they follow the account from
   one device to another.

   Dark mode is the exception: it is ALSO kept in
   localStorage, because the theme has to be applied before
   React mounts. Waiting for a round trip would mean every
   page load flashes white first.
========================================================= */

import { useEffect } from "react";
import { api } from "./api";
import { useResource, invalidate, setCache, peek } from "./apiStore";
import { useSession } from "./session";

const KEY = "settings";
const THEME_KEY = "inkora_theme";

export const defaultSettings = {
  profileVisibility: true,
  emailVisibility: false,
  contactVisibility: false,

  pushNotifications: true,
  emailNotifications: true,
  commentNotifications: true,
  followNotifications: true,

  darkMode: false,
  reduceMotion: false,
};

function fetchSettings() {
  return api.get("/settings").then((data) => ({
    ...defaultSettings,
    ...(data?.settings || {}),
  }));
}

export function useSettings() {
  const { user } = useSession();

  const { data } = useResource(
    user ? KEY : null,
    fetchSettings,
    localTheme()
  );

  const settings = { ...defaultSettings, ...(data || {}) };

  function update(changes) {
    saveSettings(changes);
  }

  function toggle(name) {
    saveSettings({ [name]: !settings[name] });
  }

  return { settings, update, toggle };
}

export async function saveSettings(changes) {
  const before = peek(KEY);

  const next = { ...defaultSettings, ...(before || {}), ...changes };

  setCache(KEY, next);

  /* Apply anything visual straight away. */
  if ("darkMode" in changes) {
    applyTheme(next.darkMode);
    writeLocalTheme(next);
  }

  if ("reduceMotion" in changes) {
    applyMotionPreference(next.reduceMotion);
    writeLocalTheme(next);
  }

  try {
    await api.patch("/settings", changes);
  } catch (error) {
    console.error("Could not save your settings:", error);

    setCache(KEY, before);
    invalidate(KEY);

    if (before) {
      applyTheme(before.darkMode);
      applyMotionPreference(before.reduceMotion);
    }
  }

  return next;
}

export function getSettings() {
  return { ...defaultSettings, ...(peek(KEY) || localTheme()) };
}

/* ---------------------------------------------------------
   THEME

   Mirrored into localStorage purely so bootstrapTheme() can
   run synchronously before the first paint.
--------------------------------------------------------- */

function localTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);

    return stored
      ? { ...defaultSettings, ...JSON.parse(stored) }
      : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

function writeLocalTheme(settings) {
  try {
    localStorage.setItem(
      THEME_KEY,
      JSON.stringify({
        darkMode: Boolean(settings.darkMode),
        reduceMotion: Boolean(settings.reduceMotion),
      })
    );
  } catch (error) {
    console.error("Could not remember your theme:", error);
  }
}

export function applyTheme(darkMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.toggle("dark", Boolean(darkMode));
  root.dataset.theme = darkMode ? "dark" : "light";
  root.style.colorScheme = darkMode ? "dark" : "light";
}

export function applyMotionPreference(reduceMotion) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle(
    "reduce-motion",
    Boolean(reduceMotion)
  );
}

/* Mounted once in App so the server's answer wins over the
   locally cached theme after sign-in. */
export function useThemeEffect() {
  const { settings } = useSettings();

  useEffect(() => {
    applyTheme(settings.darkMode);
    writeLocalTheme(settings);
  }, [settings.darkMode, settings.reduceMotion]);

  useEffect(() => {
    applyMotionPreference(settings.reduceMotion);
  }, [settings.reduceMotion]);

  return settings;
}

/* Runs before React renders. */
export function bootstrapTheme() {
  const settings = localTheme();

  applyTheme(settings.darkMode);
  applyMotionPreference(settings.reduceMotion);
}
