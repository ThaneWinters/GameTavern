import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  // If this happens, nothing React-side can recover.
  // eslint-disable-next-line no-console
  console.error("[bootstrap] #root element not found");
  document.body.innerHTML = "<pre style=\"padding:16px\">Fatal: #root element not found</pre>";
} else {
  // Provide immediate feedback even if React crashes during init.
  rootEl.innerHTML = "<div style=\"padding:16px\">Loading…</div>";

  try {
    createRoot(rootEl).render(<App />);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[bootstrap] render failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    rootEl.innerHTML = `<pre style="padding:16px">Fatal: ${msg}</pre>`;
  }
}

