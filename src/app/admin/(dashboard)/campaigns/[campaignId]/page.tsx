import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard, BarList } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import type { Campaign } from "@/lib/types";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaignData } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaignData) notFound();
  const campaign = campaignData as Campaign;

  const [eventsRes, storesRes, productRes] = await Promise.all([
    supabase
      .from("campaign_events")
      .select("event_type, store_id, query, created_at")
      .eq("campaign_id", campaignId)
      .limit(5000),
    supabase.from("stores").select("id, name"),
    supabase
      .from("products")
      .select("name, brand")
      .eq("id", campaign.product_id)
      .maybeSingle(),
  ]);

  const events = (eventsRes.data ?? []) as {
    event_type: "impression" | "click";
    store_id: string;
    query: string | null;
  }[];
  const storeMap = new Map((storesRes.data ?? []).map((s) => [s.id, s.name]));

  const impressions = events.filter((e) => e.event_type === "impression").length;
  const clicks = events.filter((e) => e.event_type === "click").length;
  const ctr = impressions ? clicks / impressions : 0;

  // Associated searches (top queries that triggered the campaign).
  const queryMap = new Map<string, { label: string; value: number }>();
  for (const e of events) {
    const q = (e.query ?? "").trim();
    if (!q) continue;
    const entry = queryMap.get(q) ?? { label: q, value: 0 };
    entry.value += 1;
    queryMap.set(q, entry);
  }
  const topQueries = [...queryMap.values()].sort((a, b) => b.value - a.value).slice(0, 10);

  // Stores with most interaction.
  const storeInteraction = new Map<string, { label: string; value: number }>();
  for (const e of events) {
    const label = storeMap.get(e.store_id) ?? "—";
    const entry = storeInteraction.get(e.store_id) ?? { label, value: 0 };
    entry.value += 1;
    storeInteraction.set(e.store_id, entry);
  }
  const topStores = [...storeInteraction.values()].sort((a, b) => b.value - a.value);

  const product = productRes.data as { name: string; brand: string | null } | null;

  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Campañas
      </Link>
      <PageHeader
        title={campaign.name}
        description={`${campaign.brand ?? ""}${
          product ? ` · ${product.name}${product.brand ? ` · ${product.brand}` : ""}` : ""
        }`}
        action={
          <Badge variant={campaign.is_active ? "success" : "neutral"}>
            {campaign.is_active ? "Activa" : "Inactiva"}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Impresiones" value={impressions} accent="brand" />
        <StatCard label="Clicks" value={clicks} accent="emerald" />
        <StatCard label="CTR" value={`${Math.round(ctr * 100)}%`} accent="orange" />
        <StatCard label="Keywords" value={campaign.keywords.length} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList
          title="Búsquedas asociadas"
          items={topQueries}
          empty="Todavía no hay búsquedas que activen esta campaña."
        />
        <BarList
          title="Sucursales con más interacción"
          items={topStores}
          empty="Sin interacción aún."
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Keywords objetivo</h3>
        <div className="flex flex-wrap gap-2">
          {campaign.keywords.length ? (
            campaign.keywords.map((k) => (
              <Badge key={k} variant="brand">
                {k}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-slate-400">Sin keywords configuradas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
