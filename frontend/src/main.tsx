import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { GlassToastProvider } from "./app/components/GlassToast";
import "./styles/index.css";

document.title = "eClínica";

createRoot(document.getElementById("root")!).render(
  <GlassToastProvider>
    <App />
  </GlassToastProvider>
);
