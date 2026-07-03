import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./pages/Appearance"; // side-effect: applies saved UI prefs before render
import { registerSW } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker (guarded — only in production, non-preview, non-iframe)
registerSW();
