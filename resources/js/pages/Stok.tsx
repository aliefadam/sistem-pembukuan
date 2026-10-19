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
  useConfirm,
  useToast,
} from "../components/ui";
import { Product, StockConversion, StockIn, StockOpname, StockOut } from "../lib/types";
import { formatCurrency, formatDate, generateId, todayISO } from "../lib/utils";
import { getConvertedBalance, getProductUnits, normalizeUnit } from "../lib/inventory";

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
    unit: "Pcs",
  });

  function openAdd() {
    setEditing(null);
    setForm({
      sku: `SKU-${generateId().slice(0, 6).toUpperCase()}`,
      name: "",
      unit: "Pcs",
    });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      unit: p.unit,
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.sku.trim()) {
      toast("SKU dan nama barang wajib diisi", "warning");
      return;
    }
    const payload = {
      sku: form.sku,
      name: form.name,
      unit: form.unit,
      sellPrice: editing?.sellPrice ?? 0,
      categoryId: editing?.categoryId || "",
      categoryName: editing?.categoryName || "",
      costPrice: editing?.costPrice || 0,
      minStock: editing?.minStock || 0,
      status: "active" as const,
    };
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
          renderCardBadge={(p) => <Badge tone="success">{p.stock} {p.unit}</Badge>}
          columns={[
            { key: "sku", header: "SKU", accessor: (p) => p.sku, sortable: true },
            { key: "name", header: "Nama Barang", accessor: (p) => p.name, sortable: true },
            { key: "unit", header: "Satuan", accessor: (p) => p.unit, hideOnMobile: true },
            { key: "price", header: "Harga", accessor: (p) => p.sellPrice, render: (p) => <span>{formatCurrency(p.sellPrice)} / {p.unit}{Object.values(p.convertedStock ?? {}).filter((balance) => balance.stock > 0).map((balance) => <span key={balance.unit} className="block">{formatCurrency(balance.sellPrice)} / {balance.unit}</span>)}</span> },
            {
              key: "stock",
              header: "Stok",
              accessor: (p) => p.stock,
              sortable: true,
              render: (p) => (
                <Badge tone="success">
                  {p.stock} {p.unit}{Object.values(p.convertedStock ?? {}).filter((balance) => balance.stock > 0).map((balance) => ` / ${balance.stock} ${balance.unit}`).join("")}
                </Badge>
              ),
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
          <Select label="Satuan" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} options={UNITS.map((u) => ({ value: u, label: u }))} />
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
  const [form, setForm] = useState({ productId: "", qty: 1, totalCost: 0, date: todayISO(), note: "" });
  const selectedProduct = products.find((product) => product.id === form.productId);

  function openAdd() {
    setForm({ productId: products[0]?.id || "", qty: 1, totalCost: 0, date: todayISO(), note: "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.productId || !Number.isFinite(form.qty) || form.qty <= 0) {
      toast("Barang dan qty wajib diisi", "warning");
      return;
    }
    if (!Number.isFinite(form.totalCost) || form.totalCost <= 0) {
      toast("Total harga modal wajib diisi dan harus lebih dari nol", "warning");
      return;
    }
    if (!addStockIn(form)) {
      toast("Barang masuk gagal dicatat. Periksa kembali jumlah dan total modal.", "danger");
      return;
    }
    toast("Barang masuk dan pengeluaran berhasil dicatat", "success");
    setModalOpen(false);
  }

  async function handleDelete(item: StockIn) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Barang Masuk", description: `Hapus catatan ${item.no}?`, tone: "danger" });
    if (!ok) return;
    if (!deleteStockIn(item.id)) {
      toast("Barang masuk tidak dapat dihapus karena stoknya sudah dipotong atau digunakan", "warning");
      return;
    }
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
            { key: "cost", header: "Total Modal", accessor: (s) => s.totalCost ?? s.costPrice * s.qty, render: (s) => formatCurrency(s.totalCost ?? s.costPrice * s.qty), hideOnMobile: true },
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
          <Input label={`Qty${selectedProduct ? ` (${selectedProduct.unit.toLowerCase()})` : ""}`} type="number" min={0.001} step="any" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <CurrencyInput label="Total Harga Modal" value={form.totalCost} onChange={(totalCost) => setForm({ ...form, totalCost })} required />
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export function KonversiPage() {
  const { products, stockConversions, addStockConversion, deleteStockConversion, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    fromUnit: "",
    fromQty: 1,
    toUnit: "",
    toQty: 1,
    sellPrice: 0,
    date: todayISO(),
    note: "",
  });
  const selectedProduct = products.find((product) => product.id === form.productId);
  const convertibleProducts = products.filter((product) => getProductUnits(product).some((balance) => balance.stock > 0));
  const sourceUnits = selectedProduct ? getProductUnits(selectedProduct).map((balance) => ({
    value: balance.unit,
    label: `${balance.unit} (${balance.stock} tersedia)`,
  })) : [];

  function openAdd() {
    const product = convertibleProducts[0];
    const initialUnit = product ? getProductUnits(product)[0]?.unit ?? product.unit : "";
    setForm({
      productId: product?.id || "",
      fromUnit: initialUnit,
      fromQty: 1,
      toUnit: "",
      toQty: 1,
      sellPrice: 0,
      date: todayISO(),
      note: "",
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (
      !selectedProduct ||
      !form.fromUnit.trim() ||
      !form.toUnit.trim() ||
      !Number.isFinite(form.fromQty) ||
      !Number.isFinite(form.toQty) ||
      !Number.isFinite(form.sellPrice) ||
      form.fromQty <= 0 ||
      form.toQty <= 0 ||
      form.sellPrice <= 0 ||
      normalizeUnit(form.fromUnit) === normalizeUnit(form.toUnit)
    ) {
      toast("Lengkapi satuan awal, satuan hasil, jumlah, dan harga jual dengan benar", "warning");
      return;
    }
    const source = getProductUnits(selectedProduct).find((balance) => normalizeUnit(balance.unit) === normalizeUnit(form.fromUnit));
    if (!source || form.fromQty > source.stock) {
      toast("Jumlah satuan awal melebihi stok yang tersedia", "warning");
      return;
    }
    if (!addStockConversion(form)) {
      toast("Konversi gagal. Periksa stok, satuan, dan harga jual.", "danger");
      return;
    }
    toast("Konversi stok berhasil dicatat", "success");
    setModalOpen(false);
  }

  async function handleDelete(conversion: StockConversion) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data ini", "danger");
      return;
    }
    const ok = await confirm({
      title: "Hapus Catatan Konversi",
      description: `Hapus konversi ${conversion.no}? Hasil konversi belum boleh terjual atau digunakan pada konversi lain.`,
      tone: "danger",
    });
    if (!ok) return;
    if (!deleteStockConversion(conversion.id)) {
      toast("Konversi tidak dapat dihapus karena stok hasilnya sudah terjual atau digunakan", "warning");
      return;
    }
    toast("Catatan konversi berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd} disabled={convertibleProducts.length === 0}>
          Catat Konversi
        </Button>
      </div>
      <Card>
        <DataTable<StockConversion>
          data={stockConversions}
          keyExtractor={(conversion) => conversion.id}
          searchPlaceholder="Cari konversi..."
          emptyTitle="Belum ada konversi"
          renderCardTitle={(conversion) => conversion.productName}
          renderCardSubtitle={(conversion) => formatDate(conversion.date)}
          renderCardBadge={(conversion) => <Badge tone="info">{conversion.fromQty} {conversion.fromUnit} → {conversion.toQty} {conversion.toUnit}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (conversion) => conversion.no, sortable: true },
            { key: "product", header: "Barang", accessor: (conversion) => conversion.productName, sortable: true },
            { key: "source", header: "Satuan Awal", accessor: (conversion) => `${conversion.fromQty} ${conversion.fromUnit}` },
            { key: "output", header: "Satuan Hasil", accessor: (conversion) => `${conversion.toQty} ${conversion.toUnit}` },
            { key: "price", header: "Harga Jual / Satuan", accessor: (conversion) => conversion.sellPrice, render: (conversion) => formatCurrency(conversion.sellPrice), hideOnMobile: true },
            { key: "date", header: "Tanggal", accessor: (conversion) => conversion.date, sortable: true, render: (conversion) => formatDate(conversion.date) },
          ]}
          actions={(conversion) => <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(conversion)} />}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Konversi"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </>
        }
      >
        {convertibleProducts.length === 0 ? (
          <p className="text-sm text-slate-500">Tambahkan barang dengan stok tersedia terlebih dahulu.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <Select label="Barang" value={form.productId} onChange={(productId) => {
              const product = convertibleProducts.find((item) => item.id === productId);
              const firstUnit = product ? getProductUnits(product)[0]?.unit ?? product.unit : "";
              setForm({ ...form, productId, fromUnit: firstUnit });
            }} options={convertibleProducts.map((product) => ({ value: product.id, label: product.name }))} placeholder="Pilih barang" />
            <Select label="Dari satuan" value={form.fromUnit} onChange={(fromUnit) => setForm({ ...form, fromUnit })} options={sourceUnits} placeholder="Pilih satuan stok" />
            <Input label="Jumlah satuan awal" type="number" min={0.001} step="any" value={form.fromQty} onChange={(e) => setForm({ ...form, fromQty: Number(e.target.value) })} />
            <Select label="Konversi ke satuan" value={form.toUnit} onChange={(toUnit) => setForm({ ...form, toUnit })} options={UNITS.map((unit) => ({ value: unit, label: unit }))} placeholder="Pilih satuan hasil" />
            <Input label="Jumlah hasil konversi" type="number" min={0.001} step="any" value={form.toQty} onChange={(e) => setForm({ ...form, toQty: Number(e.target.value) })} />
            <CurrencyInput label="Harga jual per satuan hasil" value={form.sellPrice} onChange={(sellPrice) => setForm({ ...form, sellPrice })} required />
            <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        )}
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
  const [form, setForm] = useState({ productId: "", qty: 1, unit: "", date: todayISO(), note: "" });
  const selectedProduct = products.find((product) => product.id === form.productId);
  const selectedBalance = selectedProduct ? getConvertedBalance(selectedProduct, form.unit) : null;
  const saleUnits = selectedProduct ? getProductUnits(selectedProduct).map((balance) => ({
    value: balance.unit,
    label: `${balance.unit} (${balance.stock} tersedia)`,
  })) : [];

  function openAdd() {
    const product = products.find((item) => getProductUnits(item).some((balance) => balance.stock > 0));
    const unit = product ? getProductUnits(product)[0]?.unit ?? product.unit : "";
    setForm({ productId: product?.id || "", qty: 1, unit, date: todayISO(), note: "" });
    setModalOpen(true);
  }

  function handleSubmit() {
    const product = products.find((p) => p.id === form.productId);
    if (!product || !form.unit.trim() || !Number.isFinite(form.qty) || form.qty <= 0) {
      toast("Barang, satuan, dan qty wajib diisi dengan benar", "warning");
      return;
    }
    const balance = getConvertedBalance(product, form.unit);
    if (!balance || form.qty > balance.stock) {
      toast("Qty melebihi stok tersedia", "warning");
      return;
    }
    if (!addStockOut(form)) {
      toast("Penjualan gagal dicatat. Periksa stok dan harga jual barang.", "warning");
      return;
    }
    toast("Barang keluar dan pemasukan penjualan berhasil dicatat", "success");
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
          renderCardBadge={(s) => <Badge tone="danger">-{s.qty} {s.unit ?? products.find((p) => p.id === s.productId)?.unit ?? "unit"}</Badge>}
          columns={[
            { key: "no", header: "No", accessor: (s) => s.no, sortable: true },
            { key: "product", header: "Barang", accessor: (s) => s.productName, sortable: true },
            { key: "qty", header: "Qty", accessor: (s) => s.qty, render: (s) => <Badge tone="danger">-{s.qty} {s.unit ?? products.find((p) => p.id === s.productId)?.unit ?? "unit"}{s.unit === "pack" && s.portionQty ? ` (${s.portionQty} potong)` : ""}</Badge> },
            { key: "totalPrice", header: "Penjualan", accessor: (s) => s.totalPrice ?? s.qty * (products.find((p) => p.id === s.productId)?.sellPrice ?? 0), render: (s) => formatCurrency(s.totalPrice ?? s.qty * (products.find((p) => p.id === s.productId)?.sellPrice ?? 0)) },
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
          <Select label="Barang" value={form.productId} onChange={(v) => {
            const product = products.find((item) => item.id === v);
            setForm({ ...form, productId: v, unit: product ? getProductUnits(product)[0]?.unit ?? product.unit : "" });
          }} options={options} placeholder="Pilih barang" />
          <Select label="Satuan Jual" value={form.unit} onChange={(unit) => setForm({ ...form, unit })} options={saleUnits} placeholder="Pilih satuan stok" />
          <Input label={`Qty${selectedBalance ? ` (${selectedBalance.unit})` : ""}`} type="number" min={0.001} step="any" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} hint={selectedBalance ? `Stok tersedia: ${selectedBalance.stock} ${selectedBalance.unit}` : "Tidak ada stok tersedia untuk barang ini."} />
          <Input label="Total Penjualan" disabled value={formatCurrency((selectedBalance?.sellPrice ?? 0) * form.qty)} />
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
          <Input label={`Qty Sistem${selectedProduct ? ` (${selectedProduct.unit})` : ""}`} disabled value={selectedProduct?.stock || 0} />
          <Input label={`Qty Aktual${selectedProduct ? ` (${selectedProduct.unit})` : ""}`} type="number" min={0} step="any" value={form.actualQty} onChange={(e) => setForm({ ...form, actualQty: Number(e.target.value) })} />
          <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Catatan" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
