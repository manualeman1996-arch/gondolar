import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics, lastNDays } from "@/lib/analytics";
import { StatCard, BarList } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";

export default async function AdminDashboardPage() {
  await requireProfile();
  const supabase = await createClient();
  const range = lastNDays(7);

  const [analytics, storesRes, campaignsRes] = await Promise.all([
    getAnalytics(supabase, range),
    supabase.from("stores").select("id, is_active"),
    supabase.from("campaigns").select("id, is_active"),
  ]);

  const activeStores = (storesRes.data ?? []).filter((s) => s.is_active).length;
  const activeCampaigns = (campaignsRes.data ?? []).filter((c) => c.is_active).length;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen de los últimos 7 días."
        action={
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Ver analytics <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Búsquedas (7d)"
          value={analytics.totalSearches}
          accent="brand"
        />
        <StatCard
          label="Sesiones únicas"
          value={analytics.uniqueSessions}
          hint="Anónimas"
        />
        <StatCard
          label="Tasa lo encontré"
          value={pct(analytics.foundRate)}
          accent="emerald"
          hint={`${analytics.foundCount} respuestas`}
        />
        <StatCard
          label="Tasa no lo encontré"
          value={pct(analytics.notFoundRate)}
          accent="orange"
          hint={`${analytics.notFoundCount} respuestas`}
        />
        <StatCard
          label="Búsquedas sin resultado"
          value={analytics.noResultCount}
          accent="orange"
        />
        <StatCard label="Campañas activas" value={activeCampaigns} accent="brand" />
        <StatCard label="Sucursales activas" value={activeStores} />
        <StatCard
          label="Feedback total"
          value={analytics.foundCount + analytics.notFoundCount}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Productos más buscados / vistos" items={analytics.topClickedProducts} />
        <BarList title="Productos con más “no lo encontré”" items={analytics.topNotFoundProducts} />
        <BarList title="Categorías con más fricción" items={analytics.topFrictionCategories} />
        <BarList title="Búsquedas sin resultado" items={analytics.noResultQueries} />
      </div>
    </div>
  );
}
