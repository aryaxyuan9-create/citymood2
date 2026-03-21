
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import TryPage from "./pages/TryPage.tsx";
import AtlasPage from "./pages/AtlasPage.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/try" element={<TryPage />} />
      <Route path="/atlas/:id" element={<AtlasPage />} />
    </Routes>
  </BrowserRouter>
);
