import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({ label, value, onChange, options, placeholder = "Pilih...", error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm outline-none transition-all duration-200 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
            open && "border-blue-500 ring-4 ring-blue-500/10",
            error && "border-red-400",
          )}
        >
          <span className={cn("flex items-center gap-2 truncate", !selected && "text-slate-400")}>
            {selected?.icon && <i className={selected.icon} />}
            {selected ? selected.label : placeholder}
          </span>
          <i className={cn("fi fi-rr-angle-small-down text-sm text-slate-400 transition-transform duration-200", open && "rotate-180")} />
        </button>
        {open && (
          <div className="animate-scale-in absolute z-30 mt-1.5 max-h-56 w-full origin-top overflow-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
            {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Tidak ada opsi</p>}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                  opt.value === value
                    ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60",
                )}
              >
                {opt.icon && <i className={opt.icon} />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
}

interface MultiSelectProps {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function MultiSelect({ label, values, onChange, options, placeholder = "Pilih..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm outline-none transition-all duration-200 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800/60"
        >
          {values.length === 0 && <span className="px-0.5 text-slate-400">{placeholder}</span>}
          {values.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span key={v} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                {opt?.label || v}
              </span>
            );
          })}
        </button>
        {open && (
          <div className="animate-scale-in absolute z-30 mt-1.5 max-h-56 w-full origin-top overflow-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150",
                  values.includes(opt.value)
                    ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60",
                )}
              >
                {opt.label}
                {values.includes(opt.value) && <i className="fi fi-rr-check text-xs" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DropdownItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

export function Dropdown({ trigger, items }: { trigger: React.ReactNode; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className="animate-scale-in absolute right-0 z-30 mt-1.5 w-44 origin-top-right overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150",
                item.danger
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60",
              )}
            >
              {item.icon && <i className={item.icon} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
