import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { loadData, saveData, STORAGE_KEYS } from "../lib/storage";
import { generateId, generateNo, todayISO } from "../lib/utils";
import {
  AppUser,
  AuditLog,
  BusinessSettings,
  Category,
  Employee,
  Payroll,
  Product,
  StockIn,
  StockOpname,
  StockOut,
  Transaction,
  TransactionType,
  UserRole,
} from "../lib/types";

function seedCategories(): Category[] {
  const now = new Date().toISOString();
  const income = ["Penjualan", "Pendapatan Jasa", "Pendapatan Lain"];
  const expense = ["Gaji", "Operasional", "Listrik", "Air", "Internet", "Marketing", "Transportasi", "Maintenance", "Lain-lain"];
  return [
    ...income.map((name) => ({ id: generateId(), type: "income" as TransactionType, name, createdAt: now })),
    ...expense.map((name) => ({ id: generateId(), type: "expense" as TransactionType, name, createdAt: now })),
  ];
}

function seedSettings(): BusinessSettings {
  return {
    businessName: "Usaha Saya",
    logo: "",
    phone: "0812-0000-0000",
    email: "owner@usaha.com",
    address: "Jl. Melati No. 1, Jakarta",
  };
}

function seedUsers(): AppUser[] {
  const now = new Date().toISOString();
  return [
    { id: generateId(), name: "Andi Pratama", email: "owner@usaha.com", role: "owner", status: "active", createdAt: now },
    { id: generateId(), name: "Siti Nurhaliza", email: "admin@usaha.com", role: "admin", status: "active", createdAt: now },
  ];
}

function randomDateWithinDays(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString().slice(0, 10);
}

function seedDemoTransactions(categories: Category[]): { income: Transaction[]; expense: Transaction[] } {
  const now = new Date().toISOString();
  const incomeCats = categories.filter((c) => c.type === "income");
  const expenseCats = categories.filter((c) => c.type === "expense");
  const income: Transaction[] = Array.from({ length: 18 }).map((_, i) => {
    const cat = incomeCats[i % incomeCats.length];
    return {
      id: generateId(),
      no: generateNo("INC", i + 1),
      type: "income",
      date: randomDateWithinDays(60),
      categoryId: cat.id,
      categoryName: cat.name,
      amount: Math.round((Math.random() * 1500000 + 200000) / 1000) * 1000,
      description: "Transaksi pemasukan usaha",
      createdAt: now,
    };
  });
  const expense: Transaction[] = Array.from({ length: 16 }).map((_, i) => {
    const cat = expenseCats[i % expenseCats.length];
    return {
      id: generateId(),
      no: generateNo("EXP", i + 1),
      type: "expense",
      date: randomDateWithinDays(60),
      categoryId: cat.id,
      categoryName: cat.name,
      amount: Math.round((Math.random() * 800000 + 100000) / 1000) * 1000,
      description: "Transaksi pengeluaran usaha",
      createdAt: now,
    };
  });
  return { income, expense };
}

function seedDemoProducts(): Product[] {
  const now = new Date().toISOString();
  const items = [
    { name: "Beras Premium 5kg", unit: "Pack", cost: 62000, sell: 75000, stock: 24, min: 10 },
    { name: "Minyak Goreng 2L", unit: "Pcs", cost: 32000, sell: 39000, stock: 6, min: 8 },
    { name: "Gula Pasir 1kg", unit: "Pcs", cost: 13000, sell: 16000, stock: 40, min: 15 },
    { name: "Kopi Bubuk 200gr", unit: "Pack", cost: 18000, sell: 24000, stock: 3, min: 10 },
    { name: "Air Mineral 600ml", unit: "Box", cost: 45000, sell: 55000, stock: 18, min: 5 },
  ];
  return items.map((it, i) => ({
    id: generateId(),
    sku: `SKU-${String(i + 1).padStart(4, "0")}`,
    name: it.name,
    categoryId: "Sembako",
    categoryName: "Sembako",
    unit: it.unit,
    costPrice: it.cost,
    sellPrice: it.sell,
    minStock: it.min,
    stock: it.stock,
    status: "active",
    createdAt: now,
  }));
}

function seedDemoEmployees(): Employee[] {
  const now = new Date().toISOString();
  return [
    { id: generateId(), name: "Rian Saputra", position: "Kasir", phone: "0812-1111-2222", joinDate: "2023-03-01", status: "active", createdAt: now },
    { id: generateId(), name: "Dewi Lestari", position: "Admin Gudang", phone: "0813-2222-3333", joinDate: "2022-11-15", status: "active", createdAt: now },
  ];
}

function seedDemoPayroll(employees: Employee[]): Payroll[] {
  const now = new Date().toISOString();
  return employees.map((e, i) => {
    const baseSalary = 3500000;
    const bonus = 200000;
    const overtime = 150000;
    const deduction = 50000;
    return {
      id: generateId(),
      month: monthKeyNow(),
      employeeId: e.id,
      employeeName: e.name,
      baseSalary,
      bonus,
      deduction,
      overtime,
      total: baseSalary + bonus + overtime - deduction,
      status: i === 0 ? "paid" : "unpaid",
      createdAt: now,
    };
  });
}

function monthKeyNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  addCategory: (data: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  income: Transaction[];
  addIncome: (data: Omit<Transaction, "id" | "no" | "type" | "createdAt">) => void;
  updateIncome: (id: string, data: Partial<Transaction>) => void;
  deleteIncome: (id: string) => void;

  expense: Transaction[];
  addExpense: (data: Omit<Transaction, "id" | "no" | "type" | "createdAt">) => void;
  updateExpense: (id: string, data: Partial<Transaction>) => void;
  deleteExpense: (id: string) => void;

  products: Product[];
  addProduct: (data: Omit<Product, "id" | "createdAt" | "stock">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  stockIn: StockIn[];
  addStockIn: (data: Omit<StockIn, "id" | "no" | "createdAt" | "productName">) => void;
  deleteStockIn: (id: string) => void;

  stockOut: StockOut[];
  addStockOut: (data: Omit<StockOut, "id" | "no" | "createdAt" | "productName">) => void;
  deleteStockOut: (id: string) => void;

  stockOpname: StockOpname[];
  addStockOpname: (data: Omit<StockOpname, "id" | "no" | "createdAt" | "productName" | "systemQty" | "diff">) => void;
  deleteStockOpname: (id: string) => void;

  employees: Employee[];
  addEmployee: (data: Omit<Employee, "id" | "createdAt">) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  payroll: Payroll[];
  addPayroll: (data: Omit<Payroll, "id" | "createdAt" | "total" | "employeeName">) => void;
  updatePayroll: (id: string, data: Partial<Payroll>) => void;
  deletePayroll: (id: string) => void;

  users: AppUser[];
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  settings: BusinessSettings;
  updateSettings: (data: Partial<BusinessSettings>) => void;

  logs: AuditLog[];
  addLog: (action: string, module: string, detail: string) => void;
  clearLogs: () => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  restoreAll: (data: Record<string, unknown>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(() => loadData(STORAGE_KEYS.categories, [] as Category[]));
  const [income, setIncome] = useState<Transaction[]>(() => loadData(STORAGE_KEYS.income, [] as Transaction[]));
  const [expense, setExpense] = useState<Transaction[]>(() => loadData(STORAGE_KEYS.expense, [] as Transaction[]));
  const [products, setProducts] = useState<Product[]>(() => loadData(STORAGE_KEYS.products, [] as Product[]));
  const [stockIn, setStockIn] = useState<StockIn[]>(() => loadData(STORAGE_KEYS.stockIn, [] as StockIn[]));
  const [stockOut, setStockOut] = useState<StockOut[]>(() => loadData(STORAGE_KEYS.stockOut, [] as StockOut[]));
  const [stockOpname, setStockOpname] = useState<StockOpname[]>(() => loadData(STORAGE_KEYS.stockOpname, [] as StockOpname[]));
  const [employees, setEmployees] = useState<Employee[]>(() => loadData(STORAGE_KEYS.employees, [] as Employee[]));
  const [payroll, setPayroll] = useState<Payroll[]>(() => loadData(STORAGE_KEYS.payroll, [] as Payroll[]));
  const [users, setUsers] = useState<AppUser[]>(() => loadData(STORAGE_KEYS.users, [] as AppUser[]));
  const [settings, setSettings] = useState<BusinessSettings>(() => loadData(STORAGE_KEYS.settings, seedSettings()));
  const [logs, setLogs] = useState<AuditLog[]>(() => loadData(STORAGE_KEYS.logs, [] as AuditLog[]));
  const [currentRole, setCurrentRole] = useState<UserRole>("owner");

  // Seed defaults on first run
  useEffect(() => {
    const isFirstRun = categories.length === 0 && income.length === 0 && expense.length === 0 && products.length === 0;
    let seededCategories = categories;
    if (categories.length === 0) {
      seededCategories = seedCategories();
      setCategories(seededCategories);
    }
    if (users.length === 0) setUsers(seedUsers());

    if (isFirstRun) {
      const { income: demoIncome, expense: demoExpense } = seedDemoTransactions(seededCategories);
      setIncome(demoIncome);
      setExpense(demoExpense);
      setProducts(seedDemoProducts());
      const demoEmployees = seedDemoEmployees();
      setEmployees(demoEmployees);
      setPayroll(seedDemoPayroll(demoEmployees));
    }

    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => saveData(STORAGE_KEYS.categories, categories), [categories]);
  useEffect(() => saveData(STORAGE_KEYS.income, income), [income]);
  useEffect(() => saveData(STORAGE_KEYS.expense, expense), [expense]);
  useEffect(() => saveData(STORAGE_KEYS.products, products), [products]);
  useEffect(() => saveData(STORAGE_KEYS.stockIn, stockIn), [stockIn]);
  useEffect(() => saveData(STORAGE_KEYS.stockOut, stockOut), [stockOut]);
  useEffect(() => saveData(STORAGE_KEYS.stockOpname, stockOpname), [stockOpname]);
  useEffect(() => saveData(STORAGE_KEYS.employees, employees), [employees]);
  useEffect(() => saveData(STORAGE_KEYS.payroll, payroll), [payroll]);
  useEffect(() => saveData(STORAGE_KEYS.users, users), [users]);
  useEffect(() => saveData(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveData(STORAGE_KEYS.logs, logs), [logs]);

  function addLog(action: string, module: string, detail: string) {
    const log: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      user: currentRole === "owner" ? "Owner" : "Admin",
      action,
      module,
      detail,
    };
    setLogs((prev) => [log, ...prev].slice(0, 300));
  }

  const value: DataContextValue = useMemo(
    () => ({
      loading,
      categories,
      addCategory: (data) => {
        setCategories((prev) => [...prev, { ...data, id: generateId(), createdAt: new Date().toISOString() }]);
        addLog("Tambah", "Kategori", data.name);
      },
      updateCategory: (id, data) => {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
        addLog("Edit", "Kategori", id);
      },
      deleteCategory: (id) => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        addLog("Hapus", "Kategori", id);
      },

      income,
      addIncome: (data) => {
        const no = generateNo("INC", income.length + 1);
        setIncome((prev) => [{ ...data, id: generateId(), no, type: "income", createdAt: new Date().toISOString() }, ...prev]);
        addLog("Tambah", "Pemasukan", no);
      },
      updateIncome: (id, data) => {
        setIncome((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        addLog("Edit", "Pemasukan", id);
      },
      deleteIncome: (id) => {
        setIncome((prev) => prev.filter((t) => t.id !== id));
        addLog("Hapus", "Pemasukan", id);
      },

      expense,
      addExpense: (data) => {
        const no = generateNo("EXP", expense.length + 1);
        setExpense((prev) => [{ ...data, id: generateId(), no, type: "expense", createdAt: new Date().toISOString() }, ...prev]);
        addLog("Tambah", "Pengeluaran", no);
      },
      updateExpense: (id, data) => {
        setExpense((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        addLog("Edit", "Pengeluaran", id);
      },
      deleteExpense: (id) => {
        setExpense((prev) => prev.filter((t) => t.id !== id));
        addLog("Hapus", "Pengeluaran", id);
      },

      products,
      addProduct: (data) => {
        setProducts((prev) => [...prev, { ...data, id: generateId(), stock: 0, createdAt: new Date().toISOString() }]);
        addLog("Tambah", "Barang", data.name);
      },
      updateProduct: (id, data) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        addLog("Edit", "Barang", id);
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        addLog("Hapus", "Barang", id);
      },

      stockIn,
      addStockIn: (data) => {
        const product = products.find((p) => p.id === data.productId);
        const no = generateNo("SIN", stockIn.length + 1);
        setStockIn((prev) => [
          { ...data, id: generateId(), no, productName: product?.name || "-", createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setProducts((prev) => prev.map((p) => (p.id === data.productId ? { ...p, stock: p.stock + data.qty, costPrice: data.costPrice || p.costPrice } : p)));
        addLog("Tambah", "Barang Masuk", no);
      },
      deleteStockIn: (id) => {
        const item = stockIn.find((s) => s.id === id);
        if (item) setProducts((prev) => prev.map((p) => (p.id === item.productId ? { ...p, stock: p.stock - item.qty } : p)));
        setStockIn((prev) => prev.filter((s) => s.id !== id));
        addLog("Hapus", "Barang Masuk", id);
      },

      stockOut,
      addStockOut: (data) => {
        const product = products.find((p) => p.id === data.productId);
        const no = generateNo("SOUT", stockOut.length + 1);
        const stockOutId = generateId();
        setStockOut((prev) => [
          { ...data, id: stockOutId, no, productName: product?.name || "-", createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setProducts((prev) => prev.map((p) => (p.id === data.productId ? { ...p, stock: Math.max(0, p.stock - data.qty) } : p)));
        const category = categories.find((c) => c.type === "income" && c.name === "Penjualan") || categories.find((c) => c.type === "income");
        const incomeNo = generateNo("INC", income.length + 1);
        setIncome((prev) => [
          {
            id: generateId(), no: incomeNo, type: "income", date: data.date,
            categoryId: category?.id || "auto-penjualan", categoryName: category?.name || "Penjualan",
            amount: (product?.sellPrice || 0) * data.qty,
            description: `Penjualan otomatis ${data.qty} ${product?.unit || "unit"} ${product?.name || "barang"} (${no})`,
            sourceType: "stock_out", sourceId: stockOutId, createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Barang Keluar", no);
      },
      deleteStockOut: (id) => {
        const item = stockOut.find((s) => s.id === id);
        if (item) setProducts((prev) => prev.map((p) => (p.id === item.productId ? { ...p, stock: p.stock + item.qty } : p)));
        setStockOut((prev) => prev.filter((s) => s.id !== id));
        setIncome((prev) => prev.filter((t) => !(t.sourceType === "stock_out" && t.sourceId === id)));
        addLog("Hapus", "Barang Keluar", id);
      },

      stockOpname,
      addStockOpname: (data) => {
        const product = products.find((p) => p.id === data.productId);
        const systemQty = product?.stock || 0;
        const diff = data.actualQty - systemQty;
        const no = generateNo("OPN", stockOpname.length + 1);
        setStockOpname((prev) => [
          { ...data, id: generateId(), no, productName: product?.name || "-", systemQty, diff, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setProducts((prev) => prev.map((p) => (p.id === data.productId ? { ...p, stock: data.actualQty } : p)));
        addLog("Tambah", "Stock Opname", no);
      },
      deleteStockOpname: (id) => {
        setStockOpname((prev) => prev.filter((s) => s.id !== id));
        addLog("Hapus", "Stock Opname", id);
      },

      employees,
      addEmployee: (data) => {
        setEmployees((prev) => [...prev, { ...data, id: generateId(), createdAt: new Date().toISOString() }]);
        addLog("Tambah", "Karyawan", data.name);
      },
      updateEmployee: (id, data) => {
        setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
        addLog("Edit", "Karyawan", id);
      },
      deleteEmployee: (id) => {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        addLog("Hapus", "Karyawan", id);
      },

      payroll,
      addPayroll: (data) => {
        const employee = employees.find((e) => e.id === data.employeeId);
        const total = data.baseSalary + data.bonus + data.overtime - data.deduction;
        const payrollId = generateId();
        setPayroll((prev) => [
          { ...data, id: payrollId, total, employeeName: employee?.name || "-", createdAt: new Date().toISOString() },
          ...prev,
        ]);
        if (data.status === "paid") {
          const category = categories.find((c) => c.type === "expense" && c.name === "Gaji") || categories.find((c) => c.type === "expense");
          setExpense((prev) => [{
            id: generateId(), no: generateNo("EXP", expense.length + 1), type: "expense", date: todayISO(),
            categoryId: category?.id || "auto-gaji", categoryName: category?.name || "Gaji", amount: total,
            description: `Pembayaran gaji ${employee?.name || "-"} periode ${data.month}`,
            sourceType: "payroll", sourceId: payrollId, createdAt: new Date().toISOString(),
          }, ...prev]);
        }
        addLog("Tambah", "Payroll", employee?.name || "-");
      },
      updatePayroll: (id, data) => {
        const current = payroll.find((p) => p.id === id);
        if (!current) return;
        const merged = { ...current, ...data };
        merged.total = merged.baseSalary + merged.bonus + merged.overtime - merged.deduction;
        const employee = employees.find((e) => e.id === merged.employeeId);
        merged.employeeName = employee?.name || merged.employeeName;
        setPayroll((prev) => prev.map((p) => (p.id === id ? merged : p)));
        if (merged.status === "paid") {
          const category = categories.find((c) => c.type === "expense" && c.name === "Gaji") || categories.find((c) => c.type === "expense");
          setExpense((prev) => {
            const linked = prev.find((t) => t.sourceType === "payroll" && t.sourceId === id);
            const details = {
              date: linked?.date || todayISO(), categoryId: category?.id || "auto-gaji", categoryName: category?.name || "Gaji",
              amount: merged.total, description: `Pembayaran gaji ${merged.employeeName} periode ${merged.month}`,
            };
            return linked
              ? prev.map((t) => (t.id === linked.id ? { ...t, ...details } : t))
              : [{ id: generateId(), no: generateNo("EXP", prev.length + 1), type: "expense" as const, ...details, sourceType: "payroll" as const, sourceId: id, createdAt: new Date().toISOString() }, ...prev];
          });
        } else {
          setExpense((prev) => prev.filter((t) => !(t.sourceType === "payroll" && t.sourceId === id)));
        }
        addLog("Edit", "Payroll", id);
      },
      deletePayroll: (id) => {
        setPayroll((prev) => prev.filter((p) => p.id !== id));
        setExpense((prev) => prev.filter((t) => !(t.sourceType === "payroll" && t.sourceId === id)));
        addLog("Hapus", "Payroll", id);
      },

      users,
      addUser: (data) => {
        setUsers((prev) => [...prev, { ...data, id: generateId(), createdAt: new Date().toISOString() }]);
        addLog("Tambah", "Pengguna", data.name);
      },
      updateUser: (id, data) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
        addLog("Edit", "Pengguna", id);
      },
      deleteUser: (id) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        addLog("Hapus", "Pengguna", id);
      },

      settings,
      updateSettings: (data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        addLog("Edit", "Profil Usaha", "Update profil");
      },

      logs,
      addLog,
      clearLogs: () => setLogs([]),

      currentRole,
      setCurrentRole,

      restoreAll: (data) => {
        if (data[STORAGE_KEYS.categories]) setCategories(data[STORAGE_KEYS.categories] as Category[]);
        if (data[STORAGE_KEYS.income]) setIncome(data[STORAGE_KEYS.income] as Transaction[]);
        if (data[STORAGE_KEYS.expense]) setExpense(data[STORAGE_KEYS.expense] as Transaction[]);
        if (data[STORAGE_KEYS.products]) setProducts(data[STORAGE_KEYS.products] as Product[]);
        if (data[STORAGE_KEYS.stockIn]) setStockIn(data[STORAGE_KEYS.stockIn] as StockIn[]);
        if (data[STORAGE_KEYS.stockOut]) setStockOut(data[STORAGE_KEYS.stockOut] as StockOut[]);
        if (data[STORAGE_KEYS.stockOpname]) setStockOpname(data[STORAGE_KEYS.stockOpname] as StockOpname[]);
        if (data[STORAGE_KEYS.employees]) setEmployees(data[STORAGE_KEYS.employees] as Employee[]);
        if (data[STORAGE_KEYS.payroll]) setPayroll(data[STORAGE_KEYS.payroll] as Payroll[]);
        if (data[STORAGE_KEYS.users]) setUsers(data[STORAGE_KEYS.users] as AppUser[]);
        if (data[STORAGE_KEYS.settings]) setSettings(data[STORAGE_KEYS.settings] as BusinessSettings);
        if (data[STORAGE_KEYS.logs]) setLogs(data[STORAGE_KEYS.logs] as AuditLog[]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, categories, income, expense, products, stockIn, stockOut, stockOpname, employees, payroll, users, settings, logs, currentRole],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function useDailyTotal(list: Transaction[]) {
  const today = todayISO();
  return list.filter((t) => t.date === today).reduce((sum, t) => sum + t.amount, 0);
}
