import {
  createContext,
  ReactNode,
  useRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../Services/api";
import { readLegacyData, removeLegacyData, STORAGE_KEYS } from "../lib/storage";
import { generateId, generateNo, todayISO } from "../lib/utils";
import { convertedStockKey, getConvertedBalance, normalizeUnit } from "../lib/inventory";
import { useToast } from "../components/ui";
import {
  AppUser,
  AuditLog,
  BusinessSettings,
  Category,
  ConvertedStockBalance,
  Product,
  StockIn,
  StockConversion,
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

function initialData(): Record<string, unknown> {
  const now = new Date().toISOString();

  return {
    [STORAGE_KEYS.income]: [],
    [STORAGE_KEYS.expense]: [],
    [STORAGE_KEYS.categories]: DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      id: generateId(),
      createdAt: now,
    })),
    [STORAGE_KEYS.products]: [],
    [STORAGE_KEYS.stockIn]: [],
    [STORAGE_KEYS.stockOut]: [],
    [STORAGE_KEYS.stockOpname]: [],
    [STORAGE_KEYS.stockConversions]: [],
    [STORAGE_KEYS.legacyStockCuts]: [],
    [STORAGE_KEYS.users]: [],
    [STORAGE_KEYS.settings]: emptySettings(),
    [STORAGE_KEYS.logs]: [],
  };
}

interface DataContextValue {
  loading: boolean;
  loadError: string | null;
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
  addProduct: (data: Omit<Product, "id" | "createdAt" | "stock" | "convertedStock" | "portionStock" | "portionCostPrice">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  stockIn: StockIn[];
  addStockIn: (
    data: Omit<StockIn, "id" | "no" | "createdAt" | "productName" | "costPrice"> & {
      totalCost: number;
    },
  ) => boolean;
  deleteStockIn: (id: string) => boolean;

  stockOut: StockOut[];
  addStockOut: (
    data: Omit<StockOut, "id" | "no" | "createdAt" | "productName" | "portionQty" | "totalPrice"> & {
      portionQty?: number;
      totalPrice?: number;
    },
  ) => boolean;
  deleteStockOut: (id: string) => void;

  stockOpname: StockOpname[];
  addStockOpname: (
    data: Omit<
      StockOpname,
      "id" | "no" | "createdAt" | "productName" | "systemQty" | "diff"
    >,
  ) => void;
  deleteStockOpname: (id: string) => void;

  stockConversions: StockConversion[];
  addStockConversion: (data: Omit<StockConversion, "id" | "no" | "createdAt" | "productName" | "inputCost" | "outputCost" | "outputSellValue">) => boolean;
  deleteStockConversion: (id: string) => boolean;

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
  flushData: () => Promise<void>;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  restoreAll: (data: Record<string, unknown>) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({
  children,
  initialRole = "owner",
}: {
  children: ReactNode;
  initialRole?: UserRole;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const hasSaveErrorRef = useRef(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState<Transaction[]>([]);
  const [expense, setExpense] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockIn, setStockIn] = useState<StockIn[]>([]);
  const [stockOut, setStockOut] = useState<StockOut[]>([]);
  const [stockOpname, setStockOpname] = useState<StockOpname[]>([]);
  const [stockConversions, setStockConversions] = useState<StockConversion[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(emptySettings);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);

  function snapshotData() {
    return {
      [STORAGE_KEYS.income]: income,
      [STORAGE_KEYS.expense]: expense,
      [STORAGE_KEYS.categories]: categories,
      [STORAGE_KEYS.products]: products,
      [STORAGE_KEYS.stockIn]: stockIn,
      [STORAGE_KEYS.stockOut]: stockOut,
      [STORAGE_KEYS.stockOpname]: stockOpname,
      [STORAGE_KEYS.stockConversions]: stockConversions,
      [STORAGE_KEYS.legacyStockCuts]: [],
      [STORAGE_KEYS.users]: users,
      [STORAGE_KEYS.settings]: settings,
      [STORAGE_KEYS.logs]: logs,
    };
  }

  useEffect(() => {
    let active = true;

    async function loadFromDatabase() {
      try {
        const response = await api.get<{ data: Record<string, unknown> | null }>("/data");
        let data = response.data.data;
        const legacyData = readLegacyData();

        if (legacyData) {
          const migrated = await api.post<{ data: Record<string, unknown> }>("/data/migrate", {
            data: legacyData,
          });
          data = migrated.data.data;
        } else if (!data) {
          const created = await api.put<{ data: Record<string, unknown> }>("/data", {
            data: initialData(),
          });
          data = created.data.data;
        }

        removeLegacyData();
        if (!active) return;

        applyData(data);
        setInitialized(true);
        setLoading(false);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Data tidak dapat dimuat dari database.",
        );
        setLoading(false);
      }
    }

    void loadFromDatabase();
    return () => {
      active = false;
    };
  }, []);

  function applyData(data: Record<string, unknown>) {
    setCategories((data[STORAGE_KEYS.categories] as Category[] | undefined) ?? []);
    setIncome((data[STORAGE_KEYS.income] as Transaction[] | undefined) ?? []);
    setExpense((data[STORAGE_KEYS.expense] as Transaction[] | undefined) ?? []);
    setProducts(((data[STORAGE_KEYS.products] as Product[] | undefined) ?? []).map((product) => {
      const convertedStock: Record<string, ConvertedStockBalance> = {};
      Object.values(product.convertedStock ?? {}).forEach((balance) => {
        convertedStock[convertedStockKey(balance.unit)] = balance;
      });

      if (product.portionEnabled && (product.portionStock ?? 0) > 0 && !convertedStock.potong) {
        convertedStock.potong = {
          unit: "potong",
          stock: product.portionStock ?? 0,
          costPrice: product.portionCostPrice ?? 0,
          sellPrice: product.sellPricePerPortion ?? 0,
        };
      }

      return {
        ...product,
        convertedStock,
        portionEnabled: product.portionEnabled ?? false,
        portionStock: product.portionStock ?? 0,
        portionsPerPack: product.portionsPerPack ?? 3,
        sellPricePerPortion: product.sellPricePerPortion ?? 0,
        sellPricePerPack: product.sellPricePerPack ?? 0,
        portionCostPrice: product.portionCostPrice ?? 0,
      };
    }));
    setStockIn((data[STORAGE_KEYS.stockIn] as StockIn[] | undefined) ?? []);
    setStockOut((data[STORAGE_KEYS.stockOut] as StockOut[] | undefined) ?? []);
    setStockOpname((data[STORAGE_KEYS.stockOpname] as StockOpname[] | undefined) ?? []);
    const conversions = (data[STORAGE_KEYS.stockConversions] as StockConversion[] | undefined) ?? [];
    const legacyCuts = (data[STORAGE_KEYS.legacyStockCuts] as Array<Record<string, unknown>> | undefined) ?? [];
    setStockConversions([
      ...conversions,
      ...legacyCuts.map((cut) => ({
        id: String(cut.id ?? generateId()),
        no: String(cut.no ?? ""),
        productId: String(cut.productId ?? ""),
        productName: String(cut.productName ?? ""),
        fromQty: Number(cut.rawQty ?? 0),
        fromUnit: String(cut.rawUnit ?? "kg"),
        toQty: Number(cut.portionQty ?? 0),
        toUnit: "potong",
        inputCost: Number(cut.inputCost ?? 0),
        outputCost: Number(cut.inputCost ?? 0),
        sellPrice: Number(
          ((data[STORAGE_KEYS.products] as Product[] | undefined) ?? [])
            .find((product) => product.id === cut.productId)?.sellPricePerPortion ?? 0,
        ),
        outputSellValue: 0,
        date: String(cut.date ?? ""),
        note: String(cut.note ?? ""),
        createdAt: String(cut.createdAt ?? new Date().toISOString()),
      })),
    ]);
    setUsers((data[STORAGE_KEYS.users] as AppUser[] | undefined) ?? []);
    setSettings((data[STORAGE_KEYS.settings] as BusinessSettings | undefined) ?? emptySettings());
    setLogs((data[STORAGE_KEYS.logs] as AuditLog[] | undefined) ?? []);
  }

  useEffect(() => {
    if (!initialized) return;

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await api.put("/data", { data: snapshotData() });
        hasSaveErrorRef.current = false;
      })
      .catch(() => {
        if (!hasSaveErrorRef.current) {
          toast("Gagal menyimpan perubahan ke database. Periksa koneksi lalu coba lagi.", "danger");
          hasSaveErrorRef.current = true;
        }
      });
  }, [
    initialized,
    categories,
    income,
    expense,
    products,
    stockIn,
    stockOut,
    stockOpname,
    stockConversions,
    users,
    settings,
    logs,
    toast,
  ]);

  async function flushData() {
    await saveQueueRef.current.catch(() => undefined);
    await api.put("/data", { data: snapshotData() });
    hasSaveErrorRef.current = false;
  }

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
      loadError,
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
            convertedStock: {},
            portionStock: 0,
            portionCostPrice: 0,
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
        if (!product || !Number.isFinite(data.qty) || data.qty <= 0 ||
          !Number.isFinite(data.totalCost) || data.totalCost <= 0) return false;
        const unitCost = data.totalCost / data.qty;
        const no = generateNo("SIN", stockIn.length + 1);
        const stockInId = generateId();
        setStockIn((prev) => [
          {
            ...data,
            id: stockInId,
            no,
            costPrice: unitCost,
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
                  costPrice: ((p.stock * p.costPrice) + data.totalCost) / (p.stock + data.qty),
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
            amount: data.totalCost,
            description: `Pembelian ${data.qty} ${product?.unit || "unit"} ${product?.name || "barang"} (${no})${data.note ? ` - ${data.note}` : ""}`,
            sourceType: "stock_in",
            sourceId: stockInId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Barang Masuk", no);
        return true;
      },
      deleteStockIn: (id) => {
        const item = stockIn.find((s) => s.id === id);
        const product = products.find((p) => p.id === item?.productId);
        if (
          !item ||
          !product ||
          product.stock < item.qty ||
          stockConversions.some((conversion) =>
            conversion.productId === item.productId &&
            normalizeUnit(conversion.fromUnit) === normalizeUnit(product.unit),
          ) ||
          stockOut.some((sale) =>
            sale.productId === item.productId &&
            normalizeUnit(sale.unit ?? product.unit) === normalizeUnit(product.unit),
          )
        ) return false;
        if (item)
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id !== item.productId) return p;
              const remainingStock = p.stock - item.qty;
              const remainingValue = Math.max(0, (p.stock * p.costPrice) - (item.qty * item.costPrice));
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
        return true;
      },

      stockOut,
      addStockOut: (data) => {
        const product = products.find((p) => p.id === data.productId);
        if (!product || !Number.isFinite(data.qty) || data.qty <= 0) return false;
        const saleUnit = data.unit ?? product.unit;
        const directBalance = getConvertedBalance(product, saleUnit);
        const legacyPackSale = product.portionEnabled &&
          ["pcs", "pack"].includes(normalizeUnit(saleUnit)) &&
          !directBalance;
        const legacyPortionQty = legacyPackSale
          ? data.qty * (product.portionsPerPack ?? 3)
          : 0;
        const saleBalance = legacyPackSale
          ? getConvertedBalance(product, "potong")
          : getConvertedBalance(product, saleUnit);
        const quantityFromStock = legacyPackSale ? legacyPortionQty : data.qty;
        if (
          !Number.isFinite(quantityFromStock) ||
          quantityFromStock <= 0 ||
          quantityFromStock > (saleBalance?.stock ?? 0)
        ) return false;
        const totalPrice = legacyPackSale
          ? (product.sellPricePerPack ?? 0) * data.qty
          : (saleBalance?.sellPrice ?? 0) * data.qty;
        if (!Number.isFinite(totalPrice) || totalPrice <= 0) return false;
        const portionQty = legacyPackSale
          ? legacyPortionQty
          : normalizeUnit(saleUnit) === "potong" ? data.qty : 0;
        const no = generateNo("SOUT", stockOut.length + 1);
        const stockOutId = generateId();
        setStockOut((prev) => [
          {
            ...data,
            unit: saleUnit,
            id: stockOutId,
            no,
            productName: product?.name || "-",
            portionQty,
            totalPrice,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== data.productId || !saleBalance) return p;
            if (normalizeUnit(saleBalance.unit) === normalizeUnit(p.unit)) {
              return { ...p, stock: p.stock - data.qty };
            }
            const key = convertedStockKey(saleBalance.unit);
            const nextBalance = { ...saleBalance, stock: saleBalance.stock - quantityFromStock };
            return {
              ...p,
              convertedStock: { ...p.convertedStock, [key]: nextBalance },
              portionStock: normalizeUnit(saleBalance.unit) === "potong" ? nextBalance.stock : p.portionStock,
            };
          }),
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
            amount: totalPrice,
            description: `Penjualan ${data.qty} ${saleUnit} ${product.name} (${no})`,
            sourceType: "stock_out",
            sourceId: stockOutId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        addLog("Tambah", "Barang Keluar", no);
        return true;
      },
      deleteStockOut: (id) => {
        const item = stockOut.find((s) => s.id === id);
        if (item)
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id !== item.productId) return p;
              const unit = item.unit ?? p.unit;
              const directBalance = getConvertedBalance(p, unit);
              const legacyPackSale = p.portionEnabled &&
                ["pcs", "pack"].includes(normalizeUnit(unit)) &&
                !directBalance;
              const balanceUnit = legacyPackSale ? "potong" : unit;
              const balance = getConvertedBalance(p, balanceUnit);
              const restoredQty = legacyPackSale
                ? item.portionQty ?? item.qty * (p.portionsPerPack ?? 3)
                : item.qty;
              if (!balance) return p;
              if (normalizeUnit(balance.unit) === normalizeUnit(p.unit)) {
                return { ...p, stock: p.stock + restoredQty };
              }
              const key = convertedStockKey(balance.unit);
              const nextBalance = { ...balance, stock: balance.stock + restoredQty };
              return {
                ...p,
                convertedStock: { ...p.convertedStock, [key]: nextBalance },
                portionStock: normalizeUnit(balance.unit) === "potong" ? nextBalance.stock : p.portionStock,
              };
            }),
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

      stockConversions,
      addStockConversion: (data) => {
        const product = products.find((item) => item.id === data.productId);
        if (
          !product ||
          !Number.isFinite(data.fromQty) ||
          !Number.isFinite(data.toQty) ||
          !Number.isFinite(data.sellPrice) ||
          data.fromQty <= 0 ||
          data.toQty <= 0 ||
          data.sellPrice <= 0 ||
          !data.fromUnit.trim() ||
          !data.toUnit.trim() ||
          normalizeUnit(data.fromUnit) === normalizeUnit(data.toUnit)
        ) return false;

        const source = getConvertedBalance(product, data.fromUnit);
        if (!source || source.stock < data.fromQty) return false;

        const existingOutput = getConvertedBalance(product, data.toUnit);
        const outputStock = existingOutput?.stock ?? 0;
        const totalOutputStock = outputStock + data.toQty;
        const inputCost = data.fromQty * source.costPrice;
        const outputCost = outputStock * (existingOutput?.costPrice ?? 0) + inputCost;
        const outputSellValue = outputStock * (existingOutput?.sellPrice ?? 0) + data.toQty * data.sellPrice;
        const output: ConvertedStockBalance = {
          unit: existingOutput?.unit ?? data.toUnit.trim(),
          stock: totalOutputStock,
          costPrice: outputCost / totalOutputStock,
          sellPrice: outputSellValue / totalOutputStock,
        };
        const no = generateNo("CONV", stockConversions.length + 1);
        const conversion: StockConversion = {
          ...data,
          fromUnit: source.unit,
          toUnit: output.unit,
          id: generateId(),
          no,
          productName: product.name,
          inputCost,
          outputCost: inputCost,
          outputSellValue: data.toQty * data.sellPrice,
          createdAt: new Date().toISOString(),
        };

        setProducts((prev) => prev.map((item) => {
          if (item.id !== product.id) return item;
          const convertedStock = { ...item.convertedStock };
          const outputIsBaseUnit = normalizeUnit(output.unit) === normalizeUnit(item.unit);
          if (outputIsBaseUnit) {
            return {
              ...item,
              stock: output.stock,
              costPrice: output.costPrice,
              sellPrice: output.sellPrice,
              convertedStock,
            };
          }
          if (normalizeUnit(source.unit) === normalizeUnit(item.unit)) {
            const remainingStock = item.stock - data.fromQty;
            return {
              ...item,
              stock: remainingStock,
              costPrice: remainingStock > 0 ? item.costPrice : 0,
              convertedStock: { ...convertedStock, [convertedStockKey(output.unit)]: output },
            };
          }

          const sourceKey = convertedStockKey(source.unit);
          const remainingStock = source.stock - data.fromQty;
          convertedStock[sourceKey] = {
            ...source,
            stock: remainingStock,
            costPrice: remainingStock > 0 ? source.costPrice : 0,
          };
          convertedStock[convertedStockKey(output.unit)] = output;
          return { ...item, convertedStock };
        }));
        setStockConversions((prev) => [conversion, ...prev]);
        addLog("Tambah", "Konversi", `${no}: ${data.fromQty} ${source.unit} menjadi ${data.toQty} ${output.unit}`);
        return true;
      },
      deleteStockConversion: (id) => {
        const conversion = stockConversions.find((item) => item.id === id);
        const product = products.find((item) => item.id === conversion?.productId);
        if (!conversion || !product) return false;
        if (
          stockOut.some((sale) =>
            sale.productId === product.id &&
            normalizeUnit(sale.unit ?? product.unit) === normalizeUnit(conversion.toUnit),
          ) ||
          stockConversions.some((next) =>
            next.id !== id &&
            next.productId === product.id &&
            normalizeUnit(next.fromUnit) === normalizeUnit(conversion.toUnit),
          )
        ) return false;

        const source = getConvertedBalance(product, conversion.fromUnit);
        const output = getConvertedBalance(product, conversion.toUnit);
        if (!source || !output || output.stock < conversion.toQty) return false;

        const remainingOutput = output.stock - conversion.toQty;
        const remainingOutputCost = Math.max(0, output.stock * output.costPrice - conversion.outputCost);
        const remainingOutputSellValue = Math.max(0, output.stock * output.sellPrice - conversion.outputSellValue);
        const restoredSourceStock = source.stock + conversion.fromQty;
        const restoredSource = {
          ...source,
          stock: restoredSourceStock,
          costPrice: (source.stock * source.costPrice + conversion.inputCost) / restoredSourceStock,
        };

        setProducts((prev) => prev.map((item) => {
          if (item.id !== product.id) return item;
          const convertedStock = { ...item.convertedStock };
          const outputIsBaseUnit = normalizeUnit(output.unit) === normalizeUnit(item.unit);
          const sourceIsBaseUnit = normalizeUnit(source.unit) === normalizeUnit(item.unit);
          let updatedProduct = item;
          if (!outputIsBaseUnit) {
            convertedStock[convertedStockKey(output.unit)] = {
              ...output,
              stock: remainingOutput,
              costPrice: remainingOutput > 0 ? remainingOutputCost / remainingOutput : 0,
              sellPrice: remainingOutput > 0 ? remainingOutputSellValue / remainingOutput : 0,
            };
          } else {
            updatedProduct = {
              ...updatedProduct,
              stock: remainingOutput,
              costPrice: remainingOutput > 0 ? remainingOutputCost / remainingOutput : 0,
              sellPrice: remainingOutput > 0 ? remainingOutputSellValue / remainingOutput : updatedProduct.sellPrice,
            };
          }
          if (sourceIsBaseUnit) {
            return {
              ...updatedProduct,
              stock: restoredSourceStock,
              costPrice: restoredSource.costPrice,
              convertedStock,
            };
          }
          convertedStock[convertedStockKey(source.unit)] = restoredSource;
          return { ...updatedProduct, convertedStock };
        }));
        setStockConversions((prev) => prev.filter((item) => item.id !== id));
        addLog("Hapus", "Konversi", conversion.no);
        return true;
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
      flushData,
      clearTransactionData: () => {
        setIncome([]);
        setExpense([]);
        setStockIn([]);
        setStockOut([]);
        setStockOpname([]);
        setStockConversions([]);
        setProducts((prev) =>
          prev.map((product) => ({
            ...product,
            stock: 0,
            convertedStock: Object.fromEntries(
              Object.entries(product.convertedStock ?? {}).map(([key, balance]) => [
                key,
                { ...balance, stock: 0, costPrice: 0 },
              ]),
            ),
            portionStock: 0,
            costPrice: 0,
            portionCostPrice: 0,
          })),
        );
        addLog("Hapus", "Backup & Data", "Seluruh data transaksi");
      },

      currentRole,
      setCurrentRole,

      restoreAll: async (data) => {
        await saveQueueRef.current.catch(() => undefined);
        const response = await api.put<{ data: Record<string, unknown> }>("/data", { data });
        applyData(response.data.data);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loading,
      loadError,
      categories,
      income,
      expense,
      products,
      stockIn,
      stockOut,
      stockOpname,
      stockConversions,
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
