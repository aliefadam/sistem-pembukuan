import { useRef, useState } from "react";
import { useData } from "../context/DataContext";
import {
  Badge,
  Button,
  Card,
  DataTable,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea,
  useConfirm,
  useToast,
} from "../components/ui";
import { AppUser } from "../lib/types";
import { exportAllData, restoreAllData } from "../lib/storage";
import { formatDate, downloadFile } from "../lib/utils";

export function ProfilUsahaPage() {
  const { settings, updateSettings } = useData();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logo: reader.result as string });
    reader.readAsDataURL(file);
  }

  function handleSave() {
    updateSettings(form);
    toast("Profil usaha berhasil disimpan", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 transition-all duration-200 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
          >
            {form.logo ? <img src={form.logo} alt="logo" className="h-full w-full object-cover" /> : <i className="fi fi-rr-building text-3xl" />}
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">Logo Usaha</p>
            <p className="text-sm text-slate-400">Klik gambar untuk mengunggah logo baru (PNG/JPG)</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button size="sm" variant="outline" className="mt-2" icon="fi fi-rr-upload" onClick={() => fileRef.current?.click()}>
              Unggah Logo
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nama Usaha" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <Input label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="sm:col-span-2">
            <Textarea label="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon="fi fi-rr-disk" onClick={handleSave}>
            Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function PenggunaPage() {
  const { users, addUser, updateUser, deleteUser, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "admin" as "owner" | "admin", status: "active" as "active" | "inactive" });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", email: "", role: "admin", status: "active" });
    setModalOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Nama dan email wajib diisi", "warning");
      return;
    }
    if (editing) {
      updateUser(editing.id, form);
      toast("Pengguna berhasil diperbarui", "success");
    } else {
      addUser(form);
      toast("Pengguna berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(u: AppUser) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus pengguna", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Pengguna", description: `Yakin ingin menghapus ${u.name}?`, tone: "danger" });
    if (!ok) return;
    deleteUser(u.id);
    toast("Pengguna berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Pengguna
        </Button>
      </div>
      <Card>
        <DataTable<AppUser>
          data={users}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Cari pengguna..."
          emptyTitle="Belum ada pengguna"
          renderCardTitle={(u) => u.name}
          renderCardSubtitle={(u) => u.email}
          renderCardBadge={(u) => <Badge tone={u.role === "owner" ? "primary" : "info"}>{u.role === "owner" ? "Owner" : "Admin"}</Badge>}
          columns={[
            { key: "name", header: "Nama", accessor: (u) => u.name, sortable: true },
            { key: "email", header: "Email", accessor: (u) => u.email },
            { key: "role", header: "Role", accessor: (u) => u.role, render: (u) => <Badge tone={u.role === "owner" ? "primary" : "info"}>{u.role === "owner" ? "Owner" : "Admin"}</Badge> },
            { key: "status", header: "Status", accessor: (u) => u.status, render: (u) => <Badge tone={u.status === "active" ? "success" : "neutral"}>{u.status === "active" ? "Aktif" : "Nonaktif"}</Badge>, hideOnMobile: true },
          ]}
          actions={(u) => (
            <>
              <IconButton icon="fi fi-rr-pencil" label="Edit" onClick={() => openEdit(u)} />
              <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(u)} />
            </>
          )}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Pengguna" : "Tambah Pengguna"}
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
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select
            label="Role"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as "owner" | "admin" })}
            options={[
              { value: "owner", label: "Owner" },
              { value: "admin", label: "Admin" },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export function RolePermissionPage() {
  const permissions = [
    { module: "Pembukuan (Pemasukan/Pengeluaran)", owner: true, admin: "Tidak dapat menghapus" },
    { module: "Kategori", owner: true, admin: "Tidak dapat menghapus" },
    { module: "Stok & Barang", owner: true, admin: "Tidak dapat menghapus" },
    { module: "Karyawan & Payroll", owner: true, admin: "Tidak dapat menghapus" },
    { module: "Laporan", owner: true, admin: "Akses penuh" },
    { module: "Pengaturan Pengguna", owner: true, admin: "Tidak dapat menghapus" },
    { module: "Backup & Restore", owner: true, admin: "Akses penuh" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
              <i className="fi fi-rr-crown" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Owner</p>
              <p className="text-xs text-slate-400">Akses penuh ke seluruh fitur aplikasi</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10">
              <i className="fi fi-rr-user-gear" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Admin</p>
              <p className="text-xs text-slate-400">Tidak dapat menghapus data penting</p>
            </div>
          </div>
        </Card>
      </div>
      <Card noPadding>
        <div className="min-w-0 max-w-full overflow-x-auto">
          <table className="w-full max-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-5 py-3">Modul</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Admin</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.module} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="break-words px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{p.module}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone="success">Full Access</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone="warning">{p.admin}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function BackupPage() {
  const { restoreAll } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleBackup() {
    const data = exportAllData();
    downloadFile(`backup-pembukuan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
    toast("Backup berhasil diunduh", "success");
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await confirm({
      title: "Restore Data",
      description: "Data saat ini akan digantikan dengan data dari file backup. Lanjutkan?",
      tone: "danger",
      confirmLabel: "Restore",
    });
    if (!ok) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      restoreAllData(data);
      restoreAll(data);
      toast("Data berhasil direstore", "success");
    } catch {
      toast("File backup tidak valid", "danger");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 dark:bg-blue-500/10">
          <i className="fi fi-rr-cloud-upload" />
        </div>
        <h3 className="mt-4 font-bold text-slate-800 dark:text-slate-100">Backup Data</h3>
        <p className="mt-1 text-sm text-slate-400">Unduh seluruh data LocalStorage menjadi file JSON sebagai cadangan.</p>
        <Button className="mt-4" icon="fi fi-rr-download" onClick={handleBackup}>
          Backup Sekarang
        </Button>
      </Card>
      <Card>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600 dark:bg-amber-500/10">
          <i className="fi fi-rr-cloud-download"></i>
        </div>
        <h3 className="mt-4 font-bold text-slate-800 dark:text-slate-100">Restore Data</h3>
        <p className="mt-1 text-sm text-slate-400">Pulihkan data dari file backup JSON yang pernah diunduh sebelumnya.</p>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreFile} />
        <Button className="mt-4" variant="outline" icon="fi fi-rr-upload" onClick={() => fileRef.current?.click()}>
          Pilih File Backup
        </Button>
      </Card>
    </div>
  );
}

export function AuditLogPage() {
  const { logs, clearLogs, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();

  async function handleClear() {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus audit log", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Semua Log", description: "Seluruh riwayat aktivitas akan dihapus permanen.", tone: "danger" });
    if (!ok) return;
    clearLogs();
    toast("Audit log berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" icon="fi fi-rr-trash" onClick={handleClear}>
          Bersihkan Log
        </Button>
      </div>
      <Card>
        <DataTable
          data={logs}
          keyExtractor={(l) => l.id}
          searchPlaceholder="Cari aktivitas..."
          emptyTitle="Belum ada aktivitas"
          renderCardTitle={(l) => `${l.action} ${l.module}`}
          renderCardSubtitle={(l) => formatDate(l.timestamp, true)}
          renderCardBadge={(l) => <Badge tone="info">{l.user}</Badge>}
          columns={[
            { key: "timestamp", header: "Waktu", accessor: (l) => l.timestamp, sortable: true, render: (l) => formatDate(l.timestamp, true) },
            { key: "user", header: "Pengguna", accessor: (l) => l.user, render: (l) => <Badge tone="info">{l.user}</Badge> },
            { key: "action", header: "Aksi", accessor: (l) => l.action },
            { key: "module", header: "Modul", accessor: (l) => l.module },
            { key: "detail", header: "Detail", accessor: (l) => l.detail, hideOnMobile: true },
          ]}
        />
      </Card>
    </div>
  );
}
