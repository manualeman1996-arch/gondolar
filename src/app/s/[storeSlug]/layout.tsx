import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug } from "@/lib/stores";
import { STORE_FORMAT_LABELS } from "@/lib/types";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const supabase = await createClient();
  const found = await getStoreBySlug(supabase, storeSlug);
  if (!found) notFound();
  const { store, retailerName } = found;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 backdrop-blur">
        <Link href={`/s/${storeSlug}`} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900">
              {retailerName || "Tienda"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {store.name} · {STORE_FORMAT_LABELS[store.format]}
            </p>
          </div>
        </Link>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-100 px-4 py-5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Usamos datos anónimos de búsqueda para mejorar la experiencia dentro de
          la tienda. No pedimos ni guardamos datos personales.
        </p>
      </footer>
    </div>
  );
}
