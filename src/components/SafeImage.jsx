/* =========================================================
   INKORA SAFE IMAGE

   Drop-in <img> that copes with all four kinds of src we end
   up with: IndexedDB refs ("inkora-file:..."), data URLs,
   plain http URLs, and dead links.

   Shows a shimmer while loading and a labelled placeholder
   if it fails, instead of the broken image icon.
========================================================= */

import { useEffect, useState } from "react";
import { useFileUrl } from "../utils/fileStore";

function PlaceholderIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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

function SafeImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  fallbackLabel = "Image unavailable",
}) {
  const { url, loading, error } = useFileUrl(src);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const unavailable = Boolean(error) || failed || (!loading && !url);

  if (unavailable) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 ${className} ${wrapperClassName}`}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <PlaceholderIcon />

        <span className="px-3 text-center text-[10px] font-semibold">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 ${className} ${wrapperClassName}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export default SafeImage;
