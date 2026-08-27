import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    /* In development the React app runs on :5173 and PHP runs
       somewhere else, so /api and /uploads get forwarded.
       In production both are served from the same folder and
       Apache handles it, so none of this applies.

       Point VITE_API_PROXY at wherever PHP is listening
       (XAMPP is usually http://localhost). */
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_API_PROXY || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
