import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";

// Super admin is intentionally minimal for the MVP: the data model + RLS
// (`is_super_admin()`, `profiles.role`) are in place; this screen is a stub.
export default async function SuperAdminPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  if (profile.role !== "super_admin") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-orange-500" />
        <h1 className="text-xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="mt-2 text-sm text-slate-500">
          Esta área es solo para super administradores internos. Tu rol actual es{" "}
          <code className="rounded bg-slate-100 px-1">{profile.role}</code>.
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-brand-700 hover:underline">
          Volver al panel
        </Link>
      </main>
    );
  }

  // Super admin can see global aggregates (RLS allows via is_super_admin()).
  const [retailersRes, storesRes, productsRes, searchesRes] = await Promise.all([
    supabase.from("retailers").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("search_events").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Super Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Métricas globales agregadas.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Retailers" value={retailersRes.count ?? 0} accent="brand" />
        <StatCard label="Sucursales" value={storesRes.count ?? 0} />
        <StatCard label="Productos" value={productsRes.count ?? 0} />
        <StatCard label="Búsquedas" value={searchesRes.count ?? 0} accent="emerald" />
      </div>
      <Card className="mt-6">
        <CardBody>
          <p className="text-sm text-slate-500">
            Gestión de retailers y usuarios admin: modelo y RLS preparados
            (`profiles.role = super_admin`). Las pantallas de creación se
            implementan en una próxima iteración.
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
