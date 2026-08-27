import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import SafeImage from "../../components/SafeImage";
import { EmptyState, Toast } from "../../components/States";

import {
  useAllBlogs,
  useUserBlogs,
  deleteBlog,
  getAuthorName,
  getAuthorUsername,
  getBlogImage,
  estimateReadTime,
} from "../../utils/blogStorage";

import {
  useSaved,
  useLikes,
  useFollowing,
  useAllViews,
  useCommentCount,
  deleteCommentsForBlog,
} from "../../utils/social";

import {
  useCurrentUser,
  updateCurrentUser,
  signOut,
} from "../../utils/session";

import { fileToDataUrl } from "../../utils/fileStore";
import { useToast } from "../../utils/useToast";
import { blogDate, formatCount, formatLongDate } from "../../utils/format";

/* =========================================================
   ICONS
========================================================= */

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useCurrentUser();

  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "blogs"
  );

  /* Your published blogs. */
  const myBlogs = useUserBlogs();

  /* Everything, so a saved demo blog also shows up. */
  const allBlogs = useAllBlogs();

  const { saved, isSaved, toggleSave, savedCount } = useSaved();
  const { likeCount } = useLikes();
  const { followingCount } = useFollowing();
  const views = useAllViews();

  const { toast, showToast } = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState("");

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editDob, setEditDob] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function changeTab(tab) {
    setActiveTab(tab);
    setSearchParams(tab === "blogs" ? {} : { tab }, { replace: true });
  }

  /* =========================================================
     DERIVED STATS
  ========================================================= */

  const savedBlogsList = useMemo(
    () => allBlogs.filter((blog) => saved[String(blog.id)]),
    [allBlogs, saved]
  );

  const totalLikes = useMemo(
    () => myBlogs.reduce((sum, blog) => sum + likeCount(blog), 0),
    [myBlogs, likeCount]
  );

  const totalViews = useMemo(
    () =>
      myBlogs.reduce(
        (sum, blog) => sum + (Number(views[String(blog.id)]) || 0),
        0
      ),
    [myBlogs, views]
  );

  /* =========================================================
     PROFILE EDITING
  ========================================================= */

  function openEdit() {
    setEditName(user?.name || "");
    setEditUsername(user?.username || "");
    setEditBio(user?.bio || "");
    setEditEmail(user?.email || "");
    setEditContact(user?.contact || "");
    setEditDob(user?.dob || "");

    setShowEdit(true);
  }

  function saveProfile() {
    updateCurrentUser({
      name: editName.trim() || user?.name || "INKORA Writer",
      username: editUsername.trim() || user?.username,
      bio: editBio.trim(),
      email: editEmail.trim(),
      contact: editContact.trim(),
      dob: editDob,
    });

    setShowEdit(false);

    showToast("Profile updated", "success");
  }

  async function handleProfileImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast("Profile photo must be under 3 MB", "error");
      return;
    }

    setUploading("avatar");

    try {
      const imageData = await fileToDataUrl(file);

      updateCurrentUser({ avatar: imageData });

      showToast("Profile photo updated", "success");
    } catch (error) {
      console.error("Failed to save profile image:", error);
      showToast("Could not save that photo", "error");
    } finally {
      setUploading("");
    }
  }

  async function handleCoverImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast("Cover photo must be under 4 MB", "error");
      return;
    }

    setUploading("cover");

    try {
      const imageData = await fileToDataUrl(file);

      updateCurrentUser({ coverImage: imageData });

      showToast("Cover photo updated", "success");
    } catch (error) {
      console.error("Failed to save cover image:", error);
      showToast("Could not save that photo", "error");
    } finally {
      setUploading("");
    }
  }

  function handleDeleteBlog() {
    if (!deleteTarget) {
      return;
    }

    deleteBlog(deleteTarget.id);
    deleteCommentsForBlog(deleteTarget.id);

    setDeleteTarget(null);

    showToast("Blog deleted", "success");
  }

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-lg font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/home"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Home
            </Link>

            <Link
              to="/discover"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Discover
            </Link>

            <Link
              to="/create"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
            >
              Create Blog
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Settings
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ================= PROFILE ================= */}

      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* Cover */}

          <div className="relative h-[220px] sm:h-[300px]">
            <SafeImage
              src={user?.coverImage}
              alt="Profile cover"
              className="h-full w-full object-cover"
              fallbackLabel="No cover photo"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            <label className="absolute right-4 top-4 flex cursor-pointer items-center gap-2 rounded-xl bg-black/40 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/60">
              <CameraIcon />
              {uploading === "cover" ? "Saving..." : "Change Cover"}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImage}
                className="hidden"
              />
            </label>
          </div>

          {/* Profile information */}

          <div className="relative px-5 pb-7 sm:px-8 sm:pb-9">
            {/* Profile image */}

            <div className="-mt-16 flex flex-col sm:-mt-20 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <SafeImage
                  src={user?.avatar}
                  alt={user?.name || "Your profile photo"}
                  className="h-32 w-32 rounded-[30px] border-[6px] border-white object-cover shadow-xl dark:border-neutral-900 sm:h-40 sm:w-40"
                  fallbackLabel=""
                />

                <label className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg hover:bg-violet-700">
                  <CameraIcon />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImage}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-5 flex gap-2 sm:ml-auto sm:mt-0 sm:pb-1">
                <Link
                  to={`/u/${encodeURIComponent(
                    String(user?.username || "").replace("@", "")
                  )}`}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Public view
                </Link>

                <button
                  type="button"
                  onClick={openEdit}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-300"
                >
                  <EditIcon />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Name */}

            <div className="mt-5">
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {user?.name}
              </h1>

              <p className="mt-1 text-sm font-medium text-neutral-400">
                {user?.username}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {user?.bio || "No bio yet."}
              </p>
            </div>

            {/* Stats */}

            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-y border-neutral-100 py-5 dark:border-neutral-800">
              <ProfileStat value={formatCount(0)} label="Followers" />

              <ProfileStat
                value={formatCount(followingCount)}
                label="Following"
              />

              <ProfileStat value={myBlogs.length} label="Blogs" />

              <ProfileStat
                value={formatCount(totalLikes)}
                label="Likes received"
              />

              <ProfileStat
                value={formatCount(totalViews)}
                label="Blog views"
              />

              <ProfileStat
                value={formatCount(savedCount)}
                label="Saved"
              />
            </div>
          </div>
        </section>

        {/* ================= TABS ================= */}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="no-scrollbar flex overflow-x-auto" role="tablist">
            <ProfileTab
              active={activeTab === "blogs"}
              onClick={() => changeTab("blogs")}
            >
              Blogs
            </ProfileTab>

            <ProfileTab
              active={activeTab === "about"}
              onClick={() => changeTab("about")}
            >
              About
            </ProfileTab>

            <ProfileTab
              active={activeTab === "saved"}
              onClick={() => changeTab("saved")}
            >
              Saved
              {savedCount > 0 && (
                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {savedCount}
                </span>
              )}
            </ProfileTab>
          </div>
        </div>

        {/* ================= BLOGS ================= */}

        {activeTab === "blogs" && (
          <section className="mt-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                  Published
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  My Blogs
                </h2>
              </div>

              <Link
                to="/create"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              >
                + New Blog
              </Link>
            </div>

            {myBlogs.length === 0 ? (
              <EmptyState
                icon={<EditIcon />}
                title="You haven't published anything yet"
                description="Write your first blog and it will show up here and at the top of the feed."
                actionLabel="Create your first blog"
                actionTo="/create"
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {myBlogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    saved={isSaved(blog.id)}
                    likes={likeCount(blog)}
                    views={Number(views[String(blog.id)]) || 0}
                    onSave={() => toggleSave(blog.id)}
                    onDelete={() => setDeleteTarget(blog)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================= ABOUT ================= */}

        {activeTab === "about" && (
          <section className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              About {user?.name}
            </p>

            <h2 className="mt-2 text-2xl font-black">
              About me
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-500 dark:text-neutral-400">
              {user?.bio || "No bio yet."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoBox label="Email" value={user?.email || "Not added"} />

              <InfoBox label="Contact" value={user?.contact || "Not added"} />

              <InfoBox
                label="Date of Birth"
                value={
                  user?.dob ? formatLongDate(user.dob) : "Not added"
                }
              />

              <InfoBox
                label="Member since"
                value={
                  user?.createdAt
                    ? formatLongDate(user.createdAt)
                    : "Recently"
                }
              />
            </div>
          </section>
        )}

        {/* ================= SAVED ================= */}

        {activeTab === "saved" && (
          <section className="mt-6">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                Your collection
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Saved Blogs
              </h2>
            </div>

            {savedBlogsList.length === 0 ? (
              <EmptyState
                icon={<BookmarkIcon />}
                title="No saved blogs yet"
                description="Blogs you save from your feed will appear here."
                actionLabel="Explore Blogs"
                actionTo="/home"
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {savedBlogsList.map((blog) => (
                  <SavedCard
                    key={blog.id}
                    blog={blog}
                    saved={isSaved(blog.id)}
                    onSave={() => toggleSave(blog.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================= EDIT MODAL ================= */}

      {showEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white shadow-2xl dark:bg-neutral-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-6 py-5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-600">
                  Account
                </p>

                <h2 className="text-xl font-black">
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-6">
              <EditField
                label="Name"
                value={editName}
                onChange={setEditName}
                placeholder="Your name"
              />

              <EditField
                label="Username"
                value={editUsername}
                onChange={setEditUsername}
                placeholder="@username"
              />

              <div>
                <label
                  htmlFor="profile-bio"
                  className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  value={editBio}
                  onChange={(event) => setEditBio(event.target.value)}
                  rows={4}
                  maxLength={300}
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-neutral-800 dark:bg-neutral-950"
                />

                <p className="mt-1 text-right text-[10px] text-neutral-400">
                  {editBio.length}/300
                </p>
              </div>

              <EditField
                label="Email"
                type="email"
                value={editEmail}
                onChange={setEditEmail}
                placeholder="your@email.com"
              />

              <EditField
                label="Contact"
                value={editContact}
                onChange={setEditContact}
                placeholder="+91 XXXXX XXXXX"
              />

              <EditField
                label="Date of Birth"
                type="date"
                value={editDob}
                onChange={setEditDob}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-100 p-6 sm:flex-row sm:justify-end dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-neutral-200 px-5 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE BLOG MODAL ================= */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl dark:bg-neutral-900">
            <h2 className="text-center text-2xl font-black">
              Delete this blog?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              "{deleteTarget.title}" will be removed from this device along
              with its PDF, thumbnail and comments. This cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteBlog}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-xs font-bold text-white hover:bg-red-600"
              >
                Delete Blog
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

function ProfileStat({ value, label }) {
  return (
    <div>
      <p className="text-lg font-black">{value}</p>

      <p className="mt-0.5 text-[10px] font-semibold text-neutral-400">
        {label}
      </p>
    </div>
  );
}

function ProfileTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex shrink-0 items-center px-5 py-4 text-xs font-bold transition sm:px-7 ${
        active
          ? "text-violet-600"
          : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
      }`}
    >
      {children}

      {active && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-violet-600" />
      )}
    </button>
  );
}

/* Your own blog: save, edit, delete. */

function BlogCard({ blog, saved, likes, views, onSave, onDelete }) {
  const commentCount = useCommentCount(blog);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none">
      <Link to={`/blog/${blog.id}`}>
        <div className="relative overflow-hidden">
          <SafeImage
            src={getBlogImage(blog)}
            alt={blog.title}
            className="h-[210px] w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-violet-700 shadow-lg">
            {blog.category}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <Link to={`/blog/${blog.id}`}>
          <h3 className="line-clamp-2 text-lg font-black leading-tight tracking-tight transition group-hover:text-violet-600">
            {blog.title}
          </h3>
        </Link>

        <p className="mt-2 text-[10px] text-neutral-400">
          {blogDate(blog)} · {estimateReadTime(blog)} ·{" "}
          {formatCount(views)} views
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div className="flex items-center gap-4 text-[10px] font-semibold text-neutral-400">
            <span className="flex items-center gap-1">
              <HeartIcon />
              {formatCount(likes)}
            </span>

            <span className="flex items-center gap-1">
              <CommentIcon />
              {formatCount(commentCount)}
            </span>
          </div>

          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save this blog"}
            className={`transition ${
              saved
                ? "text-violet-600"
                : "text-neutral-400 hover:text-violet-600"
            }`}
          >
            <BookmarkIcon active={saved} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/blog/${blog.id}/edit`}
            className="flex-1 rounded-xl border border-neutral-200 py-2 text-center text-[10px] font-bold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={onDelete}
            className="flex-1 rounded-xl bg-red-50 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* A blog you bookmarked, yours or somebody else's. */

function SavedCard({ blog, saved, onSave }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <Link to={`/blog/${blog.id}`}>
        <SafeImage
          src={getBlogImage(blog)}
          alt={blog.title}
          className="h-[200px] w-full object-cover transition hover:scale-[1.02]"
        />
      </Link>

      <div className="p-5">
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          {blog.category}
        </span>

        <Link to={`/blog/${blog.id}`}>
          <h3 className="mt-3 line-clamp-2 text-lg font-black leading-tight hover:text-violet-600">
            {blog.title}
          </h3>
        </Link>

        <p className="mt-2 text-[10px] text-neutral-400">
          By {getAuthorName(blog)} · {blogDate(blog)}
        </p>

        <p className="mt-1 text-[10px] text-neutral-400">
          {getAuthorUsername(blog)}
        </p>

        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold transition ${
            saved
              ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
          }`}
        >
          <BookmarkIcon active={saved} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-800/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        {value}
      </p>
    </div>
  );
}

function EditField({ label, type = "text", value, onChange, placeholder }) {
  const id = `profile-field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-neutral-800 dark:bg-neutral-950"
      />
    </div>
  );
}

export default Profile;
