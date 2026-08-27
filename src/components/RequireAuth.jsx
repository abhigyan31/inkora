/* =========================================================
   INKORA ROUTE GUARD

   Pages that write something (Create, Profile, Settings,
   Notifications) require a signed-in account. Anyone else is
   sent to /login and returned here afterwards.
========================================================= */

import { Navigate, useLocation } from "react-router";
import { useCurrentUser } from "../utils/session";

function RequireAuth({ children }) {
  const user = useCurrentUser();
  const location = useLocation();

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
