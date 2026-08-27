import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router";

import Landing from "./pages/Landing/Landing";
import Auth from "./pages/Auth/Auth";
import Feed from "./pages/Feed/Feed";
import Discover from "./pages/Discover/Discover";
import Blog from "./pages/Blog/Blog";
import Create from "./pages/Create/Create";
import Profile from "./pages/Profile/Profile";
import PublicProfile from "./pages/PublicProfile/PublicProfile";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";
import BlogReader from "./pages/BlogReader/BlogReader";
import NotFound from "./pages/NotFound/NotFound";

import RequireAuth from "./components/RequireAuth";

import { useThemeEffect } from "./utils/settings";

/* Stand-in for any page I haven't built yet. */

function Placeholder({ title, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 font-black text-white">
          I
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export { Placeholder };

/* =========================================================
   SCROLL RESET

   Without this, opening a blog from halfway down the feed
   drops you halfway down the article.
========================================================= */

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

/* =========================================================
   APP
========================================================= */

function App() {
  /* Keeps dark mode applied on every page. */
  useThemeEffect();

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/home" element={<Feed />} />

        <Route path="/discover" element={<Discover />} />

        <Route path="/login" element={<Auth />} />

        <Route path="/signup" element={<Auth />} />

        {/* Full blog page: PDF, likes, comments, sharing. */}
        <Route path="/blog/:id" element={<Blog />} />

        {/* Distraction-free reading view of the same blog. */}
        <Route path="/read/:id" element={<BlogReader />} />

        <Route
          path="/blog/:id/edit"
          element={
            <RequireAuth>
              <Create />
            </RequireAuth>
          }
        />

        <Route
          path="/create"
          element={
            <RequireAuth>
              <Create />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Public profile of any writer. */}
        <Route path="/u/:username" element={<PublicProfile />} />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
