import { createClient } from "@/lib/supabase/server";
import { getAnalytics, lastNDays } from "@/lib/analytics";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard, BarList } from "@/components/admin/stat-card";
import { AnalyticsFilters } from "@/components/admin/analytics-filters";
import {
  SearchesByDayChart,
  FeedbackByDayChart,
  FoundRatePie,
} from "@/components/admin/analytics-charts";
import type { Store } from "@/lib/types";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const fallback = lastNDays(30);
  const filters = {
    storeId: sp.storeId || undefined,
    from: sp.from || fallback.from,
    to: sp.to || fallback.to,
  };

  const [analytics, storesRes] = await Promise.all([
    getAnalytics(supabase, filters),
    supabase.from("stores").select("*").order("name"),
  ]);
  const stores = (storesRes.data ?? []) as Store[];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Intención de compra dentro de la tienda, basada en eventos anónimos."
      />

      <AnalyticsFilters stores={stores} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Búsquedas" value={analytics.totalSearches} accent="brand" />
        <StatCard label="Sesiones únicas" value={analytics.uniqueSessions} />
        <StatCard label="Tasa encontró" value={pct(analytics.foundRate)} accent="emerald" />
        <StatCard label="Sin resultado" value={analytics.noResultCount} accent="orange" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SearchesByDayChart data={analytics.searchesByDay} />
        <FoundRatePie found={analytics.foundCount} notFound={analytics.notFoundCount} />
        <FeedbackByDayChart data={analytics.feedbackByDay} />
        <BarList title="Top 10 búsquedas" items={analytics.topQueries} />
        <BarList title="Top 10 productos vistos" items={analytics.topClickedProducts} />
        <BarList title="Top 10 “no encontrados”" items={analytics.topNotFoundProducts} />
        <BarList title="Categorías con más fricción" items={analytics.topFrictionCategories} />
        <BarList title="Búsquedas sin resultado" items={analytics.noResultQueries} />
      </div>
    </div>
  );
}
