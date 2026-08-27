/* =========================================================
   INKORA TOAST HOOK

   const { toast, showToast } = useToast();
   showToast("Link copied", "success");

   <Toast message={toast.message} tone={toast.tone} />
========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(duration = 2400) {
  const [toast, setToast] = useState({ message: "", tone: "default" });

  const timerRef = useRef(null);

  const showToast = useCallback(
    (message, tone = "default") => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ message, tone });

      timerRef.current = setTimeout(() => {
        setToast({ message: "", tone: "default" });
      }, duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}

export default useToast;
