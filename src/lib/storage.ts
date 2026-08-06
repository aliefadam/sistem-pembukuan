export const STORAGE_KEYS = {
  income: "bookkeeping_income",
  expense: "bookkeeping_expense",
  categories: "bookkeeping_categories",
  products: "bookkeeping_products",
  stockIn: "bookkeeping_stock_in",
  stockOut: "bookkeeping_stock_out",
  stockOpname: "bookkeeping_stock_opname",
  employees: "bookkeeping_employees",
  payroll: "bookkeeping_payroll",
  users: "bookkeeping_users",
  settings: "bookkeeping_settings",
  logs: "bookkeeping_logs",
  theme: "bookkeeping_theme",
} as const;

export function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function exportAllData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  Object.values(STORAGE_KEYS).forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  });
  return data;
}

export function restoreAllData(data: Record<string, unknown>): void {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}
