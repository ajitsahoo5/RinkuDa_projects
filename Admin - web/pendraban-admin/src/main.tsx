import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { APP_NAME } from "./lib/branding";
import { initFirebaseAnalytics, isFirebaseConfigured } from "./lib/firebase";

document.title = APP_NAME;

if (isFirebaseConfigured()) void initFirebaseAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
