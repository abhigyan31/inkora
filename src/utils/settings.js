/* =========================================================
   INKORA SETTINGS

   One persisted settings object, shared by every page.
   Dark mode is applied to <html> so it survives navigation
   and page reloads instead of living inside Settings.jsx.
========================================================= */

import { useEffect } from "react";
import { KEYS, readStore, writeStore, useStore } from "./store";

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

export function getSettings() {
  const stored = readStore(KEYS.settings, null);

  if (!stored || typeof stored !== "object") {
    return { ...defaultSettings };
  }

  return { ...defaultSettings, ...stored };
}

export function saveSettings(changes) {
  const next = { ...getSettings(), ...changes };

  writeStore(KEYS.settings, next);

  applyTheme(next.darkMode);

  return next;
}

export function useSettings() {
  const [stored] = useStore(KEYS.settings, defaultSettings);

  const settings = {
    ...defaultSettings,
    ...(stored && typeof stored === "object" ? stored : {}),
  };

  function update(changes) {
    saveSettings(changes);
  }

  function toggle(name) {
    saveSettings({ [name]: !settings[name] });
  }

  return { settings, update, toggle };
}

/* =========================================================
   THEME
========================================================= */

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

/* Mount once, near the top of the app. */

export function useThemeEffect() {
  const { settings } = useSettings();

  useEffect(() => {
    applyTheme(settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    applyMotionPreference(settings.reduceMotion);
  }, [settings.reduceMotion]);

  return settings;
}

/* Runs before React mounts so there is no light-mode flash. */

export function bootstrapTheme() {
  const settings = getSettings();

  applyTheme(settings.darkMode);
  applyMotionPreference(settings.reduceMotion);
}
