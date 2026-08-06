import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "../context/DataContext";
import { Badge, Card, EmptyState, StatisticCard } from "../components/ui";
import { formatCurrency, formatDate, isInMonth, monthKey, todayISO } from "../lib/utils";

const PIE_COLORS = ["#2563eb", "#059669", "#f59e0b", "#dc2626", "#0284c7", "#7c3aed", "#db2777", "#65a30d"];

export default function Dashboard() {
  const { income, expense, products } = useData();
  const today = todayISO();
  const curMonth = monthKey();

  const incomeToday = income.filter((t) => t.date === today).reduce((s, t) => s + t.amount, 0);
  const expenseToday = expense.filter((t) => t.date === today).reduce((s, t) => s + t.amount, 0);
  const incomeMonth = income.filter((t) => isInMonth(t.date, curMonth)).reduce((s, t) => s + t.amount, 0);
  const expenseMonth = expense.filter((t) => isInMonth(t.date, curMonth)).reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);
  const saldo = totalIncome - totalExpense;
  const estimasiLaba = incomeMonth - expenseMonth;
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const cashFlowData = useMemo(() => {
    const days: { date: string; label: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d);
      const pemasukan = income.filter((t) => t.date === iso).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = expense.filter((t) => t.date === iso).reduce((s, t) => s + t.amount, 0);
      days.push({ date: iso, label, pemasukan, pengeluaran });
    }
    return days;
  }, [income, expense]);

  const monthlyCompare = useMemo(() => {
    const months: { key: string; label: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
      const pemasukan = income.filter((t) => isInMonth(t.date, key)).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = expense.filter((t) => isInMonth(t.date, key)).reduce((s, t) => s + t.amount, 0);
      months.push({ key, label, pemasukan, pengeluaran });
    }
    return months;
  }, [income, expense]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    expense.forEach((t) => {
      map.set(t.categoryName, (map.get(t.categoryName) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expense]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currencyFormatter = (v: any): string => formatCurrency(Number(v ?? 0));

  const recentTransactions = useMemo(() => {
    return [...income.map((t) => ({ ...t })), ...expense.map((t) => ({ ...t }))]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [income, expense]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Saldo Saat Ini" value={formatCurrency(saldo)} icon="fi fi-rr-wallet" tone="primary" />
        <StatisticCard label="Pemasukan Hari Ini" value={formatCurrency(incomeToday)} icon="fi fi-rr-arrow-small-down" tone="success" />
        <StatisticCard label="Pengeluaran Hari Ini" value={formatCurrency(expenseToday)} icon="fi fi-rr-arrow-small-up" tone="danger" />
        <StatisticCard label="Estimasi Laba Bulan Ini" value={formatCurrency(estimasiLaba)} icon="fi fi-rr-sack-dollar" tone="warning" />
        <StatisticCard label="Pemasukan Bulan Ini" value={formatCurrency(incomeMonth)} icon="fi fi-rr-chart-line-up" tone="success" />
        <StatisticCard label="Pengeluaran Bulan Ini" value={formatCurrency(expenseMonth)} icon="fi fi-rr-arrow-trend-down" tone="danger" />
        <StatisticCard label="Total Barang" value={String(products.length)} icon="fi fi-rr-box" tone="info" />
        <StatisticCard label="Barang Hampir Habis" value={String(lowStockProducts.length)} icon="fi fi-rr-exclamation" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Cash Flow</h3>
              <p className="text-xs text-slate-400">14 hari terakhir</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <RTooltip formatter={currencyFormatter} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Legend />
              <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#059669" fill="url(#colorIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#dc2626" fill="url(#colorOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-1 font-bold text-slate-800 dark:text-slate-100">Pengeluaran per Kategori</h3>
          <p className="mb-4 text-xs text-slate-400">Distribusi total pengeluaran</p>
          {expenseByCategory.length === 0 ? (
            <EmptyState title="Belum ada pengeluaran" description="Grafik akan muncul setelah ada transaksi." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip formatter={currencyFormatter} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {expenseByCategory.slice(0, 4).map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Pemasukan vs Pengeluaran</h3>
          <p className="text-xs text-slate-400">Perbandingan 6 bulan terakhir</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyCompare}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <RTooltip formatter={currencyFormatter} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            <Legend />
            <Bar dataKey="pemasukan" name="Pemasukan" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Transaksi Terbaru</h3>
          {recentTransactions.length === 0 ? (
            <EmptyState title="Belum ada transaksi" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        t.type === "income" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-50 text-red-600 dark:bg-red-500/10"
                      }`}
                    >
                      <i className={t.type === "income" ? "fi fi-rr-arrow-small-down" : "fi fi-rr-arrow-small-up"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.categoryName}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Barang Hampir Habis</h3>
          {lowStockProducts.length === 0 ? (
            <EmptyState icon="fi fi-rr-check-circle" title="Stok aman" description="Tidak ada barang yang perlu diisi ulang." />
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.name}</p>
                    <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <Badge tone="warning">
                    {p.stock} / {p.minStock} {p.unit}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
