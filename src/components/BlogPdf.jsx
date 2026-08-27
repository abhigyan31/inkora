/* =========================================================
   INKORA BLOG PDF

   PdfReader can read a File, a Blob, a data URL or an
   ArrayBuffer, but it cannot read an INKORA file reference.

   This component resolves the reference out of the file
   store first, and shows proper loading and error states
   while that happens.
========================================================= */

import { lazy, Suspense, useEffect, useState } from "react";
import { isFileRef, readFileAsBlob } from "../utils/fileStore";
import { LoadingBlock, ErrorState } from "./States";

/* pdfjs is about 1 MB. Loading it only when a blog actually
   has a PDF keeps the first page load small for every reader
   who never opens one. */

const PdfReader = lazy(() => import("./PdfReader"));

function BlogPdf({ file }) {
  const [resolved, setResolved] = useState(() =>
    isFileRef(file) ? null : file || null
  );

  const [loading, setLoading] = useState(() => isFileRef(file));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      setResolved(null);
      setLoading(false);
      setError("");
      return undefined;
    }

    if (!isFileRef(file)) {
      setResolved(file);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    setError("");
    setResolved(null);

    readFileAsBlob(file)
      .then((blob) => {
        if (cancelled) {
          return;
        }

        if (!blob) {
          setError(
            "This PDF is no longer stored on this device. It may have been " +
              "uploaded in a different browser, or the site data was cleared."
          );
          setLoading(false);
          return;
        }

        setResolved(blob);
        setLoading(false);
      })
      .catch((loadError) => {
        console.error("Failed to load the blog PDF:", loadError);

        if (!cancelled) {
          setError("We couldn't open this PDF from your device storage.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (loading) {
    return (
      <LoadingBlock
        title="Opening the document..."
        description="Reading the PDF from your device."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="PDF unavailable"
        description={error}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <LoadingBlock
          title="Loading the reader..."
          description="Preparing the PDF viewer."
        />
      }
    >
      <PdfReader file={resolved} />
    </Suspense>
  );
}

export default BlogPdf;
