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
  Switch,
  useConfirm,
  useToast,
} from "../components/ui";
import { Employee, Payroll } from "../lib/types";
import { exportToExcel, exportToPDF } from "../lib/exporters";
import { formatCurrency, formatDate, monthKey, monthLabel, todayISO } from "../lib/utils";

export function DataKaryawanPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", position: "", phone: "", joinDate: todayISO(), status: "active" as "active" | "inactive" });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", position: "", phone: "", joinDate: todayISO(), status: "active" });
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setForm({ name: e.name, position: e.position, phone: e.phone, joinDate: e.joinDate, status: e.status });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.position.trim()) {
      toast("Nama dan jabatan wajib diisi", "warning");
      return;
    }
    if (editing) {
      updateEmployee(editing.id, form);
      toast("Data karyawan berhasil diperbarui", "success");
    } else {
      addEmployee(form);
      toast("Karyawan berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(e: Employee) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data karyawan", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Karyawan", description: `Yakin ingin menghapus ${e.name}?`, tone: "danger" });
    if (!ok) return;
    deleteEmployee(e.id);
    toast("Karyawan berhasil dihapus", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon="fi fi-rr-plus" onClick={openAdd}>
          Tambah Karyawan
        </Button>
      </div>
      <Card>
        <DataTable<Employee>
          data={employees}
          keyExtractor={(e) => e.id}
          searchPlaceholder="Cari nama / jabatan..."
          emptyTitle="Belum ada karyawan"
          renderCardTitle={(e) => e.name}
          renderCardSubtitle={(e) => e.position}
          renderCardBadge={(e) => <Badge tone={e.status === "active" ? "success" : "neutral"}>{e.status === "active" ? "Aktif" : "Nonaktif"}</Badge>}
          columns={[
            { key: "name", header: "Nama", accessor: (e) => e.name, sortable: true },
            { key: "position", header: "Jabatan", accessor: (e) => e.position, sortable: true },
            { key: "phone", header: "No HP", accessor: (e) => e.phone, hideOnMobile: true },
            { key: "join", header: "Tgl Bergabung", accessor: (e) => e.joinDate, render: (e) => formatDate(e.joinDate), hideOnMobile: true },
            { key: "status", header: "Status", accessor: (e) => e.status, render: (e) => <Badge tone={e.status === "active" ? "success" : "neutral"}>{e.status === "active" ? "Aktif" : "Nonaktif"}</Badge> },
          ]}
          actions={(e) => (
            <>
              <IconButton icon="fi fi-rr-pencil" label="Edit" onClick={() => openEdit(e)} />
              <IconButton icon="fi fi-rr-trash" label="Hapus" variant="danger" onClick={() => handleDelete(e)} />
            </>
          )}
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Karyawan" : "Tambah Karyawan"}
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
          <Input label="Jabatan" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Tanggal Bergabung" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
          <Switch checked={form.status === "active"} onChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} label="Karyawan Aktif" />
        </div>
      </Modal>
    </div>
  );
}

export function PayrollPage() {
  const { payroll, addPayroll, updatePayroll, deletePayroll, employees, currentRole } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payroll | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [form, setForm] = useState({
    month: monthKey(),
    employeeId: "",
    baseSalary: 0,
    bonus: 0,
    deduction: 0,
    overtime: 0,
    status: "unpaid" as "paid" | "unpaid",
  });

  const filtered = useMemo(() => (filterMonth ? payroll.filter((p) => p.month === filterMonth) : payroll), [payroll, filterMonth]);
  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(payroll.map((p) => p.month)));
    return months.sort().reverse().map((m) => ({ value: m, label: monthLabel(m) }));
  }, [payroll]);

  function openAdd() {
    setEditing(null);
    setForm({ month: monthKey(), employeeId: employees[0]?.id || "", baseSalary: 0, bonus: 0, deduction: 0, overtime: 0, status: "unpaid" });
    setModalOpen(true);
  }

  function openEdit(p: Payroll) {
    setEditing(p);
    setForm({ month: p.month, employeeId: p.employeeId, baseSalary: p.baseSalary, bonus: p.bonus, deduction: p.deduction, overtime: p.overtime, status: p.status });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.employeeId) {
      toast("Karyawan wajib dipilih", "warning");
      return;
    }
    if (editing) {
      updatePayroll(editing.id, form);
      toast("Payroll berhasil diperbarui", "success");
    } else {
      addPayroll(form);
      toast("Payroll berhasil ditambahkan", "success");
    }
    setModalOpen(false);
  }

  async function handleDelete(p: Payroll) {
    if (currentRole === "admin") {
      toast("Admin tidak dapat menghapus data payroll", "danger");
      return;
    }
    const ok = await confirm({ title: "Hapus Payroll", description: `Hapus payroll ${p.employeeName}?`, tone: "danger" });
    if (!ok) return;
    deletePayroll(p.id);
    toast("Payroll berhasil dihapus", "success");
  }

  function handleExportPDF() {
    exportToPDF(
      "Laporan Payroll",
      ["Bulan", "Karyawan", "Gaji Pokok", "Bonus", "Lembur", "Potongan", "Total", "Status"],
      filtered.map((p) => [monthLabel(p.month), p.employeeName, formatCurrency(p.baseSalary), formatCurrency(p.bonus), formatCurrency(p.overtime), formatCurrency(p.deduction), formatCurrency(p.total), p.status === "paid" ? "Lunas" : "Belum Lunas"]),
      "laporan-payroll",
    );
    toast("Berhasil export PDF", "success");
  }

  function handleExportExcel() {
    exportToExcel(
      "Payroll",
      ["Bulan", "Karyawan", "Gaji Pokok", "Bonus", "Lembur", "Potongan", "Total", "Status"],
      filtered.map((p) => [monthLabel(p.month), p.employeeName, p.baseSalary, p.bonus, p.overtime, p.deduction, p.total, p.status === "paid" ? "Lunas" : "Belum Lunas"]),
      "payroll",
    );
    toast("Berhasil export Excel", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-56">
          <Select value={filterMonth} onChange={setFilterMonth} options={[{ value: "", label: "Semua Bulan" }, ...monthOptions]} placeholder="Filter Bulan" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon="fi fi-rr-file-pdf" onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outline" icon="fi fi-rr-file-spreadsheet" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button icon="fi fi-rr-plus" onClick={openAdd}>
            Tambah Payroll
          </Button>
        </div>
      </div>
      <Card>
        <DataTable<Payroll>
          data={filtered}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Cari karyawan..."
          emptyTitle="Belum ada data payroll"
          renderCardTitle={(p) => p.employeeName}
          renderCardSubtitle={(p) => monthLabel(p.month)}
          renderCardBadge={(p) => <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status === "paid" ? "Lunas" : "Belum Lunas"}</Badge>}
          columns={[
            { key: "employee", header: "Karyawan", accessor: (p) => p.employeeName, sortable: true },
            { key: "month", header: "Bulan", accessor: (p) => p.month, render: (p) => monthLabel(p.month), sortable: true },
            { key: "base", header: "Gaji Pokok", accessor: (p) => p.baseSalary, render: (p) => formatCurrency(p.baseSalary), hideOnMobile: true },
            { key: "bonus", header: "Bonus", accessor: (p) => p.bonus, render: (p) => formatCurrency(p.bonus), hideOnMobile: true },
            { key: "deduction", header: "Potongan", accessor: (p) => p.deduction, render: (p) => formatCurrency(p.deduction), hideOnMobile: true },
            { key: "total", header: "Total Gaji", accessor: (p) => p.total, sortable: true, render: (p) => <span className="font-semibold">{formatCurrency(p.total)}</span> },
            { key: "status", header: "Status", accessor: (p) => p.status, render: (p) => <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status === "paid" ? "Lunas" : "Belum Lunas"}</Badge> },
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
        title={editing ? "Edit Payroll" : "Tambah Payroll"}
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
          <Input label="Bulan" type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
          <Select label="Karyawan" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} options={employees.map((e) => ({ value: e.id, label: e.name }))} placeholder="Pilih karyawan" />
          <CurrencyInput label="Gaji Pokok" value={form.baseSalary} onChange={(v) => setForm({ ...form, baseSalary: v })} />
          <CurrencyInput label="Bonus" value={form.bonus} onChange={(v) => setForm({ ...form, bonus: v })} />
          <CurrencyInput label="Lembur" value={form.overtime} onChange={(v) => setForm({ ...form, overtime: v })} />
          <CurrencyInput label="Potongan" value={form.deduction} onChange={(v) => setForm({ ...form, deduction: v })} />
          <div className="sm:col-span-2">
            <Switch checked={form.status === "paid"} onChange={(v) => setForm({ ...form, status: v ? "paid" : "unpaid" })} label="Sudah Dibayar" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
