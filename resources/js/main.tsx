import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import "./index.css";

void createInertiaApp({
  title: (title) => `${title} - Pembukuan Usaha`,
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
