import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider, useData } from "./context/DataContext";
import { ToastProvider, ConfirmProvider, Spinner } from "./components/ui";
import { MainLayout } from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import { KategoriPage, PemasukanPage, PengeluaranPage } from "./pages/Pembukuan";
import { BarangKeluarPage, BarangMasukPage, BarangPage, StockOpnamePage } from "./pages/Stok";
import { DataKaryawanPage, PayrollPage } from "./pages/Karyawan";
import {
  CashFlowReportPage,
  LaporanPayrollPage,
  LaporanPemasukanPage,
  LaporanPengeluaranPage,
  LaporanStokPage,
  RingkasanLabaPage,
} from "./pages/Laporan";
import { AuditLogPage, BackupPage, PenggunaPage, ProfilUsahaPage, RolePermissionPage } from "./pages/Pengaturan";

function AppRoutes() {
  const { loading } = useData();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/30">
          <i className="fi fi-rr-briefcase" />
        </div>
        <Spinner size={28} className="text-blue-600" />
        <p className="text-sm font-medium text-slate-400">Memuat Pembukuan Usaha...</p>
      </div>
    );
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
        <Route path="/stok/barang-keluar" element={<BarangKeluarPage />} />
        <Route path="/stok/stock-opname" element={<StockOpnamePage />} />
        <Route path="/karyawan/data" element={<DataKaryawanPage />} />
        <Route path="/karyawan/payroll" element={<PayrollPage />} />
        <Route path="/laporan/pemasukan" element={<LaporanPemasukanPage />} />
        <Route path="/laporan/pengeluaran" element={<LaporanPengeluaranPage />} />
        <Route path="/laporan/cash-flow" element={<CashFlowReportPage />} />
        <Route path="/laporan/laba" element={<RingkasanLabaPage />} />
        <Route path="/laporan/stok" element={<LaporanStokPage />} />
        <Route path="/laporan/payroll" element={<LaporanPayrollPage />} />
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

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <DataProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </DataProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
