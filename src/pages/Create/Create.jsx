import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import BlogPdf from "../../components/BlogPdf";
import SafeImage from "../../components/SafeImage";
import { Toast } from "../../components/States";

import {
  saveBlog,
  updateBlog,
  getBlogById,
  uploadBlogFile,
  estimateReadTime,
} from "../../utils/blogStorage";

import { useCurrentUser } from "../../utils/session";
import { useToast } from "../../utils/useToast";
import { topics } from "../../utils/demoData";

const categories = topics;

function ImageIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/* =========================================================
   CREATE / EDIT
========================================================= */

function Create() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  const user = useCurrentUser();
  const { toast, showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  /* A newly picked File, or an existing stored reference. */

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailRef, setThumbnailRef] = useState("");
  const [thumbnailObjectUrl, setThumbnailObjectUrl] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfRef, setPdfRef] = useState("");
  const [pdfMeta, setPdfMeta] = useState(null);

  const [showPreview, setShowPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedBlog, setPublishedBlog] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const [errors, setErrors] = useState({});

  /* =========================================================
     LOAD FOR EDITING
  ========================================================= */

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    let cancelled = false;

    setLoadingBlog(true);

    getBlogById(id)
      .then((existing) => {
        if (cancelled) {
          return;
        }

        if (!existing) {
          setLoadFailed(true);
          return;
        }

        setTitle(existing.title || "");
        setDescription(existing.description || "");
        setCategory(existing.category || "");
        setTags(Array.isArray(existing.tags) ? existing.tags.join(", ") : "");

        setThumbnailRef(existing.thumbnail || "");
        setPdfRef(existing.pdf || "");

        setPdfMeta(
          existing.pdfName
            ? { name: existing.pdfName, size: existing.pdfSize || 0 }
            : { name: "Current document", size: 0 }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBlog(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  /* =========================================================
     THUMBNAIL PREVIEW
  ========================================================= */

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailObjectUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(thumbnailFile);

    setThumbnailObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  const thumbnailPreview = thumbnailObjectUrl || thumbnailRef;

  const hasThumbnail = Boolean(thumbnailFile || thumbnailRef);
  const hasPdf = Boolean(pdfFile || pdfRef);

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  /* =========================================================
     FILE PICKERS
  ========================================================= */

  function handleThumbnailChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        thumbnail: "Please select a valid image file.",
      }));

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        thumbnail: "Thumbnail must be smaller than 5 MB.",
      }));

      return;
    }

    setThumbnailFile(file);

    setErrors((previous) => ({ ...previous, thumbnail: "" }));
  }

  function handlePdfChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setErrors((previous) => ({
        ...previous,
        pdf: "Please select a PDF file.",
      }));

      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        pdf: "PDF must be smaller than 20 MB.",
      }));

      return;
    }

    setPdfFile(file);
    setPdfMeta({ name: file.name, size: file.size });

    setErrors((previous) => ({ ...previous, pdf: "" }));
  }

  function removeThumbnail() {
    setThumbnailFile(null);
    setThumbnailRef("");

    setErrors((previous) => ({
      ...previous,
      thumbnail: "Please upload a thumbnail.",
    }));
  }

  function removePdf() {
    setPdfFile(null);
    setPdfRef("");
    setPdfMeta(null);

    setErrors((previous) => ({
      ...previous,
      pdf: "Please upload your blog PDF.",
    }));
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validate() {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Blog title is required.";
    }

    if (title.trim().length > 120) {
      newErrors.title = "Title cannot be longer than 120 characters.";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required.";
    }

    if (description.trim().length > 300) {
      newErrors.description =
        "Description cannot be longer than 300 characters.";
    }

    if (!category) {
      newErrors.category = "Please select a category.";
    }

    if (!hasThumbnail) {
      newErrors.thumbnail = "Please upload a thumbnail.";
    }

    if (!hasPdf) {
      newErrors.pdf = "Please upload your blog PDF.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handlePreview() {
    if (!validate()) {
      showToast("Please complete the highlighted fields", "error");
      return;
    }

    setShowPreview(true);
  }

  /* =========================================================
     PUBLISH / UPDATE

     Files go to IndexedDB. The blog record only keeps a short
     reference, so localStorage never fills up.
  ========================================================= */

  async function handlePublish() {
    if (saving) {
      return;
    }

    if (!validate()) {
      showToast("Please complete the highlighted fields", "error");
      return;
    }

    setSaving(true);

    try {
      let finalThumbnail = thumbnailRef;
      let finalPdf = pdfRef;

      /* Files go up first. The blog row stores the path the
         server hands back, so a half-finished upload never
         ends up attached to a post. */
      if (thumbnailFile) {
        setUploadStep("Uploading thumbnail...");

        const uploaded = await uploadBlogFile(thumbnailFile, "image");
        finalThumbnail = uploaded.path;
      }

      if (pdfFile) {
        setUploadStep("Uploading PDF...");

        const uploaded = await uploadBlogFile(pdfFile, "pdf");
        finalPdf = uploaded.path;
      }

      setUploadStep(isEditing ? "Saving changes..." : "Publishing...");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagList,
        thumbnail: finalThumbnail,
        pdf: finalPdf,
        pdfName: pdfMeta?.name || "",
        pdfSize: pdfMeta?.size || 0,
        readTime: estimateReadTime({
          title,
          description,
          pdf: finalPdf,
        }),
      };

      let result;

      if (isEditing) {
        result = await updateBlog(id, payload);

        if (!result) {
          throw new Error("This blog no longer exists.");
        }

        showToast("Blog updated", "success");

        navigate(`/blog/${id}`);
        return;
      }

      /* The server takes the author from the session - it
         never trusts an author sent by the client. */
      result = await saveBlog(payload);

      setPublishedBlog(result);
      setPublished(true);
    } catch (error) {
      console.error("Failed to publish blog:", error);

      setErrors((previous) => ({
        ...previous,
        publish:
          error?.status === 413
            ? "That file is larger than the server accepts."
            : error?.message ||
              "Something went wrong while saving your blog.",
      }));

      showToast("Could not save your blog", "error");
    } finally {
      setSaving(false);
      setUploadStep("");
    }
  }

  function closePublishedMessage() {
    setPublished(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("");
    setTags("");
    setThumbnailFile(null);
    setThumbnailRef("");
    setPdfFile(null);
    setPdfRef("");
    setPdfMeta(null);
    setErrors({});
    setPublished(false);
    setPublishedBlog(null);
  }

  /* =========================================================
     EDIT TARGET MISSING
  ========================================================= */

  if (loadFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-2xl font-black dark:text-white">
            Blog not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            You can only edit blogs you published yourself.
          </p>

          <Link
            to="/profile"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-700"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/home"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:block dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Home
            </Link>

            <Link
              to="/discover"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:block dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Discover
            </Link>

            <Link
              to="/profile"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 sm:px-4 sm:text-sm dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">
        <Link
          to={isEditing ? `/blog/${id}` : "/home"}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-violet-600"
        >
          <ArrowLeftIcon />
          {isEditing ? "Back to blog" : "Back to feed"}
        </Link>

        {/* ================= TITLE ================= */}

        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
            {isEditing
              ? "Update your story"
              : "Create something worth sharing"}
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            {isEditing ? "Edit your blog." : "Create your blog."}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400 sm:text-base">
            Upload your story as a PDF, add a beautiful thumbnail, describe
            your idea, and share it with the INKORA community.
          </p>
        </div>

        {/* ================= FORM GRID ================= */}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* ================= LEFT ================= */}

          <section className="space-y-6">
            {/* Blog details */}

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                  01
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Blog details
                </h2>
              </div>

              {/* Title */}

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="blog-title"
                    className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                  >
                    Blog title
                  </label>

                  <span className="text-[10px] text-neutral-400">
                    {title.length}/120
                  </span>
                </div>

                <input
                  id="blog-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  aria-invalid={Boolean(errors.title)}
                  placeholder="Give your story a memorable title..."
                  className={`mt-2 w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:bg-neutral-950 ${
                    errors.title
                      ? "border-red-300"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                />

                {errors.title && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="blog-description"
                    className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                  >
                    Description
                  </label>

                  <span className="text-[10px] text-neutral-400">
                    {description.length}/300
                  </span>
                </div>

                <textarea
                  id="blog-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={300}
                  rows={5}
                  aria-invalid={Boolean(errors.description)}
                  placeholder="Tell readers what your blog is about..."
                  className={`mt-2 w-full resize-none rounded-xl border px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:bg-neutral-950 ${
                    errors.description
                      ? "border-red-300"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                />

                {errors.description && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Category */}

              <div className="mt-5">
                <label
                  htmlFor="blog-category"
                  className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Category
                </label>

                <select
                  id="blog-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-invalid={Boolean(errors.category)}
                  className={`mt-2 w-full appearance-none rounded-xl border bg-white px-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:bg-neutral-950 ${
                    category ? "text-neutral-900 dark:text-white" : "text-neutral-400"
                  } ${
                    errors.category
                      ? "border-red-300"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <option value="">Select a category</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {errors.category && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Tags */}

              <div className="mt-5">
                <label
                  htmlFor="blog-tags"
                  className="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Tags
                </label>

                <input
                  id="blog-tags"
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="programming, web development, student life"
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-neutral-800 dark:bg-neutral-950"
                />

                <p className="mt-2 text-[10px] text-neutral-400">
                  Separate multiple tags with commas.
                </p>

                {tagList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail */}

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                02
              </p>

              <h2 className="mt-1 text-xl font-black">
                Blog thumbnail
              </h2>

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Choose an attractive image that represents your story.
              </p>

              <div className="mt-5">
                {!thumbnailPreview ? (
                  <label className="group flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 text-center transition hover:border-violet-400 hover:bg-violet-50 dark:border-neutral-800 dark:bg-neutral-950">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm transition group-hover:scale-105 dark:bg-neutral-900">
                      <ImageIcon />
                    </div>

                    <p className="mt-4 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                      Upload thumbnail
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      PNG, JPG or WEBP · Max 5 MB
                    </p>

                    <span className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white">
                      Choose Image
                    </span>
                  </label>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl">
                    <SafeImage
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-[300px] w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                      <p className="text-xs font-bold text-white">
                        {thumbnailFile
                          ? thumbnailFile.name
                          : "Current thumbnail"}
                      </p>

                      {thumbnailFile && (
                        <p className="mt-1 text-[10px] text-white/70">
                          {(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-3 top-3 rounded-lg bg-black/60 px-3 py-2 text-[10px] font-bold text-white backdrop-blur hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {errors.thumbnail && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {errors.thumbnail}
                  </p>
                )}
              </div>
            </div>

            {/* PDF */}

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                03
              </p>

              <h2 className="mt-1 text-xl font-black">
                Blog PDF
              </h2>

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Upload the PDF containing your complete blog.
              </p>

              {!hasPdf ? (
                <label className="group mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 text-center transition hover:border-violet-400 hover:bg-violet-50 dark:border-neutral-800 dark:bg-neutral-950">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm transition group-hover:scale-105 dark:bg-neutral-900">
                    <UploadIcon />
                  </div>

                  <p className="mt-4 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    Upload your PDF
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    PDF only · Maximum 20 MB
                  </p>

                  <span className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white">
                    Choose PDF
                  </span>
                </label>
              ) : (
                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-[9px] font-black text-white">
                    PDF
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-800 dark:text-neutral-100">
                      {pdfMeta?.name || "Current document"}
                    </p>

                    {pdfMeta?.size > 0 && (
                      <p className="mt-1 text-[10px] text-neutral-400">
                        {(pdfMeta.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckIcon />
                    </span>

                    <button
                      type="button"
                      onClick={removePdf}
                      className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {errors.pdf && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {errors.pdf}
                </p>
              )}
            </div>
          </section>

          {/* ================= RIGHT SIDEBAR ================= */}

          <aside className="space-y-5">
            {/* Publishing checklist */}

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                Publishing checklist
              </p>

              <h2 className="mt-1 text-lg font-black">
                Your blog
              </h2>

              <div className="mt-5 space-y-3">
                <ChecklistItem
                  label="Title"
                  complete={Boolean(title.trim())}
                />

                <ChecklistItem
                  label="Description"
                  complete={Boolean(description.trim())}
                />

                <ChecklistItem
                  label="Category"
                  complete={Boolean(category)}
                />

                <ChecklistItem
                  label="Thumbnail"
                  complete={hasThumbnail}
                />

                <ChecklistItem
                  label="PDF document"
                  complete={hasPdf}
                />
              </div>
            </div>

            {/* Live preview */}

            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-5 dark:border-neutral-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                  Live preview
                </p>

                <h2 className="mt-1 text-lg font-black">
                  How it will look
                </h2>
              </div>

              <div>
                {thumbnailPreview ? (
                  <SafeImage
                    src={thumbnailPreview}
                    alt="Preview"
                    className="h-[180px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[180px] items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800">
                    <ImageIcon />
                  </div>
                )}
              </div>

              <div className="p-5">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {category || "Category"}
                </span>

                <h3 className="mt-3 line-clamp-3 text-lg font-black leading-tight">
                  {title || "Your blog title will appear here"}
                </h3>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {description ||
                    "Your blog description will appear here once you start writing."}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <SafeImage
                    src={user?.avatar}
                    alt={user?.name || "You"}
                    className="h-7 w-7 rounded-full object-cover"
                    fallbackLabel=""
                  />

                  <div>
                    <p className="text-[10px] font-bold">
                      {user?.name || "You"}
                    </p>

                    <p className="text-[9px] text-neutral-400">
                      {user?.username || "@you"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <button
                type="button"
                onClick={handlePreview}
                className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"
              >
                Preview Blog
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {saving
                  ? uploadStep || "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Publish Blog"}
              </button>

              {errors.publish && (
                <p className="mt-3 text-xs font-medium text-red-500">
                  {errors.publish}
                </p>
              )}

              <p className="mt-3 text-center text-[10px] leading-4 text-neutral-400">
                Your blog, its thumbnail and its PDF are stored on the
                server, so they are there on any device you sign in from.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ================= PREVIEW MODAL ================= */}

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white shadow-2xl dark:bg-neutral-900">
            {/* Preview Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-600">
                  Preview
                </p>

                <h2 className="text-lg font-black">
                  Your published blog
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Close
              </button>
            </div>

            {/* Preview Content */}

            <div>
              {thumbnailPreview && (
                <SafeImage
                  src={thumbnailPreview}
                  alt={title}
                  className="h-[300px] w-full object-cover sm:h-[380px]"
                />
              )}

              <div className="p-6 sm:p-9">
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {category}
                </span>

                <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  {title}
                </h1>

                <p className="mt-4 text-base leading-7 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>

                {/* Author */}

                <div className="mt-6 flex items-center gap-3 border-y border-neutral-100 py-5 dark:border-neutral-800">
                  <SafeImage
                    src={user?.avatar}
                    alt={user?.name || "You"}
                    className="h-10 w-10 rounded-full object-cover"
                    fallbackLabel=""
                  />

                  <div>
                    <p className="text-xs font-black">
                      {user?.name || "You"}
                    </p>

                    <p className="text-[10px] text-neutral-400">
                      {user?.username || "@you"}
                    </p>
                  </div>
                </div>

                {/* Tags */}

                {tagList.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* PDF */}

                {(pdfFile || pdfRef) && (
                  <div className="mt-8">
                    <div className="mb-4">
                      <p className="text-xs font-black text-neutral-800 dark:text-neutral-100">
                        Blog document
                      </p>

                      <p className="mt-1 text-[10px] text-neutral-400">
                        Preview the PDF your readers will see.
                      </p>
                    </div>

                    <BlogPdf file={pdfFile || pdfRef} />
                  </div>
                )}
              </div>

              {/* Preview Actions */}

              <div className="flex flex-col gap-3 border-t border-neutral-100 p-5 sm:flex-row sm:justify-end dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rounded-xl border border-neutral-200 px-5 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Keep Editing
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowPreview(false);
                    handlePublish();
                  }}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {isEditing ? "Save Changes" : "Publish Blog"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PUBLISHED MESSAGE ================= */}

      {published && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl dark:bg-neutral-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckIcon />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              Your blog is published!
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              "{publishedBlog?.title}" is now at the top of the feed and on
              your profile.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  closePublishedMessage();
                  navigate(`/blog/${publishedBlog?.id}`);
                }}
                className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-700"
              >
                Read your blog
              </button>

              <button
                type="button"
                onClick={() => {
                  closePublishedMessage();
                  navigate("/home");
                }}
                className="rounded-xl border border-neutral-200 px-5 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Back to Feed
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl px-5 py-3 text-xs font-bold text-neutral-400 hover:text-violet-600"
              >
                Write another blog
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

function ChecklistItem({ label, complete }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          complete
            ? "bg-green-100 text-green-600"
            : "bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600"
        }`}
      >
        {complete ? (
          <CheckIcon />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>

      <span
        className={`text-xs font-semibold ${
          complete
            ? "text-neutral-700 dark:text-neutral-200"
            : "text-neutral-400"
        }`}
      >
        {label}
      </span>

      {complete && (
        <span className="ml-auto text-[9px] font-bold text-green-600">
          Ready
        </span>
      )}
    </div>
  );
}

export default Create;
