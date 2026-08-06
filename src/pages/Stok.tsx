import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DataTable,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea,
  Switch,
  useConfirm,
  useToast,
} from "../components/ui";
import { Product, StockIn, StockOpname, StockOut } from "../lib/types";
import { formatCurrency, formatDate, generateId, todayISO } from "../lib/utils";

const UNITS = ["Pcs", "Kg", "Liter", "Box", "Pack", "Unit", "Meter", "Lusin"];

export function BarangPage() {
  const { products, addProduct, updateProduct, deleteProduct, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    categoryName: "",
    unit: "Pcs",
    costPrice: 0,
    sellPrice: 0,
    minStock: 5,
    status: "active" as "active" | "inactive",
  });

  function openAdd() {
    setEditing(null);
    setForm({ sku: `SKU-${generateId().slice(0, 6).toUpperCase()}`, name: "", categoryName: "", unit: "Pcs", costPrice: 0, sellPrice: 0, minStock: 5, status: "active" });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, categoryName: p.categoryName, unit: p.unit, costPrice: p.costPrice, sellPrice: p.sellPrice, minStock: p.minStock, status: p.status });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.sku.trim()) {
      toast("SKU dan nama barang wajib diisi", "warning");
      return;
    }
    const payload = { ...form, categoryId: form.categoryName };
    if (editing) {
      updateProduct(editing.id, payload);
      toast("Barang berhasil diperbarui", "success");
    } else {
      addProduct(payload);
      toast("Barang berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(p: Product) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus barang", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Barang", description: `Yakin ingin menghapus ${p.name}?`, tone: "danger" });
    if (!ok) return;
    deleteProduct(p.id);
    toast("Barang berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Barang
        </Button>
      </div>
      <Card>
        <DataTable<Product>
          data={products}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Cari SKU / nama barang..."
          emptyTitle="Belum ada barang"
          emptyDescription="Tambahkan barang untuk mulai mengelola stok."
          renderCardTitle={(p) => p.name}
          renderCardSubtitle={(p) => p.sku}
          renderCardBadge={(p) => <Badge tone={p.stock <= p.minStock ? "warning" : "success"}>{p.stock} {p.unit}</Badge>}
          columns={[
            { key: "sku", header: "SKU", accessor: (p) => p.sku, sortable: true },
            { key: "name", header: "Nama Barang", accessor: (p) => p.name, sortable: true },
            { key: "unit", header: "Satuan", accessor: (p) => p.unit, hideOnMobile: true },
            { key: "cost", header: "Harga Modal", accessor: (p) => p.costPrice, render: (p) => formatCurrency(p.costPrice) },
            { key: "sell", header: "Harga Jual", accessor: (p) => p.sellPrice, render: (p) => (p.sellPrice ? formatCurrency(p.sellPrice) : "-"), hideOnMobile: true },
            {
              key: "stock",
              header: "Stok",
              accessor: (p) => p.stock,
              sortable: true,
              render: (p) => (
                <Badge tone={p.stock <= p.minStock ? "warning" : "success"}>
                  {p.stock} {p.unit}
                </Badge>
              ),
            },
            {
              key: "status",
              header: "Status",
              accessor: (p) => p.status,
              render: (p) => <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status === "active" ? "Aktif" : "Nonaktif"}</Badge>,
              hideOnMobile: true,
            },
          ]}
          actions={(p) => (
            <>
              <IconButton icon="fi fi-rr-pencil" label="Edit" onClick={() => openEdit(p)} />
              <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(p)} />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Barang" : "Tambah Barang"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label="Nama Barang" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Kategori Barang" value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} placeholder="Contoh: Sembako" />
          <Select label="Satuan" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <CurrencyInput label="Harga Modal" value={form.costPrice} onChange={(v) => setForm({ ...form, costPrice: v })} />
          <CurrencyInput label="Harga Jual (Opsional)" value={form.sellPrice} onChange={(v) => setForm({ ...form, sellPrice: v })} />
          <Input label="Minimum Stok" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          <div className="flex items-end pb-2">
            <Switch checked={form.status === "active"} onChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} label="Barang Aktif" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function useProductOptions() {
  const { products } = useData();
  return products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
}

export function BarangMasukPage() {
  const { stockIn, addStockIn, deleteStockIn, products, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const options = useProductOptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", qty: 1, costPrice: 0, date: todayISO(), note: "" });

  function openAdd() {
    setForm({ productId: products[0]?.id || "", qty: 1, costPrice: products[0]?.costPrice || 0, date: todayISO(), note: "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.productId || form.qty <= 0) {
      toast("Barang dan qty wajib diisi", "warning");
      return;
    }
    addStockIn(form);
    toast("Barang masuk berhasil dicatat", "success");
    setModalOpen(false);
  }

  async function handleDelete(item: StockIn) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Barang Masuk", description: `Hapus catatan ${item.no}?`, tone: "danger" });
    if (!ok) return;
    deleteStockIn(item.id);
    toast("Data berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Barang Masuk
        </Button>
      </div>
      <Card>
        <DataTable<StockIn>
          data={stockIn}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Cari barang masuk..."
          emptyTitle="Belum ada barang masuk"
          renderCardTitle={(s) => s.productName}
          renderCardSubtitle={(s) => formatDate(s.date)}
          renderCardBadge={(s) => <Badge tone="info">+{s.qty}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (s) => s.no, sortable: true },
            { key: "product", header: "Barang", accessor: (s) => s.productName, sortable: true },
            { key: "qty", header: "Qty", accessor: (s) => s.qty, render: (s) => <Badge tone="info">+{s.qty}</Badge> },
            { key: "cost", header: "Harga Modal", accessor: (s) => s.costPrice, render: (s) => formatCurrency(s.costPrice), hideOnMobile: true },
            { key: "date", header: "Tanggal", accessor: (s) => s.date, sortable: true, render: (s) => formatDate(s.date) },
            { key: "note", header: "Catatan", accessor: (s) => s.note || "-", hideOnMobile: true },
          ]}
          actions={(s) => <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(s)} />}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Barang Masuk"
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
          <Select label="Barang" value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} options={options} placeholder="Pilih barang" />
          <Input label="Qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <CurrencyInput label="Harga Modal" value={form.costPrice} onChange={(v) => setForm({ ...form, costPrice: v })} />
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export function BarangKeluarPage() {
  const { stockOut, addStockOut, deleteStockOut, products, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const options = useProductOptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", qty: 1, date: todayISO(), note: "" });

  function openAdd() {
    setForm({ productId: products[0]?.id || "", qty: 1, date: todayISO(), note: "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    const product = products.find((p) => p.id === form.productId);
    if (!form.productId || form.qty <= 0) {
      toast("Barang dan qty wajib diisi", "warning");
      return;
    }
    if (product && form.qty > product.stock) {
      toast("Qty melebihi stok tersedia", "warning");
      return;
    }
    addStockOut(form);
    toast("Barang keluar berhasil dicatat", "success");
    setModalOpen(false);
  }

  async function handleDelete(item: StockOut) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Barang Keluar", description: `Hapus catatan ${item.no}?`, tone: "danger" });
    if (!ok) return;
    deleteStockOut(item.id);
    toast("Data berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Barang Keluar
        </Button>
      </div>
      <Card>
        <DataTable<StockOut>
          data={stockOut}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Cari barang keluar..."
          emptyTitle="Belum ada barang keluar"
          renderCardTitle={(s) => s.productName}
          renderCardSubtitle={(s) => formatDate(s.date)}
          renderCardBadge={(s) => <Badge tone="danger">-{s.qty}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (s) => s.no, sortable: true },
            { key: "product", header: "Barang", accessor: (s) => s.productName, sortable: true },
            { key: "qty", header: "Qty", accessor: (s) => s.qty, render: (s) => <Badge tone="danger">-{s.qty}</Badge> },
            { key: "date", header: "Tanggal", accessor: (s) => s.date, sortable: true, render: (s) => formatDate(s.date) },
            { key: "note", header: "Catatan", accessor: (s) => s.note || "-", hideOnMobile: true },
          ]}
          actions={(s) => <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(s)} />}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Barang Keluar"
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
          <Select label="Barang" value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} options={options} placeholder="Pilih barang" />
          <Input label="Qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export function StockOpnamePage() {
  const { stockOpname, addStockOpname, deleteStockOpname, products, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const options = useProductOptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", actualQty: 0, date: todayISO(), note: "" });

  const selectedProduct = useMemo(() => products.find((p) => p.id === form.productId), [products, form.productId]);

  function openAdd() {
    setForm({ productId: products[0]?.id || "", actualQty: products[0]?.stock || 0, date: todayISO(), note: "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.productId) {
      toast("Barang wajib dipilih", "warning");
      return;
    }
    addStockOpname(form);
    toast("Stock opname berhasil dicatat", "success");
    setModalOpen(false);
  }

  async function handleDelete(item: StockOpname) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Stock Opname", description: `Hapus catatan ${item.no}?`, tone: "danger" });
    if (!ok) return;
    deleteStockOpname(item.id);
    toast("Data berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Stock Opname
        </Button>
      </div>
      <Card>
        <DataTable<StockOpname>
          data={stockOpname}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Cari stock opname..."
          emptyTitle="Belum ada data stock opname"
          renderCardTitle={(s) => s.productName}
          renderCardSubtitle={(s) => formatDate(s.date)}
          renderCardBadge={(s) => <Badge tone={s.diff === 0 ? "success" : s.diff > 0 ? "info" : "danger"}>{s.diff > 0 ? `+${s.diff}` : s.diff}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (s) => s.no, sortable: true },
            { key: "product", header: "Barang", accessor: (s) => s.productName, sortable: true },
            { key: "systemQty", header: "Qty Sistem", accessor: (s) => s.systemQty },
            { key: "actualQty", header: "Qty Aktual", accessor: (s) => s.actualQty },
            {
              key: "diff",
              header: "Selisih",
              accessor: (s) => s.diff,
              render: (s) => <Badge tone={s.diff === 0 ? "success" : s.diff > 0 ? "info" : "danger"}>{s.diff > 0 ? `+${s.diff}` : s.diff}</Badge>,
            },
            { key: "date", header: "Tanggal", accessor: (s) => s.date, sortable: true, render: (s) => formatDate(s.date), hideOnMobile: true },
          ]}
          actions={(s) => <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(s)} />}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Stock Opname"
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
          <Select label="Barang" value={form.productId} onChange={(v) => setForm({ ...form, productId: v, actualQty: products.find((p) => p.id === v)?.stock || 0 })} options={options} placeholder="Pilih barang" />
          <Input label="Qty Sistem" disabled value={selectedProduct?.stock || 0} />
          <Input label="Qty Aktual" type="number" value={form.actualQty} onChange={(e) => setForm({ ...form, actualQty: Number(e.target.value) })} />
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
