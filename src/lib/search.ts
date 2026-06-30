import type { SupabaseClient } from "@supabase/supabase-js";
import { normalize } from "@/lib/text";
import type {
  Campaign,
  ProductWithLocation,
  SearchProductsRow,
  SearchResultItem,
  Store,
} from "@/lib/types";

const PRODUCT_SELECT =
  "id, retailer_id, store_id, category_id, name, brand, sku, description, image_url, tags, is_active, created_at, updated_at, category:categories(id, name, slug), location:product_locations(*)";

function shapeProduct(row: Record<string, unknown>): ProductWithLocation {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const location = Array.isArray(row.location) ? row.location[0] : row.location;
  return {
    ...(row as unknown as ProductWithLocation),
    category: (category as ProductWithLocation["category"]) ?? null,
    location: (location as ProductWithLocation["location"]) ?? null,
  };
}

/** Returns true if any active campaign keyword matches the normalized query. */
function campaignMatchesQuery(campaign: Campaign, normalizedQuery: string): boolean {
  if (!normalizedQuery) return false;
  return (campaign.keywords ?? []).some((kw) => {
    const k = normalize(kw);
    return k.length > 0 && (normalizedQuery.includes(k) || k.includes(normalizedQuery));
  });
}

export interface SearchOutcome {
  results: SearchResultItem[];
  /** The campaign whose sponsored product was injected (for impression logging). */
  sponsoredCampaign: { id: string; productId: string } | null;
  resultCount: number;
}

/**
 * Core in-store search. Ranks products via the `search_products` SQL function,
 * then merges a sponsored product on top when an active campaign matches the
 * query (keyword) or a result's category. RLS keeps everything scoped to the
 * store's retailer.
 */
export async function searchStore(
  supabase: SupabaseClient,
  store: Store,
  rawQuery: string,
): Promise<SearchOutcome> {
  const normalizedQuery = normalize(rawQuery);

  // 1. Ranked organic matches (product ids + rank tiers) from Postgres.
  const { data: ranked, error: rankErr } = await supabase.rpc("search_products", {
    p_store_id: store.id,
    p_query: normalizedQuery,
  });
  if (rankErr) throw rankErr;

  const rows = (ranked ?? []) as SearchProductsRow[];
  const rankById = new Map(rows.map((r) => [r.product_id, r.rank]));
  const ids = rows.map((r) => r.product_id);

  // 2. Hydrate products (category + location) for the matched ids.
  let products: ProductWithLocation[] = [];
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", ids);
    if (error) throw error;
    products = (data ?? []).map(shapeProduct);
  }

  // 3. Active campaigns for this store (or global) that match the query.
  const { data: campaignRows } = await supabase
    .from("campaigns")
    .select("*")
    .eq("is_active", true)
    .or(`store_id.eq.${store.id},store_id.is.null`);
  const campaigns = (campaignRows ?? []) as Campaign[];

  const resultCategoryIds = new Set(
    products.map((p) => p.category_id).filter(Boolean) as string[],
  );

  const matchingCampaign =
    campaigns.find((c) => campaignMatchesQuery(c, normalizedQuery)) ??
    campaigns.find(
      (c) => c.category_id && resultCategoryIds.has(c.category_id),
    ) ??
    null;

  // 4. Assemble ordered results: organic first, sorted by rank then name.
  const organic: SearchResultItem[] = products
    .map((p) => ({
      ...p,
      rank: rankById.get(p.id) ?? 999,
      sponsored: false,
      campaign_id: null,
    }))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  let sponsoredCampaign: SearchOutcome["sponsoredCampaign"] = null;

  // 5. Inject the sponsored product on top (if not already present, fetch it).
  if (matchingCampaign) {
    sponsoredCampaign = {
      id: matchingCampaign.id,
      productId: matchingCampaign.product_id,
    };
    const existingIdx = organic.findIndex(
      (r) => r.id === matchingCampaign.product_id,
    );
    let sponsoredItem: SearchResultItem | null = null;

    if (existingIdx >= 0) {
      sponsoredItem = { ...organic[existingIdx] };
      organic.splice(existingIdx, 1);
    } else {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", matchingCampaign.product_id)
        .eq("store_id", store.id) // never inject a product from another store
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        sponsoredItem = {
          ...shapeProduct(data),
          rank: 0,
          sponsored: false,
          campaign_id: null,
        };
      }
    }

    if (sponsoredItem) {
      sponsoredItem.sponsored = true;
      sponsoredItem.campaign_id = matchingCampaign.id;
      sponsoredItem.rank = 0;
      organic.unshift(sponsoredItem);
    } else {
      // Sponsored product not visible (inactive/missing) — no impression.
      sponsoredCampaign = null;
    }
  }

  return {
    results: organic,
    sponsoredCampaign,
    // Organic result count (excludes a purely-injected sponsored product that
    // wasn't an organic match) — drives the "no results" / no-result event.
    resultCount: products.length,
  };
}
