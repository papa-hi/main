import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/animations.css"; // Import our custom animations
import { ThemeProvider } from "./components/ui/theme-provider";
import "./i18n"; // Import i18n configuration

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
