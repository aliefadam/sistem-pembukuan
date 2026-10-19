import { ConvertedStockBalance, Product } from "./types";

export function normalizeUnit(unit: string): string {
  return unit.trim().toLocaleLowerCase("id-ID");
}

export function getConvertedBalance(
  product: Product,
  unit: string,
): ConvertedStockBalance | null {
  if (normalizeUnit(product.unit) === normalizeUnit(unit)) {
    return {
      unit: product.unit,
      stock: product.stock,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
    };
  }

  const balances = Object.values(product.convertedStock ?? {});
  return balances.find((balance) => normalizeUnit(balance.unit) === normalizeUnit(unit)) ?? null;
}

export function getProductUnits(product: Product, availableOnly = true): ConvertedStockBalance[] {
  const balances: ConvertedStockBalance[] = [{
    unit: product.unit,
    stock: product.stock,
    costPrice: product.costPrice,
    sellPrice: product.sellPrice,
  }];

  Object.values(product.convertedStock ?? {}).forEach((balance) => {
    if (!balances.some((existing) => normalizeUnit(existing.unit) === normalizeUnit(balance.unit))) {
      balances.push(balance);
    }
  });

  if (product.portionEnabled && product.portionStock && !balances.some((balance) => normalizeUnit(balance.unit) === "potong")) {
    balances.push({
      unit: "potong",
      stock: product.portionStock,
      costPrice: product.portionCostPrice ?? 0,
      sellPrice: product.sellPricePerPortion ?? 0,
    });
  }

  return availableOnly ? balances.filter((balance) => balance.stock > 0) : balances;
}

export function convertedStockKey(unit: string): string {
  return normalizeUnit(unit);
}
