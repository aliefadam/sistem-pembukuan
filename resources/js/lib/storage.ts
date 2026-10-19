export const STORAGE_KEYS = {
  income: "bookkeeping_income",
  expense: "bookkeeping_expense",
  categories: "bookkeeping_categories",
  products: "bookkeeping_products",
  stockIn: "bookkeeping_stock_in",
  stockOut: "bookkeeping_stock_out",
  stockOpname: "bookkeeping_stock_opname",
  stockConversions: "bookkeeping_stock_conversions",
  legacyStockCuts: "bookkeeping_stock_cuts",
  users: "bookkeeping_users",
  settings: "bookkeeping_settings",
  logs: "bookkeeping_logs",
} as const;

export function readLegacyData(): Record<string, unknown> | null {
  const data: Record<string, unknown> = {};
  Object.values(STORAGE_KEYS).forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;

    try {
      data[key] = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(`Data lama "${key}" tidak dapat dibaca. Unduh backup JSON sebelum mencoba lagi.`);
    }
  });

  return Object.keys(data).length > 0 ? data : null;
}

export function removeLegacyData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  [
    "bookkeeping_theme",
    "bookkeeping_production",
    "bookkeeping_employees",
    "bookkeeping_payroll",
    "bookkeeping_legacy_demo_cleanup_v1",
  ].forEach((key) => localStorage.removeItem(key));
}
