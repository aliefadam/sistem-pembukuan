export function formatCurrency(value: number): string {
  if (Number.isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(date: string | Date, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("id-ID", opts).format(d);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isNonOperatingIncomeTransaction(transaction: { categoryName: string }): boolean {
  return ["inisialisasi saldo awal", "modal pemilik"].includes(
    transaction.categoryName.trim().toLowerCase(),
  );
}

export function monthKey(date: string | Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function generateNo(prefix: string, sequence: number): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${prefix}/${y}${m}/${String(sequence).padStart(4, "0")}`;
}

export function isSameDay(date: string, target: string): boolean {
  return date === target;
}

export function isInMonth(date: string, key: string): boolean {
  return date.startsWith(key);
}

export function isInYear(date: string, year: string): boolean {
  return date.startsWith(year);
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function classNamesStatus(status: string): string {
  switch (status) {
    case "active":
    case "paid":
      return "success";
    case "inactive":
    case "unpaid":
      return "danger";
    default:
      return "neutral";
  }
}
