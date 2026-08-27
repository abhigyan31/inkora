import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import {
  signUp,
  signIn,
  useCurrentUser,
  DEMO_CREDENTIALS,
} from "../../utils/session";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
      />
      <path
        fill="#34A853"
        d="M12 21.8c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.8Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.88A5.86 5.86 0 0 1 6.23 12c0-.65.11-1.28.31-1.88V7.59H3.3A9.8 9.8 0 0 0 2.2 12c0 1.58.38 3.08 1.1 4.41l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.09c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.19 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C6.85 7.81 9 6.09 12 6.09Z"
      />
    </svg>
  );
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a17.5 17.5 0 0 1-3.1 3.8" />
      <path d="M6.2 6.7C3.6 8.3 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSignup = location.pathname === "/signup";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const currentUser = useCurrentUser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: false,
  });

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Where the route guard wanted to send us. */
  const redirectTo = location.state?.from || "/home";

  /* Already signed in? Don't sit on the login screen. */

  useEffect(() => {
    if (currentUser) {
      navigate(redirectTo, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  /* Clear messages when switching between login and signup. */

  useEffect(() => {
    setError("");
    setNotice("");
  }, [isSignup]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setError("");

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        if (form.password !== form.confirmPassword) {
          throw new Error("Your passwords do not match.");
        }

        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      } else {
        await signIn({
          email: form.email,
          password: form.password,
        });
      }

      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(
        submitError?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    setNotice(
      "Google sign-in needs OAuth credentials and a verified domain, " +
        "which I have not set up yet. Use an email and password for now."
    );
  }

  function useDemoAccount() {
    setError("");

    setForm((previous) => ({
      ...previous,
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    }));
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ================= LEFT SIDE ================= */}

        <div className="relative hidden overflow-hidden bg-neutral-950 lg:block">
          {/* Purple glow */}

          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-violet-700/30 blur-3xl" />

          <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-3xl" />

          <div className="relative flex h-full flex-col p-10 xl:p-14">
            {/* Logo */}

            <Link to="/" className="flex w-fit items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white">
                I
              </div>

              <span className="text-lg font-black tracking-[-0.04em] text-white">
                INKORA
              </span>
            </Link>

            {/* Main content */}

            <div className="my-auto max-w-[520px]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                Write. Discover. Connect.
              </p>

              <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.055em] text-white xl:text-6xl">
                Your stories
                <span className="block text-violet-400">
                  deserve a place.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-neutral-400">
                Join a growing community of writers and readers. Share your
                ideas, discover new perspectives, and connect through stories
                that matter.
              </p>

              {/* Mini blog preview */}

              <div className="mt-10 max-w-[420px] rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                    alt="Alex Kumar"
                    className="h-10 w-10 rounded-full object-cover"
                  />

                  <div>
                    <p className="text-sm font-bold text-white">Alex Kumar</p>
                    <p className="text-xs text-neutral-500">
                      @alexwrites · 6 min read
                    </p>
                  </div>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-white">
                  The Things College Taught Me
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  A personal reflection on growth, failure, friendship, and
                  finding your own direction.
                </p>

                <div className="mt-5 flex items-center gap-5 text-xs text-neutral-500">
                  <span>♥ 245</span>
                  <span>◌ 32</span>
                  <span>6 min read</span>
                </div>
              </div>
            </div>

            {/* Bottom */}

            <p className="text-xs text-neutral-600">
              © 2026 INKORA. Built for stories that matter.
            </p>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            {/* Mobile logo */}

            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white">
                  I
                </div>

                <span className="text-lg font-black tracking-[-0.04em]">
                  INKORA
                </span>
              </Link>
            </div>

            {/* Back */}

            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-violet-600"
            >
              <ArrowLeftIcon />
              Back to INKORA
            </Link>

            {/* Heading */}

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                {isSignup ? "Join INKORA" : "Welcome back"}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-neutral-950 sm:text-5xl">
                {isSignup ? "Create your account." : "Welcome back."}
              </h2>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                {isSignup
                  ? "Start sharing your stories with a community of readers."
                  : "Continue discovering stories and ideas worth reading."}
              </p>
            </div>

            {/* Google */}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-200" />

              <span className="text-xs font-medium text-neutral-400">
                OR
              </span>

              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            {/* MESSAGES */}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600"
              >
                {error}
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-medium leading-5 text-violet-700"
              >
                {notice}
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}

              {isSignup && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold text-neutral-800"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              )}

              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              {/* Password */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-neutral-800"
                  >
                    Password
                  </label>

                  {!isSignup && (
                    <button
                      type="button"
                      className="text-xs font-bold text-violet-600 hover:text-violet-700"
                      onClick={() =>
                        setNotice(
                          "Password reset needs an email service configured " +
                            "on the server. It is on the list."
                        )
                      }
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label="Toggle password visibility"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}

              {isSignup && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-bold text-neutral-800"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label="Toggle password visibility"
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </div>
              )}

              {/* Remember */}

              {!isSignup && (
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                    className="peer sr-only"
                  />

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      form.remember
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {form.remember && <CheckIcon />}
                  </span>

                  <span className="text-sm text-neutral-500">
                    Remember me
                  </span>
                </label>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {submitting
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                  ? "Create Account"
                  : "Login"}
              </button>
            </form>

            {/* DEMO ACCOUNT */}

            {!isSignup && (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-[11px] font-bold text-neutral-600">
                  Just looking around?
                </p>

                <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                  The demo account is{" "}
                  <span className="font-semibold text-neutral-700">
                    {DEMO_CREDENTIALS.email}
                  </span>{" "}
                  with password{" "}
                  <span className="font-semibold text-neutral-700">
                    {DEMO_CREDENTIALS.password}
                  </span>
                  .
                </p>

                <button
                  type="button"
                  onClick={useDemoAccount}
                  className="mt-2 text-[11px] font-bold text-violet-600 hover:underline"
                >
                  Fill it in for me
                </button>
              </div>
            )}

            {/* Switch */}

            <div className="mt-8 text-center text-sm text-neutral-500">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-violet-600 hover:text-violet-700"
                  >
                    Login
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-bold text-violet-600 hover:text-violet-700"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>

            {/* Terms */}

            {isSignup && (
              <p className="mt-7 text-center text-xs leading-5 text-neutral-400">
                By creating an account, you agree to INKORA's{" "}
                <a href="#" className="text-violet-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-violet-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;