import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function ChevronLeftIcon() {
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
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ZoomOutIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ZoomInIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6" />
      <path d="M11 8v6" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

/* =========================================================
   CONVERT ANY SUPPORTED PDF VALUE INTO ARRAYBUFFER
========================================================= */

async function getPdfArrayBuffer(file) {
  /* Normal uploaded File object */
  if (file instanceof File) {
    return await file.arrayBuffer();
  }

  /* Blob support */
  if (file instanceof Blob) {
    return await file.arrayBuffer();
  }

  /* Data URL saved in localStorage */
  if (typeof file === "string") {
    if (!file.startsWith("data:")) {
      throw new Error("Invalid PDF data.");
    }

    const commaIndex = file.indexOf(",");

    if (commaIndex === -1) {
      throw new Error("Invalid PDF data URL.");
    }

    const metadata = file.substring(0, commaIndex);
    const data = file.substring(commaIndex + 1);

    if (metadata.includes(";base64")) {
      const binaryString = window.atob(data);

      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes.buffer;
    }

    const decodedData = decodeURIComponent(data);

    return new TextEncoder().encode(decodedData).buffer;
  }

  /* ArrayBuffer support */
  if (file instanceof ArrayBuffer) {
    return file;
  }

  /* Uint8Array support */
  if (file instanceof Uint8Array) {
    return file.buffer;
  }

  throw new Error("Unsupported PDF format.");
}

/* =========================================================
   TEAR DOWN A LOADED PDF

   pdfjs-dist 6 removed PDFDocumentProxy.destroy(); the
   loading task owns the cleanup now. This tries the task
   first and falls back to the document, so the component
   works on old and new versions of pdf.js without throwing
   on unmount.
========================================================= */

function destroyPdf(loadingTask, document_) {
  try {
    if (loadingTask && typeof loadingTask.destroy === "function") {
      loadingTask.destroy();
      return;
    }

    if (document_ && typeof document_.destroy === "function") {
      document_.destroy();
    }
  } catch (error) {
    /* Already torn down. Nothing to do. */
  }
}

function PdfReader({ file }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.15);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD PDF
  ========================================================= */

  useEffect(() => {
    let cancelled = false;
    let loadedDocument = null;
    let loadingTask = null;

    async function loadPdf() {
      if (!file) {
        setPdfDocument(null);
        setPageCount(0);
        setPageNumber(1);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setPdfDocument(null);
      setPageCount(0);
      setPageNumber(1);

      try {
        const arrayBuffer = await getPdfArrayBuffer(file);

        if (cancelled) {
          return;
        }

        loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
        });

        loadedDocument = await loadingTask.promise;

        if (cancelled) {
          destroyPdf(loadingTask, loadedDocument);
          return;
        }

        setPdfDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
      } catch (err) {
        console.error("PDF loading error:", err);

        if (!cancelled) {
          setError(
            "We couldn't open this PDF. Please make sure the file is a valid PDF."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;

      destroyPdf(loadingTask, loadedDocument);
    };
  }, [file]);

  /* =========================================================
     RENDER CURRENT PAGE
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!pdfDocument || !canvasRef.current) {
        return;
      }

      /* A canvas can only run one render at a time, so stop
         the previous page before starting this one. */

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          /* Already finished. */
        }

        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocument.getPage(pageNumber);

        if (cancelled) {
          return;
        }

        const viewport = page.getViewport({
          scale,
        });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const devicePixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(
          viewport.width * devicePixelRatio
        );

        canvas.height = Math.floor(
          viewport.height * devicePixelRatio
        );

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(
          devicePixelRatio,
          0,
          0,
          devicePixelRatio,
          0,
          0
        );

        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        renderTaskRef.current = null;
      } catch (err) {
        /* Cancelling a render is normal when the reader moves
           to another page or zoom level. It is not an error. */

        if (err?.name === "RenderingCancelledException") {
          return;
        }

        console.error("PDF rendering error:", err);

        if (!cancelled) {
          setError("We couldn't render this page.");
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          /* Already finished. */
        }

        renderTaskRef.current = null;
      }
    };
  }, [pdfDocument, pageNumber, scale]);

  /* =========================================================
     CONTROLS
  ========================================================= */

  function previousPage() {
    setPageNumber((current) =>
      Math.max(1, current - 1)
    );
  }

  function nextPage() {
    setPageNumber((current) =>
      Math.min(pageCount, current + 1)
    );
  }

  function zoomOut() {
    setScale((current) =>
      Math.max(0.75, current - 0.15)
    );
  }

  function zoomIn() {
    setScale((current) =>
      Math.min(2.5, current + 0.15)
    );
  }

  function resetZoom() {
    setScale(1.15);
  }

  /* =========================================================
     NO PDF
  ========================================================= */

  if (!file) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl bg-neutral-100 p-8 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-300 shadow-sm">
            PDF
          </div>

          <p className="mt-4 text-sm font-bold text-neutral-500">
            No PDF selected
          </p>

          <p className="mt-1 text-xs text-neutral-400">
            Upload a PDF to start reading it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-100">

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3">

        {/* PAGE NAVIGATION */}

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={previousPage}
            disabled={loading || pageNumber <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </button>

          <div className="min-w-[90px] text-center">

            <span className="text-xs font-bold text-neutral-700">
              {pageCount > 0 ? pageNumber : "-"}
            </span>

            <span className="mx-1 text-xs text-neutral-400">
              /
            </span>

            <span className="text-xs font-bold text-neutral-400">
              {pageCount || "-"}
            </span>

          </div>

          <button
            type="button"
            onClick={nextPage}
            disabled={
              loading ||
              pageCount === 0 ||
              pageNumber >= pageCount
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </button>

        </div>

        {/* ZOOM */}

        <div className="flex items-center gap-1.5">

          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.75}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
            aria-label="Zoom out"
          >
            <ZoomOutIcon />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[58px] rounded-xl border border-neutral-200 px-2 py-2 text-[10px] font-bold text-neutral-600 transition hover:bg-neutral-50"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
            aria-label="Zoom in"
          >
            <ZoomInIcon />
          </button>

        </div>
      </div>

      {/* =====================================================
          READER
      ===================================================== */}

      <div className="flex min-h-[520px] items-start justify-center overflow-auto p-5 sm:p-8">

        {loading && (
          <div className="flex min-h-[450px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-violet-600" />

              <p className="mt-4 text-sm font-bold text-neutral-600">
                Opening your PDF...
              </p>

              <p className="mt-1 text-xs text-neutral-400">
                Please wait a moment.
              </p>

            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[450px] max-w-md items-center justify-center text-center">

            <div>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xs font-black text-red-500">
                PDF
              </div>

              <h3 className="mt-4 text-base font-black text-neutral-800">
                Unable to open PDF
              </h3>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                {error}
              </p>

            </div>
          </div>
        )}

        {!loading && !error && pdfDocument && (
          <div className="overflow-hidden rounded-md bg-white shadow-xl">

            <canvas
              ref={canvasRef}
              className="block max-w-none"
            />

          </div>
        )}

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {!loading && !error && pageCount > 0 && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 text-center">

          <p className="text-[10px] font-medium text-neutral-400">
            Page {pageNumber} of {pageCount}
          </p>

        </div>
      )}

    </div>
  );
}

export default PdfReader;