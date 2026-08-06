import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useToast } from "../components/ui";
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DataTable,
  Input,
  Modal,
  Select,
  Textarea,
  useConfirm,
  IconButton,
  EmptyState,
  SearchBox,
} from "../components/ui";
import { Category, Transaction, TransactionType } from "../lib/types";
import { exportToExcel, exportToPDF } from "../lib/exporters";
import { formatCurrency, formatDate, todayISO } from "../lib/utils";

function TransactionPage({ type }: { type: TransactionType }) {
  const {
    income,
    expense,
    categories,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    currentRole,
  } = useData();
  const toast = useToast();
  const confirm = useConfirm();

  const list = type === "income" ? income : expense;
  const cats = categories.filter((c) => c.type === type);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ date: todayISO(), categoryId: "", amount: 0, description: "" });
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const filtered = useMemo(() => {
    return list.filter((t) => {
      if (filterCategory && t.categoryId !== filterCategory) return false;
      if (filterStart && t.date < filterStart) return false;
      if (filterEnd && t.date > filterEnd) return false;
      return true;
    });
  }, [list, filterCategory, filterStart, filterEnd]);

  function openAdd() {
    setEditing(null);
    setForm({ date: todayISO(), categoryId: cats[0]?.id || "", amount: 0, description: "" });
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({ date: t.date, categoryId: t.categoryId, amount: t.amount, description: t.description });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.categoryId || !form.amount) {
      toast("Kategori dan nominal wajib diisi", "warning");
      return;
    }
    const category = categories.find((c) => c.id === form.categoryId);
    const payload = {
      date: form.date,
      categoryId: form.categoryId,
      categoryName: category?.name || "-",
      amount: form.amount,
      description: form.description,
    };
    if (editing) {
      (type === "income" ? updateIncome : updateExpense)(editing.id, payload);
      toast("Transaksi berhasil diperbarui", "success");
    } else {
      (type === "income" ? addIncome : addExpense)(payload);
      toast("Transaksi berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(t: Transaction) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({
      title: "Hapus Transaksi",
      description: `Yakin ingin menghapus transaksi ${t.no}?`,
      tone: "danger",
    });
    if (!ok) return;
    (type === "income" ? deleteIncome : deleteExpense)(t.id);
    toast("Transaksi berhasil dihapus", "success");
  }

  function handleExportPDF() {
    exportToPDF(
      type === "income" ? "Laporan Pemasukan" : "Laporan Pengeluaran",
      ["No Transaksi", "Tanggal", "Kategori", "Nominal", "Deskripsi"],
      filtered.map((t) => [t.no, formatDate(t.date), t.categoryName, formatCurrency(t.amount), t.description]),
      type === "income" ? "laporan-pemasukan" : "laporan-pengeluaran",
    );
    toast("Berhasil export PDF", "success");
  }

  function handleExportExcel() {
    exportToExcel(
      type === "income" ? "Pemasukan" : "Pengeluaran",
      ["No Transaksi", "Tanggal", "Kategori", "Nominal", "Deskripsi"],
      filtered.map((t) => [t.no, formatDate(t.date), t.categoryName, t.amount, t.description]),
      type === "income" ? "pemasukan" : "pengeluaran",
    );
    toast("Berhasil export Excel", "success");
  }

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Card className="w-full sm:w-auto" noPadding>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              <i className={type === "income" ? "fi fi-rr-arrow-small-down" : "fi fi-rr-arrow-small-up"} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total {type === "income" ? "Pemasukan" : "Pengeluaran"} (Filter)</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(total)}</p>
            </div>
          </div>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon="fi fi-rr-file-pdf" onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outline" icon="fi fi-rr-file-spreadsheet" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button icon="fi fi-rr-plus" onClick={openAdd}>
            Tambah {type === "income" ? "Pemasukan" : "Pengeluaran"}
          </Button>
        </div>
      </div>

      <Card>
        <DataTable<Transaction>
          data={filtered}
          keyExtractor={(t) => t.id}
          searchPlaceholder="Cari no transaksi / deskripsi..."
          emptyTitle={`Belum ada data ${type === "income" ? "pemasukan" : "pengeluaran"}`}
          emptyDescription="Klik tombol tambah untuk mencatat transaksi baru."
          renderCardTitle={(t) => t.no}
          renderCardSubtitle={(t) => formatDate(t.date)}
          renderCardBadge={(t) => <Badge tone={type === "income" ? "success" : "danger"}>{t.categoryName}</Badge>}
          filters={
            <div className="flex flex-wrap gap-2">
              <div className="w-40">
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  placeholder="Semua Kategori"
                  options={[{ value: "", label: "Semua Kategori" }, ...cats.map((c) => ({ value: c.id, label: c.name }))]}
                />
              </div>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
              />
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
              />
            </div>
          }
          columns={[
            { key: "no", header: "No Transaksi", accessor: (t) => t.no, sortable: true },
            { key: "date", header: "Tanggal", accessor: (t) => t.date, sortable: true, render: (t) => formatDate(t.date) },
            { key: "category", header: "Kategori", accessor: (t) => t.categoryName, render: (t) => <Badge tone={type === "income" ? "success" : "danger"}>{t.categoryName}</Badge> },
            { key: "amount", header: "Nominal", accessor: (t) => t.amount, sortable: true, render: (t) => <span className="font-semibold">{formatCurrency(t.amount)}</span> },
            { key: "description", header: "Deskripsi", accessor: (t) => t.description, hideOnMobile: true },
          ]}
          actions={(t) => (
            <>
              <IconButton icon="fi fi-rr-eye" label="Detail" onClick={() => setDetail(t)} />
              <IconButton icon="fi fi-rr-pencil" label="Edit" onClick={() => openEdit(t)} />
              <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(t)} />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Transaksi" : `Tambah ${type === "income" ? "Pemasukan" : "Pengeluaran"}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            label="Kategori"
            value={form.categoryId}
            onChange={(v) => setForm({ ...form, categoryId: v })}
            options={cats.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Pilih kategori"
          />
          <CurrencyInput label="Nominal" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          <Textarea label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Catatan tambahan (opsional)" />
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Transaksi">
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <Row label="No Transaksi" value={detail.no} />
            <Row label="Tanggal" value={formatDate(detail.date)} />
            <Row label="Kategori" value={detail.categoryName} />
            <Row label="Nominal" value={formatCurrency(detail.amount)} />
            <Row label="Deskripsi" value={detail.description || "-"} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2.5 dark:border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}

export function PemasukanPage() {
  return <TransactionPage type="income" />;
}

export function PengeluaranPage() {
  return <TransactionPage type="expense" />;
}

export function KategoriPage() {
  const { categories, addCategory, updateCategory, deleteCategory, income, expense, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<TransactionType>("income");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");

  const filtered = categories.filter((c) => c.type === tab && c.name.toLowerCase().includes(search.toLowerCase()));

  function usageCount(catId: string) {
    return [...income, ...expense].filter((t) => t.categoryId === catId).length;
  }

  function openAdd() {
    setEditing(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast("Nama kategori wajib diisi", "warning");
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name });
      toast("Kategori berhasil diperbarui", "success");
    } else {
      addCategory({ type: tab, name });
      toast("Kategori berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(c: Category) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus kategori", "danger");
      return;
    }
    if (usageCount(c.id) > 0) {
      toast("Kategori sedang digunakan pada transaksi", "warning");
      return;
    }
    const ok = await confirm({ title: "Hapus Kategori", description: `Yakin ingin menghapus kategori ${c.name}?`, tone: "danger" });
    if (!ok) return;
    deleteCategory(c.id);
    toast("Kategori berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
          <button
            onClick={() => setTab("income")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${tab === "income" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}
          >
            Kategori Pemasukan
          </button>
          <button
            onClick={() => setTab("expense")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${tab === "expense" ? "bg-white text-red-500 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}
          >
            Kategori Pengeluaran
          </button>
        </div>
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Cari kategori..." />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="Belum ada kategori" description="Tambahkan kategori untuk mulai mencatat transaksi." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-4 transition-all duration-200 hover:shadow-md dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tab === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    <i className="fi fi-rr-apps" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.name}</p>
                    <p className="text-xs text-slate-400">{usageCount(c.id)} transaksi</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <IconButton icon="fi fi-rr-pencil" label="Edit" onClick={() => openEdit(c)} />
                  <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(c)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Kategori" : "Tambah Kategori"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </>
        }
      >
        <Input label="Nama Kategori" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Penjualan" />
      </Modal>
    </div>
  );
}
