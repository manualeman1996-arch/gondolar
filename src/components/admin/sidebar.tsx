"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MapPin,
  MessageSquare,
  Menu,
  Package,
  Search,
  Store,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/stores", label: "Sucursales", icon: Store },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/campaigns", label: "Campañas", icon: Megaphone },
  { href: "/admin/searches", label: "Búsquedas", icon: Search },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({
  retailerName,
  userEmail,
}: {
  retailerName: string;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex items-center gap-3 px-2 py-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <MapPin className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">ShelfSearch</p>
        <p className="truncate text-xs text-slate-500">{retailerName}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-slate-100 pt-3">
      <p className="truncate px-2 text-xs text-slate-400">{userEmail}</p>
      <button
        onClick={signOut}
        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
      >
        <LogOut className="h-4.5 w-4.5" /> Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        {header}
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              {header}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="mt-auto">{footer}</div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-4 md:flex">
        {header}
        {nav}
        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}
