import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { bootstrapTheme } from "./utils/settings";

/* Apply the saved theme before React renders so dark mode
   does not flash white on every reload. */

bootstrapTheme();

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
