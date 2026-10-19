import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { DataProvider, useData } from "../context/DataContext";
import { ToastProvider, ConfirmProvider, Spinner } from "../components/ui";
import { MainLayout } from "../layout/Layout";
import Dashboard from "../pages/Dashboard";
import { KategoriPage, PemasukanPage, PengeluaranPage } from "../pages/Pembukuan";
import { BarangKeluarPage, BarangMasukPage, BarangPage, KonversiPage, StockOpnamePage } from "../pages/Stok";
import {
  CashFlowReportPage,
  LaporanPemasukanPage,
  LaporanPengeluaranPage,
  LaporanStokPage,
  RingkasanLabaPage,
} from "../pages/Laporan";
import { AuditLogPage, BackupPage, PenggunaPage, ProfilUsahaPage, RolePermissionPage } from "../pages/Pengaturan";

async function checkConnection(): Promise<boolean> {
  try {
    await fetch("/", {
      method: "HEAD",
      cache: "no-store",
      credentials: "same-origin",
    });
    return true;
  } catch {
    return false;
  }
}

function OfflinePage({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-950">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-11 w-11" fill="none">
          <path d="M8 18h32v22H8zM17 18v-5a7 7 0 0 1 14 0v5" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M8 27h32M22 27v4h4v-4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path d="M3 3l18 18M10.6 5.2a14.7 14.7 0 0 1 10.4 4.2M6.1 8.1a10.7 10.7 0 0 1 3.1-1.8M2.9 12a6.8 6.8 0 0 1 3.5-2M8.5 15.5a3.5 3.5 0 0 1 5 0M12 19h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tidak ada koneksi internet</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        Aplikasi membutuhkan koneksi internet untuk mengambil dan menyimpan data. Periksa jaringan Anda, lalu coba kembali.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </main>
  );
}

function AppSplash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-11 w-11" fill="none">
          <path d="M8 18h32v22H8zM17 18v-5a7 7 0 0 1 14 0v5M8 27h32M22 27v4h4v-4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
      <Spinner size={28} className="text-blue-600" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat Pembukuan Usaha...</p>
    </div>
  );
}

function AppRoutes() {
  const { loading, loadError } = useData();
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    let active = true;
    const handleOffline = () => setOffline(true);
    const handleOnline = () => {
      void checkConnection().then((connected) => {
        if (active) setOffline(!connected);
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (navigator.onLine && loadError) handleOnline();

    return () => {
      active = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadError]);

  if (offline) {
    return (
      <OfflinePage
        onRetry={() => {
          void checkConnection().then((connected) => {
            if (!connected) {
              setOffline(true);
              return;
            }
            window.location.reload();
          });
        }}
      />
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-slate-950">
        <i className="fi fi-rr-database text-4xl text-red-500" />
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Data gagal dimuat</h1>
        <p className="max-w-lg text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (loading) {
    return <AppSplash />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pembukuan/pemasukan" element={<PemasukanPage />} />
        <Route path="/pembukuan/pengeluaran" element={<PengeluaranPage />} />
        <Route path="/pembukuan/kategori" element={<KategoriPage />} />
        <Route path="/stok/barang" element={<BarangPage />} />
        <Route path="/stok/barang-masuk" element={<BarangMasukPage />} />
        <Route path="/stok/konversi" element={<KonversiPage />} />
        <Route path="/stok/pemotongan" element={<Navigate to="/stok/konversi" replace />} />
        <Route path="/stok/barang-keluar" element={<BarangKeluarPage />} />
        <Route path="/stok/stock-opname" element={<StockOpnamePage />} />
        <Route path="/laporan/pemasukan" element={<LaporanPemasukanPage />} />
        <Route path="/laporan/pengeluaran" element={<LaporanPengeluaranPage />} />
        <Route path="/laporan/cash-flow" element={<CashFlowReportPage />} />
        <Route path="/laporan/laba" element={<RingkasanLabaPage />} />
        <Route path="/laporan/stok" element={<LaporanStokPage />} />
        <Route path="/pengaturan/profil" element={<ProfilUsahaPage />} />
        <Route path="/pengaturan/pengguna" element={<PenggunaPage />} />
        <Route path="/pengaturan/role" element={<RolePermissionPage />} />
        <Route path="/pengaturan/backup" element={<BackupPage />} />
        <Route path="/pengaturan/audit-log" element={<AuditLogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default function App({
  auth,
}: {
  auth: { user: { role: "owner" | "admin" } | null };
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <DataProvider initialRole={auth.user?.role ?? "owner"}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DataProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
