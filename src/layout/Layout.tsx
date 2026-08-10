import { ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import { Dropdown, IconButton } from "../components/ui";

interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  children?: { label: string; path: string; icon: string }[];
}

const MENU: MenuItem[] = [
  { label: "Dashboard", icon: "fi fi-rr-dashboard", path: "/" },
  {
    label: "Pembukuan",
    icon: "fi fi-rr-book",
    children: [
      { label: "Pemasukan", path: "/pembukuan/pemasukan", icon: "fi fi-rr-arrow-small-down" },
      { label: "Pengeluaran", path: "/pembukuan/pengeluaran", icon: "fi fi-rr-arrow-small-up" },
      { label: "Kategori", path: "/pembukuan/kategori", icon: "fi fi-rr-apps" },
    ],
  },
  {
    label: "Stok",
    icon: "fi fi-rr-box",
    children: [
      { label: "Barang", path: "/stok/barang", icon: "fi fi-rr-shopping-basket" },
      { label: "Barang Masuk", path: "/stok/barang-masuk", icon: "fi fi-rr-down-from-bracket" },
      { label: "Barang Keluar", path: "/stok/barang-keluar", icon: "fi fi-rr-up-from-bracket" },
      { label: "Stock Opname", path: "/stok/stock-opname", icon: "fi fi-rr-list-check" },
    ],
  },
  {
    label: "Laporan",
    icon: "fi fi-rr-chart-histogram",
    children: [
      { label: "Pemasukan", path: "/laporan/pemasukan", icon: "fi fi-rr-arrow-small-down" },
      { label: "Pengeluaran", path: "/laporan/pengeluaran", icon: "fi fi-rr-arrow-small-up" },
      { label: "Cash Flow", path: "/laporan/cash-flow", icon: "fi fi-rr-chart-line-up" },
      { label: "Ringkasan Laba", path: "/laporan/laba", icon: "fi fi-rr-sack-dollar" },
      { label: "Stok", path: "/laporan/stok", icon: "fi fi-rr-boxes" },
    ],
  },
  {
    label: "Pengaturan",
    icon: "fi fi-rr-settings",
    children: [
      { label: "Profil Usaha", path: "/pengaturan/profil", icon: "fi fi-rr-building" },
      { label: "Pengguna", path: "/pengaturan/pengguna", icon: "fi fi-rr-user-gear" },
      { label: "Role Permission", path: "/pengaturan/role", icon: "fi fi-rr-shield-check" },
      { label: "Backup & Data", path: "/pengaturan/backup", icon: "fi fi-rr-cloud-upload" },
      { label: "Audit Log", path: "/pengaturan/audit-log", icon: "fi fi-rr-time-past" },
    ],
  },
];

const SEARCHABLE_MENU = MENU.flatMap((item) =>
  item.children
    ? item.children.map((child) => ({ ...child, group: item.label }))
    : item.path ? [{ label: item.label, path: item.path, icon: item.icon, group: "Utama" }] : [],
);

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useData();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    MENU.find((m) => m.children?.some((c) => location.pathname.startsWith(c.path)))?.label ?? null,
  );

  useEffect(() => {
    const activeGroup = MENU.find((m) => m.children?.some((c) => location.pathname.startsWith(c.path)));
    if (activeGroup) setOpenGroup(activeGroup.label);
  }, [location.pathname]);

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-600/30">
          <i className="fi fi-rr-briefcase" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{settings.businessName}</p>
          <p className="text-xs text-slate-400">Pembukuan Usaha</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {MENU.map((item) => {
          if (!item.children) {
            return (
              <NavLink
                key={item.label}
                to={item.path!}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )
                }
              >
                <i className={cn(item.icon, "text-base")} />
                {item.label}
              </NavLink>
            );
          }
          const open = openGroup === item.label;
          const activeGroup = item.children.some((c) => location.pathname.startsWith(c.path));
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                  activeGroup ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                <span className="flex items-center gap-3">
                  <i className={cn(item.icon, "text-base")} />
                  {item.label}
                </span>
                <i className={cn("fi fi-rr-angle-small-down text-xs transition-transform duration-200", open && "rotate-180")} />
              </button>
              <div
                className={cn(
                  "grid overflow-hidden transition-all duration-300 ease-in-out",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-100 pl-4 dark:border-slate-800">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                          )
                        }
                      >
                        <i className={cn(child.icon, "text-sm")} />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function findPageTitle(pathname: string): string {
  for (const item of MENU) {
    if (item.path === pathname) return item.label;
    if (item.children) {
      const found = item.children.find((c) => c.path === pathname);
      if (found) return found.label;
    }
  }
  return "Dashboard";
}

export function MainLayout({ children }: { children: ReactNode }) {
  const { dark, toggle } = useTheme();
  const { currentRole, settings } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const menuResults = useMemo(() => {
    const query = menuQuery.trim().toLowerCase();
    if (!query) return SEARCHABLE_MENU;
    return SEARCHABLE_MENU.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(query));
  }, [menuQuery]);

  function openMenuSearch() {
    setMenuQuery("");
    setMenuSearchOpen(true);
  }

  function selectMenu(path: string) {
    setMenuSearchOpen(false);
    navigate(path);
  }

  function openMobileDrawer() {
    setMobileClosing(false);
    setMobileOpen(true);
  }

  function closeMobileDrawer() {
    if (mobileOpen) setMobileClosing(true);
  }

  useEffect(() => {
    if (mobileOpen) setMobileClosing(true);
    // Drawer is removed after its slide-down animation finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!menuSearchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuSearchOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className={cn("absolute inset-0 bg-slate-900/50 backdrop-blur-sm", mobileClosing ? "animate-fade-out" : "animate-fade-in")} onClick={closeMobileDrawer} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            onAnimationEnd={(event) => {
              if (event.target !== event.currentTarget) return;
              if (mobileClosing) {
                setMobileOpen(false);
                setMobileClosing(false);
              }
            }}
            className={cn(
              "absolute left-0 top-0 h-full w-72 overflow-hidden bg-white shadow-2xl dark:bg-slate-900",
              mobileClosing ? "animate-slide-out-left" : "animate-slide-in-left",
            )}
          >
            <SidebarContent onNavigate={closeMobileDrawer} />
          </div>
        </div>
      )}

      {menuSearchOpen && (
        <div className="fixed inset-0 z-[100]">
          <button className="animate-fade-in absolute inset-0 h-full w-full bg-slate-900/35 backdrop-blur-sm" onClick={() => setMenuSearchOpen(false)} aria-label="Tutup pencarian menu" />
          <div role="dialog" aria-modal="true" aria-label="Cari menu" className="animate-fade-in-up absolute left-4 right-4 top-20 mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:top-24">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
              <i className="fi fi-rr-search text-slate-400" />
              <input
                autoFocus
                value={menuQuery}
                onChange={(event) => setMenuQuery(event.target.value)}
                placeholder="Cari halaman atau menu..."
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
              <button onClick={() => setMenuSearchOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" aria-label="Tutup">
                <i className="fi fi-rr-cross-small" />
              </button>
            </div>
            <div className="max-h-[min(60dvh,28rem)] overflow-y-auto p-2">
              {menuResults.length > 0 ? menuResults.map((item) => (
                <button key={item.path} onClick={() => selectMenu(item.path)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-500/15 dark:group-hover:text-blue-400">
                    <i className={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                    <span className="block text-xs text-slate-400">{item.group}</span>
                  </span>
                  <i className="fi fi-rr-angle-small-right text-xs text-slate-300 group-hover:text-blue-500" />
                </button>
              )) : (
                <div className="px-4 py-10 text-center">
                  <i className="fi fi-rr-search mb-2 text-xl text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">Menu tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/80 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <IconButton icon="fi fi-rr-menu-burger" onClick={openMobileDrawer} label="Menu" className="lg:hidden" />
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">{findPageTitle(location.pathname)}</h1>
              <p className="hidden text-xs text-slate-400 sm:block">{settings.businessName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={openMenuSearch} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-100 px-2.5 text-slate-600 transition-all duration-200 hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:px-3" aria-label="Cari menu">
              <i className="fi fi-rr-search" />
              <span className="hidden text-sm font-semibold sm:inline">Cari menu</span>
            </button>
            <IconButton icon={dark ? "fi fi-rr-brightness" : "fi fi-rr-moon"} onClick={toggle} label="Ubah tema" />
            <Dropdown
              trigger={
                <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                  {currentRole === "owner" ? "O" : "A"}
                </div>
              }
              items={[
                { label: "Profil Usaha", icon: "fi fi-rr-building", onClick: () => (window.location.hash = "#/pengaturan/profil") },
                { label: "Audit Log", icon: "fi fi-rr-time-past", onClick: () => (window.location.hash = "#/pengaturan/audit-log") },
              ]}
            />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
          <div key={location.pathname} className="animate-fade-in-up mx-auto min-w-0 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
