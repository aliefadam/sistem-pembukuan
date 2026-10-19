import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import "./index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
    console.error("Service worker gagal didaftarkan:", error);
  });
}

void createInertiaApp({
  title: (title) => `Kelola Stok`,
  resolve: async (name) => {
    if (name === "App") {
      return (await import("./pages/App")).default;
    }

    if (name === "Auth/Login") {
      return (await import("./pages/Auth/Login")).default;
    }

    throw new Error(`Halaman Inertia tidak ditemukan: ${name}`);
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
