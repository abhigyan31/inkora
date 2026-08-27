/* =========================================================
   INKORA ROUTE GUARD

   Pages that write something (Create, Profile, Settings,
   Notifications) need an account.

   The loading check matters now that the answer comes from
   the server: without it, the first render sees no user and
   throws a signed-in person back to the login screen before
   /auth/me has even replied.
========================================================= */

import { Navigate, useLocation } from "react-router";
import { useSession } from "../utils/session";

function RequireAuth({ children }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-bold text-neutral-500 dark:text-neutral-400">
            Just a moment...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}

export default RequireAuth;
