export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  type: TransactionType;
  name: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  no: string;
  type: TransactionType;
  date: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  sourceType?: "stock_in" | "stock_out";
  sourceId?: string;
  createdAt: string;
}

export type ProductStatus = "active" | "inactive";

export interface ConvertedStockBalance {
  unit: string;
  stock: number;
  costPrice: number;
  sellPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  minStock: number;
  stock: number;
  convertedStock: Record<string, ConvertedStockBalance>;
  portionEnabled?: boolean;
  portionStock?: number;
  portionsPerPack?: number;
  sellPricePerPortion?: number;
  sellPricePerPack?: number;
  portionCostPrice?: number;
  status: ProductStatus;
  createdAt: string;
}

export interface StockIn {
  id: string;
  no: string;
  productId: string;
  productName: string;
  qty: number;
  costPrice: number;
  totalCost?: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface StockOut {
  id: string;
  no: string;
  productId: string;
  productName: string;
  qty: number;
  unit?: string;
  portionQty?: number;
  totalPrice?: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface StockConversion {
  id: string;
  no: string;
  productId: string;
  productName: string;
  fromQty: number;
  fromUnit: string;
  toQty: number;
  toUnit: string;
  inputCost: number;
  outputCost: number;
  sellPrice: number;
  outputSellValue: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface StockOpname {
  id: string;
  no: string;
  productId: string;
  productName: string;
  systemQty: number;
  actualQty: number;
  diff: number;
  note: string;
  date: string;
  createdAt: string;
}

export type UserRole = "owner" | "admin";
export type UserStatus = "active" | "inactive";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  detail: string;
}
