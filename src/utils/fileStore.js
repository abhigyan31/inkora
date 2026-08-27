/* =========================================================
   INKORA FILE STORE

   Thumbnails and PDFs don't fit in localStorage. The quota
   is ~5 MB and base64 adds about 33%, so a 5 MB PDF becomes
   ~6.7 MB and blows up on the first upload.

   So: files go in IndexedDB as Blobs, and the blog record
   just stores a reference string like

     "inkora-file:2f9c...-a41b"

   Anything that isn't a ref (a data: URL from an old post,
   or an http URL) gets used as-is, so nothing breaks.
========================================================= */

import { createId } from "./store";
import { useEffect, useState } from "react";

const DB_NAME = "inkora_files";
const DB_VERSION = 1;
const STORE_NAME = "files";

export const FILE_REF_PREFIX = "inkora-file:";

/* =========================================================
   DATABASE
========================================================= */

let databasePromise = null;

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(request.error || new Error("Could not open the INKORA file store."));
  });

  return databasePromise;
}

function runTransaction(mode, action) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);

        let result;

        try {
          result = action(store);
        } catch (error) {
          reject(error);
          return;
        }

        transaction.oncomplete = () =>
          resolve(result && result.result !== undefined ? result.result : result);

        transaction.onerror = () =>
          reject(transaction.error || new Error("File store request failed."));

        transaction.onabort = () =>
          reject(transaction.error || new Error("File store request aborted."));
      })
  );
}

/* =========================================================
   PUBLIC HELPERS
========================================================= */

export function isFileRef(value) {
  return typeof value === "string" && value.startsWith(FILE_REF_PREFIX);
}

export async function saveFile(file) {
  if (!file) {
    throw new Error("No file was provided.");
  }

  const ref = `${FILE_REF_PREFIX}${createId()}`;

  await runTransaction("readwrite", (store) =>
    store.put(
      {
        blob: file,
        name: file.name || "file",
        type: file.type || "application/octet-stream",
        size: file.size || 0,
        savedAt: new Date().toISOString(),
      },
      ref
    )
  );

  return ref;
}

export async function readFile(ref) {
  if (!isFileRef(ref)) {
    return null;
  }

  const record = await runTransaction("readonly", (store) => store.get(ref));

  return record || null;
}

export async function deleteFile(ref) {
  if (!isFileRef(ref)) {
    return;
  }

  try {
    await runTransaction("readwrite", (store) => store.delete(ref));
  } catch (error) {
    console.error("Failed to delete an INKORA file:", error);
  }
}

/* Returns something an <img src> or PdfReader can actually use. */

export async function resolveFileUrl(value) {
  if (!value) {
    return "";
  }

  if (!isFileRef(value)) {
    /* Data URL, http URL or a plain path. Use it directly. */
    return value;
  }

  const record = await readFile(value);

  if (!record || !record.blob) {
    throw new Error("This file is no longer stored on this device.");
  }

  return URL.createObjectURL(record.blob);
}

export async function readFileAsBlob(value) {
  if (isFileRef(value)) {
    const record = await readFile(value);
    return record ? record.blob : null;
  }

  return null;
}

/* =========================================================
   REACT HOOK

   const { url, loading, error } = useFileUrl(blog.thumbnail);

   Object URLs are revoked automatically on unmount so the
   browser does not leak memory while scrolling the feed.
========================================================= */

export function useFileUrl(value) {
  const [state, setState] = useState({
    url: isFileRef(value) ? "" : value || "",
    loading: isFileRef(value),
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    if (!value) {
      setState({ url: "", loading: false, error: "" });
      return undefined;
    }

    if (!isFileRef(value)) {
      setState({ url: value, loading: false, error: "" });
      return undefined;
    }

    setState({ url: "", loading: true, error: "" });

    resolveFileUrl(value)
      .then((resolved) => {
        if (cancelled) {
          URL.revokeObjectURL(resolved);
          return;
        }

        objectUrl = resolved;

        setState({ url: resolved, loading: false, error: "" });
      })
      .catch((error) => {
        console.error("Failed to load an INKORA file:", error);

        if (!cancelled) {
          setState({
            url: "",
            loading: false,
            error: "This file could not be loaded.",
          });
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  return state;
}

/* =========================================================
   LEGACY HELPER

   Kept because Profile still stores avatars as data URLs,
   which is fine: avatars are small.
========================================================= */

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));

    reader.readAsDataURL(file);
  });
}
