import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { Button, IconButton } from "./Basic";

/* -------------------------------- Modal -------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  mobileSheet = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  mobileSheet?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div className={cn("fixed inset-0 z-[100] flex justify-center", mobileSheet ? "items-end p-0 sm:items-center sm:p-4" : "items-center p-4")}>
      <div className={cn("absolute inset-0 bg-slate-900/40 backdrop-blur-sm", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (closing) {
            setMounted(false);
            setClosing(false);
          }
        }}
        className={cn(
          "relative flex max-h-[92dvh] min-w-0 w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[90dvh] dark:bg-slate-900",
          mobileSheet ? "rounded-t-2xl sm:rounded-2xl" : "rounded-2xl",
          closing
            ? mobileSheet ? "animate-slide-down sm:animate-scale-out" : "animate-scale-out"
            : mobileSheet ? "animate-slide-up sm:animate-scale-in" : "animate-scale-in",
          sizes[size],
        )}
      >
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-4 py-3.5 sm:px-5 dark:border-slate-800">
          <h3 className="min-w-0 text-base font-bold leading-snug text-slate-800 dark:text-slate-100">{title}</h3>
          <IconButton icon="fi fi-rr-cross-small" onClick={onClose} label="Tutup" />
        </div>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{children}</div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-4 py-3 [&>*]:w-full sm:flex-row sm:items-center sm:justify-end sm:px-5 sm:py-4 sm:[&>*]:w-auto dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------- Drawer -------------------------------- */

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (mounted) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className={cn("absolute inset-0 bg-slate-900/40 backdrop-blur-sm", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (closing) {
            setMounted(false);
            setClosing(false);
          }
        }}
        className={cn(
          "relative flex max-h-[92dvh] min-h-[40dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900",
          closing ? "animate-slide-down" : "animate-slide-up",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <IconButton icon="fi fi-rr-cross-small" onClick={onClose} label="Tutup" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------- Confirm Dialog --------------------------- */

interface ConfirmOptions {
  title: string;
  description?: string;
  tone?: "danger" | "primary";
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  function handle(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="animate-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => handle(false)} />
            <div role="alertdialog" aria-modal="true" className="animate-scale-in relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-slate-900">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl text-xl",
                  state.options.tone === "danger"
                    ? "bg-red-50 text-red-500 dark:bg-red-500/10"
                    : "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
                )}
              >
                <i className={state.options.tone === "danger" ? "fi fi-rr-trash" : "fi fi-rr-info"} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">{state.options.title}</h3>
              {state.options.description && (
                <p className="mt-1.5 break-words text-sm leading-relaxed text-slate-500 dark:text-slate-400">{state.options.description}</p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-2 [&>*]:w-full sm:flex-row sm:justify-end sm:[&>*]:w-auto">
                <Button variant="outline" onClick={() => handle(false)}>
                  {state.options.cancelLabel || "Batal"}
                </Button>
                <Button variant={state.options.tone === "danger" ? "danger" : "primary"} onClick={() => handle(true)}>
                  {state.options.confirmLabel || "Konfirmasi"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

/* --------------------------------- Toast --------------------------------- */

type ToastTone = "success" | "danger" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcons: Record<ToastTone, string> = {
  success: "fi fi-rr-check-circle",
  danger: "fi fi-rr-cross-circle",
  warning: "fi fi-rr-exclamation",
  info: "fi fi-rr-info",
};

const toastColors: Record<ToastTone, string> = {
  success: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  danger: "text-red-500 bg-red-50 dark:bg-red-500/10",
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
  info: "text-sky-500 bg-sky-50 dark:bg-sky-500/10",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[200] flex w-full max-w-xs flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="animate-toast-in flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30"
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", toastColors[item.tone])}>
                <i className={toastIcons[item.tone]} />
              </span>
              <p className="mt-1 flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{item.message}</p>
              <button
                onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
                className="mt-1 text-slate-400 hover:text-slate-600"
              >
                <i className="fi fi-rr-cross-small text-xs" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
