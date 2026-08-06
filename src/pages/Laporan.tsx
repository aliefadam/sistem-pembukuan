import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "../context/DataContext";
import { Badge, Button, Card, DataTable, EmptyState, Select, StatisticCard, Tabs } from "../components/ui";
import { useToast } from "../components/ui";
import { exportToExcel, exportToPDF } from "../lib/exporters";
import { formatCurrency, formatDate, isInMonth, isInYear, monthKey, monthLabel, todayISO } from "../lib/utils";
import { Transaction } from "../lib/types";

type Period = "harian" | "bulanan" | "tahunan";

function useReportData(list: Transaction[], period: Period) {
  const today = todayISO();
  const curMonth = monthKey();
  const curYear = String(new Date().getFullYear());

  return useMemo(() => {
    if (period === "harian") return list.filter((t) => t.date === today);
    if (period === "bulanan") return list.filter((t) => isInMonth(t.date, curMonth));
    return list.filter((t) => isInYear(t.date, curYear));
  }, [list, period, today, curMonth, curYear]);
}

function TransactionReport({ type }: { type: "income" | "expense" }) {
  const { income, expense } = useData();
  const toast = useToast();
  const list = type === "income" ? income : expense;
  const [period, setPeriod] = useState<Period>("bulanan");
  const filtered = useReportData(list, period);
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  function handleExportPDF() {
    exportToPDF(
      `Laporan ${type === "income" ? "Pemasukan" : "Pengeluaran"} - ${period}`,
      ["No", "Tanggal", "Kategori", "Nominal", "Deskripsi"],
      filtered.map((t) => [t.no, formatDate(t.date), t.categoryName, formatCurrency(t.amount), t.description]),
      `laporan-${type}-${period}`,
    );
    toast("Berhasil export PDF", "success");
  }

  function handleExportExcel() {
    exportToExcel(
      type === "income" ? "Pemasukan" : "Pengeluaran",
      ["No", "Tanggal", "Kategori", "Nominal", "Deskripsi"],
      filtered.map((t) => [t.no, formatDate(t.date), t.categoryName, t.amount, t.description]),
      `laporan-${type}-${period}`,
    );
    toast("Berhasil export Excel", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Tabs
          active={period}
          onChange={(k) => setPeriod(k as Period)}
          tabs={[
            { key: "harian", label: "Harian" },
            { key: "bulanan", label: "Bulanan" },
            { key: "tahunan", label: "Tahunan" },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" icon="fi fi-rr-file-pdf" onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="outline" icon="fi fi-rr-file-spreadsheet" onClick={handleExportExcel}>
            Excel
          </Button>
        </div>
      </div>
      <StatisticCard
        label={`Total ${type === "income" ? "Pemasukan" : "Pengeluaran"} (${period})`}
        value={formatCurrency(total)}
        icon={type === "income" ? "fi fi-rr-arrow-small-down" : "fi fi-rr-arrow-small-up"}
        tone={type === "income" ? "success" : "danger"}
      />
      <Card>
        <DataTable<Transaction>
          data={filtered}
          keyExtractor={(t) => t.id}
          searchPlaceholder="Cari transaksi..."
          emptyTitle="Tidak ada data pada periode ini"
          renderCardTitle={(t) => t.no}
          renderCardSubtitle={(t) => formatDate(t.date)}
          renderCardBadge={(t) => <Badge tone={type === "income" ? "success" : "danger"}>{t.categoryName}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (t) => t.no, sortable: true },
            { key: "date", header: "Tanggal", accessor: (t) => t.date, sortable: true, render: (t) => formatDate(t.date) },
            { key: "category", header: "Kategori", accessor: (t) => t.categoryName },
            { key: "amount", header: "Nominal", accessor: (t) => t.amount, sortable: true, render: (t) => formatCurrency(t.amount) },
          ]}
        />
      </Card>
    </div>
  );
}

export function LaporanPemasukanPage() {
  return <TransactionReport type="income" />;
}

export function LaporanPengeluaranPage() {
  return <TransactionReport type="expense" />;
}

export function CashFlowReportPage() {
  const { income, expense } = useData();
  const data = useMemo(() => {
    const months: { key: string; label: string; pemasukan: number; pengeluaran: number; saldo: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      const label = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(d);
      const pemasukan = income.filter((t) => isInMonth(t.date, key)).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = expense.filter((t) => isInMonth(t.date, key)).reduce((s, t) => s + t.amount, 0);
      months.push({ key, label, pemasukan, pengeluaran, saldo: pemasukan - pengeluaran });
    }
    return months;
  }, [income, expense]);

  const totalIn = income.reduce((s, t) => s + t.amount, 0);
  const totalOut = expense.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatisticCard label="Total Pemasukan" value={formatCurrency(totalIn)} icon="fi fi-rr-arrow-small-down" tone="success" />
        <StatisticCard label="Total Pengeluaran" value={formatCurrency(totalOut)} icon="fi fi-rr-arrow-small-up" tone="danger" />
        <StatisticCard label="Saldo Bersih" value={formatCurrency(totalIn - totalOut)} icon="fi fi-rr-wallet" tone="primary" />
      </div>
      <Card>
        <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Grafik Cash Flow 12 Bulan</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RTooltip formatter={(v: any) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "none" }} />
            <Legend />
            <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#2563eb" fill="url(#cfIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#dc2626" fill="url(#cfOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export function RingkasanLabaPage() {
  const { income, expense } = useData();
  const [period, setPeriod] = useState<Period>("bulanan");
  const filteredIncome = useReportData(income, period);
  const filteredExpense = useReportData(expense, period);
  const totalIn = filteredIncome.reduce((s, t) => s + t.amount, 0);
  const totalOut = filteredExpense.reduce((s, t) => s + t.amount, 0);
  const laba = totalIn - totalOut;
  const margin = totalIn > 0 ? ((laba / totalIn) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        active={period}
        onChange={(k) => setPeriod(k as Period)}
        tabs={[
          { key: "harian", label: "Harian" },
          { key: "bulanan", label: "Bulanan" },
          { key: "tahunan", label: "Tahunan" },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatisticCard label="Total Pemasukan" value={formatCurrency(totalIn)} icon="fi fi-rr-arrow-small-down" tone="success" />
        <StatisticCard label="Total Pengeluaran" value={formatCurrency(totalOut)} icon="fi fi-rr-arrow-small-up" tone="danger" />
        <StatisticCard label="Estimasi Laba" value={formatCurrency(laba)} icon="fi fi-rr-sack-dollar" tone={laba >= 0 ? "primary" : "danger"} />
      </div>
      <Card>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm font-medium text-slate-400">Estimasi Laba = Total Pemasukan - Total Pengeluaran</p>
          <p className={`text-3xl font-bold ${laba >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatCurrency(laba)}</p>
          <Badge tone={laba >= 0 ? "success" : "danger"}>Margin Laba {margin}%</Badge>
        </div>
      </Card>
    </div>
  );
}

export function LaporanStokPage() {
  const { stockIn, stockOut, products } = useData();
  const [tab, setTab] = useState<"masuk" | "keluar" | "habis">("masuk");
  const toast = useToast();
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  function handleExport(type: "masuk" | "keluar" | "habis") {
    if (type === "masuk") {
      exportToExcel("Barang Masuk", ["No", "Barang", "Qty", "Tanggal"], stockIn.map((s) => [s.no, s.productName, s.qty, formatDate(s.date)]), "laporan-barang-masuk");
    } else if (type === "keluar") {
      exportToExcel("Barang Keluar", ["No", "Barang", "Qty", "Tanggal"], stockOut.map((s) => [s.no, s.productName, s.qty, formatDate(s.date)]), "laporan-barang-keluar");
    } else {
      exportToExcel("Barang Hampir Habis", ["SKU", "Nama", "Stok", "Minimum"], lowStock.map((p) => [p.sku, p.name, p.stock, p.minStock]), "laporan-barang-hampir-habis");
    }
    toast("Berhasil export Excel", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Tabs
          active={tab}
          onChange={(k) => setTab(k as typeof tab)}
          tabs={[
            { key: "masuk", label: "Barang Masuk" },
            { key: "keluar", label: "Barang Keluar" },
            { key: "habis", label: "Hampir Habis" },
          ]}
        />
        <Button variant="outline" icon="fi fi-rr-file-spreadsheet" onClick={() => handleExport(tab)}>
          Export Excel
        </Button>
      </div>
      <Card>
        {tab === "masuk" &&
          (stockIn.length === 0 ? (
            <EmptyState title="Belum ada barang masuk" />
          ) : (
            <DataTable
              data={stockIn}
              keyExtractor={(s) => s.id}
              searchPlaceholder="Cari barang masuk..."
              renderCardTitle={(s) => s.productName}
              renderCardSubtitle={(s) => formatDate(s.date)}
              columns={[
                { key: "no", header: "No", accessor: (s) => s.no },
                { key: "product", header: "Barang", accessor: (s) => s.productName },
                { key: "qty", header: "Qty", accessor: (s) => s.qty },
                { key: "date", header: "Tanggal", accessor: (s) => s.date, render: (s) => formatDate(s.date) },
              ]}
            />
          ))}
        {tab === "keluar" &&
          (stockOut.length === 0 ? (
            <EmptyState title="Belum ada barang keluar" />
          ) : (
            <DataTable
              data={stockOut}
              keyExtractor={(s) => s.id}
              searchPlaceholder="Cari barang keluar..."
              renderCardTitle={(s) => s.productName}
              renderCardSubtitle={(s) => formatDate(s.date)}
              columns={[
                { key: "no", header: "No", accessor: (s) => s.no },
                { key: "product", header: "Barang", accessor: (s) => s.productName },
                { key: "qty", header: "Qty", accessor: (s) => s.qty },
                { key: "date", header: "Tanggal", accessor: (s) => s.date, render: (s) => formatDate(s.date) },
              ]}
            />
          ))}
        {tab === "habis" &&
          (lowStock.length === 0 ? (
            <EmptyState icon="fi fi-rr-check-circle" title="Stok aman" description="Tidak ada barang di bawah minimum stok." />
          ) : (
            <DataTable
              data={lowStock}
              keyExtractor={(p) => p.id}
              searchPlaceholder="Cari barang..."
              renderCardTitle={(p) => p.name}
              renderCardSubtitle={(p) => p.sku}
              renderCardBadge={(p) => <Badge tone="warning">{p.stock} / {p.minStock}</Badge>}
              columns={[
                { key: "sku", header: "SKU", accessor: (p) => p.sku },
                { key: "name", header: "Nama", accessor: (p) => p.name },
                { key: "stock", header: "Stok", accessor: (p) => p.stock },
                { key: "min", header: "Minimum", accessor: (p) => p.minStock },
              ]}
            />
          ))}
      </Card>
    </div>
  );
}

export function LaporanPayrollPage() {
  const { payroll } = useData();
  const [month, setMonth] = useState("");
  const toast = useToast();
  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(payroll.map((p) => p.month)));
    return months.sort().reverse().map((m) => ({ value: m, label: monthLabel(m) }));
  }, [payroll]);
  const filtered = month ? payroll.filter((p) => p.month === month) : payroll;
  const totalGaji = filtered.reduce((s, p) => s + p.total, 0);
  const totalBonus = filtered.reduce((s, p) => s + p.bonus, 0);
  const totalPotongan = filtered.reduce((s, p) => s + p.deduction, 0);

  function handleExport() {
    exportToPDF(
      "Laporan Payroll",
      ["Karyawan", "Bulan", "Gaji Pokok", "Bonus", "Potongan", "Total"],
      filtered.map((p) => [p.employeeName, monthLabel(p.month), formatCurrency(p.baseSalary), formatCurrency(p.bonus), formatCurrency(p.deduction), formatCurrency(p.total)]),
      "laporan-payroll",
    );
    toast("Berhasil export PDF", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-56">
          <Select value={month} onChange={setMonth} options={[{ value: "", label: "Semua Bulan" }, ...monthOptions]} placeholder="Filter Bulan" />
        </div>
        <Button variant="outline" icon="fi fi-rr-file-pdf" onClick={handleExport}>
          Export PDF
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatisticCard label="Total Gaji" value={formatCurrency(totalGaji)} icon="fi fi-rr-wallet" tone="primary" />
        <StatisticCard label="Total Bonus" value={formatCurrency(totalBonus)} icon="fi fi-rr-gift" tone="success" />
        <StatisticCard label="Total Potongan" value={formatCurrency(totalPotongan)} icon="fi fi-rr-minus-circle" tone="danger" />
      </div>
      <Card>
        <DataTable
          data={filtered}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Cari karyawan..."
          emptyTitle="Belum ada data payroll"
          renderCardTitle={(p) => p.employeeName}
          renderCardSubtitle={(p) => monthLabel(p.month)}
          renderCardBadge={(p) => <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status === "paid" ? "Lunas" : "Belum Lunas"}</Badge>}
          columns={[
            { key: "employee", header: "Karyawan", accessor: (p) => p.employeeName },
            { key: "month", header: "Bulan", accessor: (p) => p.month, render: (p) => monthLabel(p.month) },
            { key: "total", header: "Total Gaji", accessor: (p) => p.total, render: (p) => formatCurrency(p.total) },
            { key: "status", header: "Status", accessor: (p) => p.status, render: (p) => <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status === "paid" ? "Lunas" : "Belum Lunas"}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
