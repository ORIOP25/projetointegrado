import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "next-themes"; // Importa o ThemeProvider

createRoot(document.getElementById("root")!).render(
  // Adiciona o ThemeProvider aqui
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);