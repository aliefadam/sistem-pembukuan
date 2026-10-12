import React, {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useState,
} from "react";
import { cn } from "../../utils/cn";

/* ---------------------------- Button ---------------------------- */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/20 disabled:bg-blue-300",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  outline:
    "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 disabled:bg-red-300",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-sm px-5 py-3 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconPosition = "left",
  fullWidth,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    onClick?.(e);
  }

  return (
    <button
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-effect"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      {loading ? (
        <Spinner size={size === "sm" ? 14 : 16} className="text-current" />
      ) : (
        icon &&
        iconPosition === "left" && <i className={cn(icon, "text-[1.05em]")} />
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && (
        <i className={cn(icon, "text-[1.05em]")} />
      )}
    </button>
  );
}

/* -------------------------- Icon Button -------------------------- */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: "default" | "ghost" | "danger" | "primary";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  className,
  ...props
}: IconButtonProps) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-11 h-11 text-lg",
  };
  const variants = {
    default:
      "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
    ghost:
      "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
    danger:
      "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
  };
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      <i className={icon} />
    </button>
  );
}

/* ------------------------------ Spinner ------------------------------ */

export function Spinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-current border-t-transparent animate-spin-smooth",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingOverlay({
  show,
  label = "Memuat data...",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm animate-fade-in dark:bg-slate-900/70">
      <Spinner size={30} className="text-blue-600" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------ Input ------------------------------ */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  icon,
  hint,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i
            className={cn(
              icon,
              "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm",
            )}
          />
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500",
            icon && "pl-9",
            error &&
              "border-red-400 focus:border-red-500 focus:ring-red-500/10",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

/* --------------------------- Currency Input --------------------------- */

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  required = false,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const display = value ? new Intl.NumberFormat("id-ID").format(value) : "";
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
          Rp
        </span>
        <input
          required={required}
          aria-required={required}
          inputMode="numeric"
          value={display}
          placeholder={placeholder || "0"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            onChange(raw ? parseInt(raw, 10) : 0);
          }}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
            error &&
              "border-red-400 focus:border-red-500 focus:ring-red-500/10",
            focused && "ring-4 ring-blue-500/10",
          )}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

/* ----------------------------- Textarea ----------------------------- */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const areaId = id || label?.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={areaId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={3}
        className={cn(
          "w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
          error && "border-red-400",
          className,
        )}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}

/* ------------------------------- Badge ------------------------------- */

type BadgeTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "primary";

const badgeTones: Record<BadgeTone, string> = {
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  onRemove,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300",
      )}
    >
      {children}
      {onRemove && (
        <i
          className="fi fi-rr-cross-small text-[10px]"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </span>
  );
}

/* ------------------------------- Switch ------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
            checked && "translate-x-5",
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </label>
  );
}

/* ----------------------------- Checkbox ----------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150",
          checked
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 dark:border-slate-600",
        )}
      >
        {checked && <i className="fi fi-rr-check text-[10px]" />}
      </button>
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </label>
  );
}

/* ------------------------------- Radio ------------------------------- */

export function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-150",
          checked
            ? "border-blue-600"
            : "border-slate-300 dark:border-slate-600",
        )}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
      </button>
      {label && (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </label>
  );
}

/* -------------------------------- Card -------------------------------- */

export function Card({
  children,
  className,
  noPadding,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        !noPadding && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------- Statistic Card ---------------------------- */

export function StatisticCard({
  label,
  value,
  icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  tone?: BadgeTone;
  trend?: { value: string; positive: boolean };
}) {
  const iconTones: Record<BadgeTone, string> = {
    primary: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    success:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    warning:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <Card className="animate-fade-in-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-xl font-bold text-slate-800 dark:text-slate-50">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-semibold",
                trend.positive ? "text-emerald-500" : "text-red-500",
              )}
            >
              <i
                className={
                  trend.positive
                    ? "fi fi-rr-arrow-trend-up"
                    : "fi fi-rr-arrow-trend-down"
                }
              />
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg",
            iconTones[tone],
          )}
        >
          <i className={icon} />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Data Card ------------------------------ */

export function DataCard({
  title,
  subtitle,
  fields,
  actions,
  badge,
}: {
  title: string;
  subtitle?: string;
  fields: { label: string; value: ReactNode }[];
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-dashed border-slate-100 pt-3 dark:border-slate-800">
        {fields.map((f, i) => (
          <div key={i} className="min-w-0">
            <p className="text-[11px] font-medium text-slate-400">{f.label}</p>
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {f.value}
            </p>
          </div>
        ))}
      </div>
      {actions && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Skeleton ----------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-slate-200/60 dark:bg-slate-800",
        className,
      )}
    />
  );
}

/* ---------------------------- Empty State ---------------------------- */

export function EmptyState({
  icon = "fi fi-rr-inbox",
  title = "Belum ada data",
  description = "Data yang kamu cari belum tersedia saat ini.",
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl text-slate-300 dark:bg-slate-800 dark:text-slate-600">
        <i className={icon} />
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </p>
        <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Tooltip ------------------------------ */

export function Tooltip({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="animate-fade-in pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-700">
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
}

/* ------------------------------- Tabs ------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon?: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200",
            active === tab.key
              ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          {tab.icon && <i className={tab.icon} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Search Box ----------------------------- */

export function SearchBox({
  value,
  onChange,
  placeholder = "Cari data...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <i className="fi fi-rr-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <i className="fi fi-rr-cross-small text-xs" />
        </button>
      )}
    </div>
  );
}
