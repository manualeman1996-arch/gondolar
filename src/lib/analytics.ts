import type { SupabaseClient } from "@supabase/supabase-js";

export interface AnalyticsFilters {
  storeId?: string;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
}

export interface Counted {
  label: string;
  value: number;
  id?: string;
}

export interface Analytics {
  totalSearches: number;
  uniqueSessions: number;
  foundCount: number;
  notFoundCount: number;
  foundRate: number; // 0..1
  notFoundRate: number;
  noResultCount: number;
  topQueries: Counted[];
  noResultQueries: Counted[];
  topClickedProducts: Counted[];
  topNotFoundProducts: Counted[];
  topFrictionCategories: Counted[];
  searchesByDay: { day: string; count: number }[];
  feedbackByDay: { day: string; found: number; notFound: number }[];
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function topN(map: Map<string, { label: string; value: number; id?: string }>, n: number): Counted[] {
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, n);
}

/** Applies optional store + date-range filters to a Supabase query builder. */
function withFilters<T>(q: T, f: AnalyticsFilters): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = q;
  if (f.storeId) query = query.eq("store_id", f.storeId);
  if (f.from) query = query.gte("created_at", `${f.from}T00:00:00`);
  if (f.to) query = query.lte("created_at", `${f.to}T23:59:59`);
  return query as T;
}

export async function getAnalytics(
  supabase: SupabaseClient,
  filters: AnalyticsFilters = {},
): Promise<Analytics> {
  // Fetch raw events (RLS scopes them to the admin's retailer).
  const [searchRes, feedbackRes, viewRes, campaignRes, productsRes, categoriesRes] =
    await Promise.all([
      withFilters(
        supabase
          .from("search_events")
          .select("normalized_query, query, result_count, anonymous_session_id, clicked_product_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        filters,
      ),
      withFilters(
        supabase
          .from("feedback_events")
          .select("found, reason, product_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        filters,
      ),
      withFilters(
        supabase
          .from("product_view_events")
          .select("product_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        filters,
      ),
      withFilters(
        supabase
          .from("campaign_events")
          .select("event_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        filters,
      ),
      supabase.from("products").select("id, name, brand, category_id"),
      supabase.from("categories").select("id, name"),
    ]);

  const searches = (searchRes.data ?? []) as {
    normalized_query: string;
    query: string;
    result_count: number;
    anonymous_session_id: string;
    clicked_product_id: string | null;
    created_at: string;
  }[];
  const feedback = (feedbackRes.data ?? []) as {
    found: boolean;
    reason: string | null;
    product_id: string;
    created_at: string;
  }[];
  const views = (viewRes.data ?? []) as { product_id: string; created_at: string }[];
  const campaigns = (campaignRes.data ?? []) as {
    event_type: "impression" | "click";
    created_at: string;
  }[];

  const productMap = new Map(
    ((productsRes.data ?? []) as { id: string; name: string; brand: string | null; category_id: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );
  const categoryMap = new Map(
    ((categoriesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );

  // ── Core counts ──
  const totalSearches = searches.length;
  const uniqueSessions = new Set(searches.map((s) => s.anonymous_session_id)).size;
  const foundCount = feedback.filter((f) => f.found).length;
  const notFoundCount = feedback.filter((f) => !f.found).length;
  const totalFeedback = foundCount + notFoundCount;
  const noResultCount = searches.filter((s) => s.result_count === 0).length;

  // ── Top queries / no-result queries ──
  const queryMap = new Map<string, Counted>();
  const noResultMap = new Map<string, Counted>();
  for (const s of searches) {
    const key = (s.normalized_query || s.query || "").trim();
    if (!key) continue;
    const label = s.query || key;
    const entry = queryMap.get(key) ?? { label, value: 0 };
    entry.value += 1;
    queryMap.set(key, entry);
    if (s.result_count === 0) {
      const ne = noResultMap.get(key) ?? { label, value: 0 };
      ne.value += 1;
      noResultMap.set(key, ne);
    }
  }

  // ── Top clicked/viewed products ──
  const viewMap = new Map<string, Counted>();
  const tally = (productId: string | null) => {
    if (!productId) return;
    const p = productMap.get(productId);
    const label = p ? `${p.name}${p.brand ? ` · ${p.brand}` : ""}` : "Producto";
    const e = viewMap.get(productId) ?? { label, value: 0, id: productId };
    e.value += 1;
    viewMap.set(productId, e);
  };
  views.forEach((v) => tally(v.product_id));
  searches.forEach((s) => tally(s.clicked_product_id));

  // ── Top not-found products + friction categories ──
  const notFoundProductMap = new Map<string, Counted>();
  const frictionCategoryMap = new Map<string, Counted>();
  for (const f of feedback) {
    if (f.found) continue;
    const p = productMap.get(f.product_id);
    const label = p ? `${p.name}${p.brand ? ` · ${p.brand}` : ""}` : "Producto";
    const e = notFoundProductMap.get(f.product_id) ?? { label, value: 0, id: f.product_id };
    e.value += 1;
    notFoundProductMap.set(f.product_id, e);

    const catId = p?.category_id;
    if (catId) {
      const cLabel = categoryMap.get(catId) ?? "Categoría";
      const ce = frictionCategoryMap.get(catId) ?? { label: cLabel, value: 0, id: catId };
      ce.value += 1;
      frictionCategoryMap.set(catId, ce);
    }
  }

  // ── Time series ──
  const searchDayMap = new Map<string, number>();
  searches.forEach((s) => {
    const k = dayKey(s.created_at);
    searchDayMap.set(k, (searchDayMap.get(k) ?? 0) + 1);
  });
  const feedbackDayMap = new Map<string, { found: number; notFound: number }>();
  feedback.forEach((f) => {
    const k = dayKey(f.created_at);
    const e = feedbackDayMap.get(k) ?? { found: 0, notFound: 0 };
    if (f.found) e.found += 1;
    else e.notFound += 1;
    feedbackDayMap.set(k, e);
  });

  const searchesByDay = [...searchDayMap.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const feedbackByDay = [...feedbackDayMap.entries()]
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return {
    totalSearches,
    uniqueSessions,
    foundCount,
    notFoundCount,
    foundRate: totalFeedback ? foundCount / totalFeedback : 0,
    notFoundRate: totalFeedback ? notFoundCount / totalFeedback : 0,
    noResultCount,
    topQueries: topN(queryMap, 10),
    noResultQueries: topN(noResultMap, 10),
    topClickedProducts: topN(viewMap, 10),
    topNotFoundProducts: topN(notFoundProductMap, 10),
    topFrictionCategories: topN(frictionCategoryMap, 10),
    searchesByDay,
    feedbackByDay,
  };
}

/** Default range: last N days (inclusive of today), as ISO date strings. */
export function lastNDays(n: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (n - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
