import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadData, saveData, STORAGE_KEYS } from "../lib/storage";
import { generateId, generateNo, todayISO } from "../lib/utils";
import {
  AppUser,
  AuditLog,
  BusinessSettings,
  Category,
  Product,
  StockIn,
  StockOpname,
  StockOut,
  Transaction,
  UserRole,
} from "../lib/types";

function emptySettings(): BusinessSettings {
  return {
    businessName: "",
    logo: "",
    phone: "",
    email: "",
    address: "",
  };
}

const LEGACY_DEMO_CATEGORIES = new Set([
  "Penjualan",
  "Pendapatan Jasa",
  "Pendapatan Lain",
  "Gaji",
  "Operasional",
  "Listrik",
  "Air",
  "Internet",
  "Marketing",
  "Transportasi",
  "Maintenance",
  "Lain-lain",
]);

const LEGACY_DEMO_PRODUCTS = new Set([
  "Beras Premium 5kg",
  "Minyak Goreng 2L",
  "Gula Pasir 1kg",
  "Kopi Bubuk 200gr",
  "Air Mineral 600ml",
]);

const DEFAULT_CATEGORIES: Array<Pick<Category, "type" | "name">> = [
  { type: "income", name: "Penjualan" },
  { type: "income", name: "Pendapatan Jasa" },
  { type: "income", name: "Pendapatan Lainnya" },
  { type: "income", name: "Modal Pemilik" },
  { type: "income", name: "Inisialisasi Saldo Awal" },
  { type: "expense", name: "Pembelian Barang" },
  { type: "expense", name: "Operasional" },
  { type: "expense", name: "Sewa Tempat" },
  { type: "expense", name: "Listrik, Air & Internet" },
  { type: "expense", name: "Transportasi" },
  { type: "expense", name: "Marketing" },
  { type: "expense", name: "Perawatan & Perbaikan" },
  { type: "expense", name: "Pajak & Administrasi" },
  { type: "expense", name: "Pengeluaran Lainnya" },
];

function persistCollection<T>(key: string, data: T[]) {
  if (data.length > 0) saveData(key, data);
  else localStorage.removeItem(key);
}

function removeLegacyDemoData() {
  localStorage.removeItem("bookkeeping_production");
  localStorage.removeItem("bookkeeping_employees");
  localStorage.removeItem("bookkeeping_payroll");

  const income = loadData<Transaction[]>(STORAGE_KEYS.income, []);
  const expense = loadData<Transaction[]>(STORAGE_KEYS.expense, []);
  persistCollection(
    STORAGE_KEYS.expense,
    expense.filter((transaction) => (transaction.sourceType as string) !== "payroll"),
  );
  const products = loadData<Product[]>(STORAGE_KEYS.products, []);
  const users = loadData<AppUser[]>(STORAGE_KEYS.users, []);
  const categories = loadData<Category[]>(STORAGE_KEYS.categories, []);
  const settings = loadData<BusinessSettings>(STORAGE_KEYS.settings, emptySettings());

  localStorage.removeItem("bookkeeping_legacy_demo_cleanup_v1");

  const hasLegacyDemoData =
    income.some((item) => item.description === "Transaksi pemasukan usaha") ||
    expense.some((item) => item.description === "Transaksi pengeluaran usaha") ||
    products.some((item) => LEGACY_DEMO_PRODUCTS.has(item.name)) ||
    users.some((item) => ["owner@usaha.com", "admin@usaha.com"].includes(item.email)) ||
    (settings.businessName === "Usaha Saya" && settings.email === "owner@usaha.com");

  if (!hasLegacyDemoData) return;

  persistCollection(
    STORAGE_KEYS.income,
    income.filter((transaction) => transaction.description !== "Transaksi pemasukan usaha"),
  );
  persistCollection(
    STORAGE_KEYS.expense,
    expense.filter(
      (transaction) =>
        transaction.description !== "Transaksi pengeluaran usaha" &&
        (transaction.sourceType as string) !== "payroll",
    ),
  );
  persistCollection(STORAGE_KEYS.products, products.filter((product) => !LEGACY_DEMO_PRODUCTS.has(product.name)));
  persistCollection(
    STORAGE_KEYS.users,
    users.filter((user) => !["owner@usaha.com", "admin@usaha.com"].includes(user.email)),
  );
  persistCollection(
    STORAGE_KEYS.categories,
    categories.filter((category) => !LEGACY_DEMO_CATEGORIES.has(category.name)),
  );

  if (
    settings.businessName === "Usaha Saya" &&
    settings.email === "owner@usaha.com" &&
    settings.phone === "0812-0000-0000"
  ) {
    localStorage.removeItem(STORAGE_KEYS.settings);
  }
}

function ensureDefaultCategories() {
  const current = loadData<Category[]>(STORAGE_KEYS.categories, []);
  const existing = new Set(
    current.map((category) => `${category.type}:${category.name.trim().toLowerCase()}`),
  );
  const additions = DEFAULT_CATEGORIES.filter(
    (category) => !existing.has(`${category.type}:${category.name.toLowerCase()}`),
  ).map((category) => ({
    ...category,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));
  const categories = [...current, ...additions];
  if (additions.length > 0) saveData(STORAGE_KEYS.categories, categories);

  const salesCategory = categories.find(
    (category) => category.type === "income" && category.name === "Penjualan",
  );
  if (!salesCategory) return;

  const income = loadData<Transaction[]>(STORAGE_KEYS.income, []);
  const migrated = income.map((transaction) =>
    transaction.sourceType === "stock_out"
      ? { ...transaction, categoryId: salesCategory.id, categoryName: salesCategory.name }
      : transaction,
  );
  if (
    migrated.some(
      (transaction, index) =>
        transaction.categoryId !== income[index]?.categoryId ||
        transaction.categoryName !== income[index]?.categoryName,
    )
  ) {
    saveData(STORAGE_KEYS.income, migrated);
  }
}

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  addCategory: (data: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  income: Transaction[];
  addIncome: (
    data: Omit<Transaction, "id" | "no" | "type" | "createdAt">,
  ) => void;
  updateIncome: (id: string, data: Partial<Transaction>) => void;
  deleteIncome: (id: string) => void;

  expense: Transaction[];
  addExpense: (
    data: Omit<Transaction, "id" | "no" | "type" | "createdAt">,
  ) => void;
  updateExpense: (id: string, data: Partial<Transaction>) => void;
  deleteExpense: (id: string) => void;

  products: Product[];
  addProduct: (data: Omit<Product, "id" | "createdAt" | "stock">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  stockIn: StockIn[];
  addStockIn: (
    data: Omit<StockIn, "id" | "no" | "createdAt" | "productName">,
  ) => void;
  deleteStockIn: (id: string) => void;

  stockOut: StockOut[];
  addStockOut: (
    data: Omit<StockOut, "id" | "no" | "createdAt" | "productName">,
  ) => void;
  deleteStockOut: (id: string) => void;

  stockOpname: StockOpname[];
  addStockOpname: (
    data: Omit<
      StockOpname,
      "id" | "no" | "createdAt" | "productName" | "systemQty" | "diff"
    >,
  ) => void;
  deleteStockOpname: (id: string) => void;

  users: AppUser[];
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  settings: BusinessSettings;
  updateSettings: (data: Partial<BusinessSettings>) => void;

  logs: AuditLog[];
  addLog: (action: string, module: string, detail: string) => void;
  clearLogs: () => void;
  clearTransactionData: () => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  restoreAll: (data: Record<string, unknown>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  removeLegacyDemoData();
  ensureDefaultCategories();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(() =>
    loadData(STORAGE_KEYS.categories, [] as Category[]),
  );
  const [income, setIncome] = useState<Transaction[]>(() =>
    loadData(STORAGE_KEYS.income, [] as Transaction[]),
  );
  const [expense, setExpense] = useState<Transaction[]>(() =>
    loadData(STORAGE_KEYS.expense, [] as Transaction[]).filter(
      (transaction) => (transaction.sourceType as string) !== "payroll",
    ),
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadData(STORAGE_KEYS.products, [] as Product[]).map((product) => ({
      ...product,
      status: "active",
    })),
  );
  const [stockIn, setStockIn] = useState<StockIn[]>(() =>
    loadData(STORAGE_KEYS.stockIn, [] as StockIn[]),
  );
  const [stockOut, setStockOut] = useState<StockOut[]>(() =>
    loadData(STORAGE_KEYS.stockOut, [] as StockOut[]),
  );
  const [stockOpname, setStockOpname] = useState<StockOpname[]>(() =>
    loadData(STORAGE_KEYS.stockOpname, [] as StockOpname[]),
  );
  const [users, setUsers] = useState<AppUser[]>(() =>
    loadData(STORAGE_KEYS.users, [] as AppUser[]),
  );
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    loadData(STORAGE_KEYS.settings, emptySettings()),
  );
  const [logs, setLogs] = useState<AuditLog[]>(() =>
    loadData(STORAGE_KEYS.logs, [] as AuditLog[]),
  );
  const [currentRole, setCurrentRole] = useState<UserRole>("owner");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => persistCollection(STORAGE_KEYS.categories, categories), [categories]);
  useEffect(() => persistCollection(STORAGE_KEYS.income, income), [income]);
  useEffect(() => persistCollection(STORAGE_KEYS.expense, expense), [expense]);
  useEffect(() => persistCollection(STORAGE_KEYS.products, products), [products]);
  useEffect(() => persistCollection(STORAGE_KEYS.stockIn, stockIn), [stockIn]);
  useEffect(() => persistCollection(STORAGE_KEYS.stockOut, stockOut), [stockOut]);
  useEffect(
    () => persistCollection(STORAGE_KEYS.stockOpname, stockOpname),
    [stockOpname],
  );
  useEffect(() => persistCollection(STORAGE_KEYS.users, users), [users]);
  useEffect(() => {
    if (Object.values(settings).some(Boolean)) saveData(STORAGE_KEYS.settings, settings);
    else localStorage.removeItem(STORAGE_KEYS.settings);
  }, [settings]);
  useEffect(() => persistCollection(STORAGE_KEYS.logs, logs), [logs]);

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
        setCategories((prev) => [
          ...prev,
          { ...data, id: generateId(), createdAt: new Date().toISOString() },
        ]);
        addLog("Tambah", "Kategori", data.name);
      },
      updateCategory: (id, data) => {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
        );
        addLog("Edit", "Kategori", id);
      },
      deleteCategory: (id) => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        addLog("Hapus", "Kategori", id);
      },

      income,
      addIncome: (data) => {
        const no = generateNo("INC", income.length + 1);
        setIncome((prev) => [
          {
            ...data,
            id: generateId(),
            no,
            type: "income",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Pemasukan", no);
      },
      updateIncome: (id, data) => {
        setIncome((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
        );
        addLog("Edit", "Pemasukan", id);
      },
      deleteIncome: (id) => {
        setIncome((prev) => prev.filter((t) => t.id !== id));
        addLog("Hapus", "Pemasukan", id);
      },

      expense,
      addExpense: (data) => {
        const no = generateNo("EXP", expense.length + 1);
        setExpense((prev) => [
          {
            ...data,
            id: generateId(),
            no,
            type: "expense",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Pengeluaran", no);
      },
      updateExpense: (id, data) => {
        setExpense((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
        );
        addLog("Edit", "Pengeluaran", id);
      },
      deleteExpense: (id) => {
        setExpense((prev) => prev.filter((t) => t.id !== id));
        addLog("Hapus", "Pengeluaran", id);
      },

      products,
      addProduct: (data) => {
        setProducts((prev) => [
          ...prev,
          {
            ...data,
            id: generateId(),
            stock: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
        addLog("Tambah", "Barang", data.name);
      },
      updateProduct: (id, data) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
        );
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
        const stockInId = generateId();
        setStockIn((prev) => [
          {
            ...data,
            id: stockInId,
            no,
            productName: product?.name || "-",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === data.productId
              ? {
                  ...p,
                  stock: p.stock + data.qty,
                  costPrice:
                    data.costPrice > 0
                      ? ((p.stock * p.costPrice) + data.costPrice) / (p.stock + data.qty)
                      : p.costPrice,
                }
              : p,
          ),
        );
        const category =
          categories.find(
            (item) => item.type === "expense" && item.name === "Pembelian Barang",
          ) ||
          categories.find(
            (item) => item.type === "expense" && item.name === "Operasional",
          ) ||
          categories.find((item) => item.type === "expense");
        setExpense((prev) => [
          {
            id: generateId(),
            no: generateNo("EXP", expense.length + 1),
            type: "expense",
            date: data.date,
            categoryId: category?.id || "auto-pembelian-barang",
            categoryName: category?.name || "Pembelian Barang",
            amount: data.costPrice,
            description: `Pembelian ${data.qty} ${product?.unit || "unit"} ${product?.name || "barang"} (${no})${data.note ? ` - ${data.note}` : ""}`,
            sourceType: "stock_in",
            sourceId: stockInId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Barang Masuk", no);
      },
      deleteStockIn: (id) => {
        const item = stockIn.find((s) => s.id === id);
        if (item)
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id !== item.productId) return p;
              const remainingStock = Math.max(0, p.stock - item.qty);
              const remainingValue = Math.max(0, (p.stock * p.costPrice) - item.costPrice);
              return {
                ...p,
                stock: remainingStock,
                costPrice: remainingStock > 0 ? remainingValue / remainingStock : 0,
              };
            }),
          );
        setStockIn((prev) => prev.filter((s) => s.id !== id));
        setExpense((prev) =>
          prev.filter(
            (transaction) =>
              !(transaction.sourceType === "stock_in" && transaction.sourceId === id),
          ),
        );
        addLog("Hapus", "Barang Masuk", id);
      },

      stockOut,
      addStockOut: (data) => {
        const product = products.find((p) => p.id === data.productId);
        const no = generateNo("SOUT", stockOut.length + 1);
        const stockOutId = generateId();
        setStockOut((prev) => [
          {
            ...data,
            id: stockOutId,
            no,
            productName: product?.name || "-",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === data.productId
              ? { ...p, stock: Math.max(0, p.stock - data.qty) }
              : p,
          ),
        );
        const category =
          categories.find(
            (c) => c.type === "income" && c.name === "Penjualan",
          ) || categories.find((c) => c.type === "income");
        const incomeNo = generateNo("INC", income.length + 1);
        setIncome((prev) => [
          {
            id: generateId(),
            no: incomeNo,
            type: "income",
            date: data.date,
            categoryId: category?.id || "auto-penjualan",
            categoryName: category?.name || "Penjualan",
            amount: (product?.sellPrice || 0) * data.qty,
            description: `Penjualan otomatis ${data.qty} ${product?.unit || "unit"} ${product?.name || "barang"} (${no})`,
            sourceType: "stock_out",
            sourceId: stockOutId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Barang Keluar", no);
      },
      deleteStockOut: (id) => {
        const item = stockOut.find((s) => s.id === id);
        if (item)
          setProducts((prev) =>
            prev.map((p) =>
              p.id === item.productId ? { ...p, stock: p.stock + item.qty } : p,
            ),
          );
        setStockOut((prev) => prev.filter((s) => s.id !== id));
        setIncome((prev) =>
          prev.filter(
            (t) => !(t.sourceType === "stock_out" && t.sourceId === id),
          ),
        );
        addLog("Hapus", "Barang Keluar", id);
      },

      stockOpname,
      addStockOpname: (data) => {
        const product = products.find((p) => p.id === data.productId);
        const systemQty = product?.stock || 0;
        const diff = data.actualQty - systemQty;
        const no = generateNo("OPN", stockOpname.length + 1);
        setStockOpname((prev) => [
          {
            ...data,
            id: generateId(),
            no,
            productName: product?.name || "-",
            systemQty,
            diff,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === data.productId ? { ...p, stock: data.actualQty } : p,
          ),
        );
        addLog("Tambah", "Stock Opname", no);
      },
      deleteStockOpname: (id) => {
        setStockOpname((prev) => prev.filter((s) => s.id !== id));
        addLog("Hapus", "Stock Opname", id);
      },

      users,
      addUser: (data) => {
        setUsers((prev) => [
          ...prev,
          { ...data, id: generateId(), createdAt: new Date().toISOString() },
        ]);
        addLog("Tambah", "Pengguna", data.name);
      },
      updateUser: (id, data) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...data } : u)),
        );
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
      clearTransactionData: () => {
        setIncome([]);
        setExpense([]);
        setStockIn([]);
        setStockOut([]);
        setStockOpname([]);
        setProducts((prev) =>
          prev.map((product) => ({
            ...product,
            stock: 0,
            costPrice: 0,
          })),
        );
        addLog("Hapus", "Backup & Data", "Seluruh data transaksi");
      },

      currentRole,
      setCurrentRole,

      restoreAll: (data) => {
        if (data[STORAGE_KEYS.categories])
          setCategories(data[STORAGE_KEYS.categories] as Category[]);
        if (data[STORAGE_KEYS.income])
          setIncome(data[STORAGE_KEYS.income] as Transaction[]);
        if (data[STORAGE_KEYS.expense])
          setExpense(
            (data[STORAGE_KEYS.expense] as Transaction[]).filter(
              (transaction) => (transaction.sourceType as string) !== "payroll",
            ),
          );
        if (data[STORAGE_KEYS.products])
          setProducts(
            (data[STORAGE_KEYS.products] as Product[]).map((product) => ({
              ...product,
              status: "active",
            })),
          );
        if (data[STORAGE_KEYS.stockIn])
          setStockIn(data[STORAGE_KEYS.stockIn] as StockIn[]);
        if (data[STORAGE_KEYS.stockOut])
          setStockOut(data[STORAGE_KEYS.stockOut] as StockOut[]);
        if (data[STORAGE_KEYS.stockOpname])
          setStockOpname(data[STORAGE_KEYS.stockOpname] as StockOpname[]);
        if (data[STORAGE_KEYS.users])
          setUsers(data[STORAGE_KEYS.users] as AppUser[]);
        if (data[STORAGE_KEYS.settings])
          setSettings(data[STORAGE_KEYS.settings] as BusinessSettings);
        if (data[STORAGE_KEYS.logs])
          setLogs(data[STORAGE_KEYS.logs] as AuditLog[]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loading,
      categories,
      income,
      expense,
      products,
      stockIn,
      stockOut,
      stockOpname,
      users,
      settings,
      logs,
      currentRole,
    ],
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
  return list
    .filter((t) => t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);
}
