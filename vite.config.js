import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /* Where the PHP backend lives during development.
     Put VITE_API_PROXY in a .env file (see .env.example).

     In production this never applies - the React build and
     the API are served from the same folder by Apache, so
     /api is just a path on the same domain. */
  const target = env.VITE_API_PROXY || "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: true,
        },
        "/uploads": {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
