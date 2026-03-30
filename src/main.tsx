
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Component, ReactNode } from "react";
import App from "./App.tsx";
import TryPage from "./pages/TryPage.tsx";
import AtlasPage from "./pages/AtlasPage.tsx";
import "./index.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0b17",
          color: "#f5ecff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 24,
        }}>
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 22, marginBottom: 10 }}>Page failed to render</h1>
            <p style={{ opacity: 0.85, marginBottom: 12 }}>Try refreshing or go back to home.</p>
            <code style={{ fontSize: 13, opacity: 0.75 }}>{this.state.message}</code>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/try" element={<TryPage />} />
        <Route path="/atlas" element={<Navigate to="/try" replace />} />
        <Route path="/atlas/:id" element={<AtlasPage />} />
        <Route path="/atlases" element={<Navigate to="/try" replace />} />
        <Route path="/atlases/:id" element={<AtlasPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AppErrorBoundary>
);
