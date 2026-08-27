import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Toast } from "../../components/States";

import { useSettings } from "../../utils/settings";
import {
  useCurrentUser,
  updateCurrentUser,
  changePassword as changeAccountPassword,
  deleteAccount,
  signOut,
} from "../../utils/session";
import { clearNotifications } from "../../utils/notifications";
import { clearBlogs } from "../../utils/blogStorage";
import { KEYS, removeStore } from "../../utils/store";
import { useToast } from "../../utils/useToast";

function UserIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function MotionIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function Settings() {
  const navigate = useNavigate();

  const user = useCurrentUser();
  const { settings, update, toggle } = useSettings();
  const { toast, showToast } = useToast();

  const [activeSection, setActiveSection] = useState("account");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [dob, setDob] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const darkMode = settings.darkMode;

  /* Load the signed-in account into the form. */

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setUsername(user.username || "");
    setEmail(user.email || "");
    setContact(user.contact || "");
    setDob(user.dob || "");
  }, [user]);

  const sections = [
    { id: "account", label: "Account", icon: <UserIcon /> },
    { id: "privacy", label: "Privacy", icon: <EyeIcon /> },
    { id: "notifications", label: "Notifications", icon: <BellIcon /> },
    { id: "security", label: "Security", icon: <ShieldIcon /> },
    { id: "appearance", label: "Appearance", icon: <MonitorIcon /> },
  ];

  function saveChanges() {
    updateCurrentUser({
      name: name.trim() || user?.name,
      username: username.trim() || user?.username,
      email: email.trim(),
      contact: contact.trim(),
      dob,
    });

    showToast("Your account details were saved", "success");
  }

  async function handleChangePassword() {
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please fill in your new password twice.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "The new password and its confirmation do not match."
      );
      return;
    }

    setChangingPassword(true);

    try {
      await changeAccountPassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showToast("Password updated", "success");
    } catch (error) {
      setPasswordError(error?.message || "Could not update your password.");
    } finally {
      setChangingPassword(false);
    }
  }

  function handleDeleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      return;
    }

    /* Remove this account and everything it created on this
       device. Bookmarks, likes, follows and drafts go too. */

    clearBlogs();
    clearNotifications();

    removeStore(KEYS.saved);
    removeStore(KEYS.likes);
    removeStore(KEYS.following);
    removeStore(KEYS.comments);
    removeStore(KEYS.commentLikes);
    removeStore(KEYS.views);
    removeStore(KEYS.profile);

    deleteAccount();

    setShowDelete(false);

    navigate("/signup", { replace: true });
  }

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-neutral-950 text-white"
          : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* HEADER */}

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          darkMode
            ? "border-neutral-800 bg-neutral-950/90"
            : "border-neutral-200 bg-white/95"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-lg font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/home"
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                darkMode
                  ? "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              Back to Feed
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                darkMode
                  ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              Log out
            </button>

            <Link
              to="/profile"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
            Preferences
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Settings
          </h1>

          <p
            className={`mt-3 max-w-2xl text-sm leading-6 ${
              darkMode ? "text-neutral-400" : "text-neutral-500"
            }`}
          >
            Manage your account, privacy, notifications and INKORA
            preferences. Everything here is saved on this device.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* SIDEBAR */}

          <aside
            className={`h-fit rounded-[26px] border p-2 ${
              darkMode
                ? "border-neutral-800 bg-neutral-900"
                : "border-neutral-200 bg-white"
            }`}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeSection === section.id
                    ? "bg-violet-50 text-violet-700"
                    : darkMode
                    ? "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {section.icon}

                <span>{section.label}</span>
              </button>
            ))}

            <div
              className={`my-2 border-t ${
                darkMode ? "border-neutral-800" : "border-neutral-100"
              }`}
            />

            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <TrashIcon />
              Delete Account
            </button>
          </aside>

          {/* CONTENT */}

          <section
            className={`overflow-hidden rounded-[28px] border ${
              darkMode
                ? "border-neutral-800 bg-neutral-900"
                : "border-neutral-200 bg-white"
            }`}
          >
            {/* ACCOUNT */}

            {activeSection === "account" && (
              <div>
                <SettingsHeader
                  eyebrow="Account"
                  title="Account information"
                  description="Update the personal information connected to your INKORA account."
                  darkMode={darkMode}
                />

                <div className="space-y-6 p-6 sm:p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <SettingsField
                      label="Full name"
                      value={name}
                      onChange={setName}
                      darkMode={darkMode}
                    />

                    <SettingsField
                      label="Username"
                      value={username}
                      onChange={setUsername}
                      darkMode={darkMode}
                    />
                  </div>

                  <SettingsField
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    darkMode={darkMode}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <SettingsField
                      label="Contact number"
                      value={contact}
                      onChange={setContact}
                      darkMode={darkMode}
                    />

                    <SettingsField
                      label="Date of birth"
                      type="date"
                      value={dob}
                      onChange={setDob}
                      darkMode={darkMode}
                    />
                  </div>

                  <div
                    className={`rounded-2xl p-5 ${
                      darkMode ? "bg-neutral-800" : "bg-violet-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-violet-600">
                        <UserIcon />
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Where this is stored
                        </p>

                        <p
                          className={`mt-1 text-xs leading-5 ${
                            darkMode
                              ? "text-neutral-400"
                              : "text-neutral-500"
                          }`}
                        >
                          Your account lives in this browser only. Clearing
                          site data, or opening INKORA on another device,
                          starts from a clean slate until the backend exists.
                        </p>
                      </div>
                    </div>
                  </div>

                  <SaveButton onClick={saveChanges} />
                </div>
              </div>
            )}

            {/* PRIVACY */}

            {activeSection === "privacy" && (
              <div>
                <SettingsHeader
                  eyebrow="Privacy"
                  title="Privacy controls"
                  description="Choose what information other people can see on your profile."
                  darkMode={darkMode}
                />

                <div
                  className={`divide-y ${
                    darkMode ? "divide-neutral-800" : "divide-neutral-100"
                  }`}
                >
                  <ToggleRow
                    icon={<EyeIcon />}
                    title="Public profile"
                    description="Allow people to view your profile and published blogs."
                    enabled={settings.profileVisibility}
                    onChange={() => toggle("profileVisibility")}
                    darkMode={darkMode}
                  />

                  <ToggleRow
                    icon={<UserIcon />}
                    title="Show email address"
                    description="Display your email address on your public profile."
                    enabled={settings.emailVisibility}
                    onChange={() => toggle("emailVisibility")}
                    darkMode={darkMode}
                  />

                  <ToggleRow
                    icon={<UserIcon />}
                    title="Show contact number"
                    description="Display your contact number on your public profile."
                    enabled={settings.contactVisibility}
                    onChange={() => toggle("contactVisibility")}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}

            {activeSection === "notifications" && (
              <div>
                <SettingsHeader
                  eyebrow="Notifications"
                  title="Notification preferences"
                  description="Control how INKORA keeps you updated. Turning these off actually stops the matching notifications from being created."
                  darkMode={darkMode}
                />

                <div
                  className={`divide-y ${
                    darkMode ? "divide-neutral-800" : "divide-neutral-100"
                  }`}
                >
                  <ToggleRow
                    icon={<BellIcon />}
                    title="Push notifications"
                    description="Receive notifications about activity on your account."
                    enabled={settings.pushNotifications}
                    onChange={() => toggle("pushNotifications")}
                    darkMode={darkMode}
                  />

                  <ToggleRow
                    icon={<BellIcon />}
                    title="Email notifications"
                    description="Receive important INKORA updates by email. Needs the backend to actually send mail."
                    enabled={settings.emailNotifications}
                    onChange={() => toggle("emailNotifications")}
                    darkMode={darkMode}
                  />

                  <ToggleRow
                    icon={<BellIcon />}
                    title="Comment notifications"
                    description="Get notified when someone comments on your blog."
                    enabled={settings.commentNotifications}
                    onChange={() => toggle("commentNotifications")}
                    darkMode={darkMode}
                  />

                  <ToggleRow
                    icon={<UserIcon />}
                    title="New follower notifications"
                    description="Get notified when someone follows you."
                    enabled={settings.followNotifications}
                    onChange={() => toggle("followNotifications")}
                    darkMode={darkMode}
                  />
                </div>

                <div className="p-6 sm:p-8">
                  <button
                    type="button"
                    onClick={() => {
                      clearNotifications();
                      showToast("Notifications cleared", "success");
                    }}
                    className={`rounded-xl border px-5 py-3 text-xs font-bold transition ${
                      darkMode
                        ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    Clear all notifications
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}

            {activeSection === "security" && (
              <div>
                <SettingsHeader
                  eyebrow="Security"
                  title="Password & security"
                  description="Keep your INKORA account secure."
                  darkMode={darkMode}
                />

                <div className="space-y-6 p-6 sm:p-8">
                  <div
                    className={`rounded-2xl border p-5 ${
                      darkMode
                        ? "border-neutral-800 bg-neutral-800"
                        : "border-neutral-100 bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <LockIcon />

                      <div>
                        <p className="text-sm font-bold">
                          Change password
                        </p>

                        <p
                          className={`mt-1 text-xs leading-5 ${
                            darkMode
                              ? "text-neutral-400"
                              : "text-neutral-500"
                          }`}
                        >
                          Passwords are salted and hashed before being saved,
                          but anything in this browser can still read them.
                          Real security arrives with the backend, so do not
                          reuse an important password here.
                        </p>
                      </div>
                    </div>
                  </div>

                  <SettingsField
                    label="Current password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    darkMode={darkMode}
                  />

                  <SettingsField
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={setNewPassword}
                    darkMode={darkMode}
                  />

                  <SettingsField
                    label="Confirm new password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    darkMode={darkMode}
                  />

                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                      className="h-4 w-4 accent-violet-600"
                    />

                    Show passwords
                  </label>

                  {passwordError && (
                    <p role="alert" className="text-xs font-medium text-red-500">
                      {passwordError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-60"
                  >
                    {changingPassword && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE */}

            {activeSection === "appearance" && (
              <div>
                <SettingsHeader
                  eyebrow="Appearance"
                  title="Customize INKORA"
                  description="Choose how INKORA should look on your device. This applies to every page and is remembered after a reload."
                  darkMode={darkMode}
                />

                <div className="p-6 sm:p-8">
                  <ToggleRow
                    icon={<MonitorIcon />}
                    title="Dark mode"
                    description="Switch between the light and dark INKORA interface."
                    enabled={darkMode}
                    onChange={() => toggle("darkMode")}
                    darkMode={darkMode}
                  />

                  <div
                    className={`border-t ${
                      darkMode ? "border-neutral-800" : "border-neutral-100"
                    }`}
                  >
                    <ToggleRow
                      icon={<MotionIcon />}
                      title="Reduce motion"
                      description="Turn off hover zooms and transitions across INKORA."
                      enabled={settings.reduceMotion}
                      onChange={() => toggle("reduceMotion")}
                      darkMode={darkMode}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <ThemeCard
                      title="Light"
                      active={!darkMode}
                      dark={false}
                      onClick={() => update({ darkMode: false })}
                    />

                    <ThemeCard
                      title="Dark"
                      active={darkMode}
                      dark
                      onClick={() => update({ darkMode: true })}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* DELETE MODAL */}

      {showDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-neutral-900 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500">
              <TrashIcon />
            </div>

            <h2 className="mt-5 text-center text-2xl font-black">
              Delete your account?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-neutral-500">
              This permanently removes your account, your published blogs,
              their PDFs, your bookmarks, likes, follows and comments from
              this device. It cannot be undone.
            </p>

            <label className="mt-5 block text-xs font-bold text-neutral-700">
              Type DELETE to confirm

              <input
                type="text"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder="DELETE"
                className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-normal outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm.trim().toUpperCase() !== "DELETE"}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

/* =========================================================
   PIECES
========================================================= */

function SettingsHeader({ eyebrow, title, description, darkMode }) {
  return (
    <div
      className={`border-b p-6 sm:p-8 ${
        darkMode ? "border-neutral-800" : "border-neutral-100"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-black">
        {title}
      </h2>

      <p
        className={`mt-2 max-w-2xl text-sm leading-6 ${
          darkMode ? "text-neutral-400" : "text-neutral-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function SettingsField({ label, type = "text", value, onChange, darkMode }) {
  const id = `settings-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${
          darkMode
            ? "border-neutral-700 bg-neutral-800 text-white"
            : "border-neutral-200 bg-white text-neutral-900"
        }`}
      />
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  enabled,
  onChange,
  darkMode,
}) {
  return (
    <div className="flex items-center gap-4 p-6 sm:p-7">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          enabled
            ? "bg-violet-100 text-violet-600"
            : darkMode
            ? "bg-neutral-800 text-neutral-500"
            : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>

        <p
          className={`mt-1 text-xs leading-5 ${
            darkMode ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-violet-600"
            : darkMode
            ? "bg-neutral-700"
            : "bg-neutral-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function ThemeCard({ title, active, dark, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`overflow-hidden rounded-2xl border-2 text-left transition ${
        active
          ? "border-violet-600 shadow-lg shadow-violet-100"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div className={`h-28 p-4 ${dark ? "bg-neutral-900" : "bg-neutral-100"}`}>
        <div
          className={`h-3 w-24 rounded ${
            dark ? "bg-neutral-700" : "bg-white"
          }`}
        />

        <div
          className={`mt-3 h-12 rounded-xl ${
            dark ? "bg-neutral-800" : "bg-white"
          }`}
        />
      </div>

      <div className="flex items-center justify-between p-4">
        <span className="text-xs font-bold">
          {title}
        </span>

        {active && (
          <span className="text-[10px] font-bold text-violet-600">
            Active
          </span>
        )}
      </div>
    </button>
  );
}

function SaveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
    >
      Save Changes
    </button>
  );
}

export default Settings;
