import type { SupabaseClient } from "@supabase/supabase-js";
import type { Store } from "@/lib/types";

/**
 * Server-side event writers. All inserts are anonymous (sessionId only, no PII)
 * and allowed for the `anon` role via RLS.
 */

export async function recordSearchEvent(
  supabase: SupabaseClient,
  store: Store,
  params: {
    sessionId: string;
    query: string;
    normalizedQuery: string;
    resultCount: number;
    clickedProductId?: string | null;
  },
) {
  await supabase.from("search_events").insert({
    retailer_id: store.retailer_id,
    store_id: store.id,
    anonymous_session_id: params.sessionId,
    query: params.query,
    normalized_query: params.normalizedQuery,
    result_count: params.resultCount,
    clicked_product_id: params.clickedProductId ?? null,
  });
}

export async function recordCampaignEvent(
  supabase: SupabaseClient,
  store: Store,
  params: {
    campaignId: string;
    productId: string;
    sessionId: string;
    eventType: "impression" | "click";
    query?: string;
  },
) {
  await supabase.from("campaign_events").insert({
    campaign_id: params.campaignId,
    retailer_id: store.retailer_id,
    store_id: store.id,
    product_id: params.productId,
    anonymous_session_id: params.sessionId,
    event_type: params.eventType,
    query: params.query ?? null,
  });
}

export async function recordProductView(
  supabase: SupabaseClient,
  store: Store,
  params: { productId: string; sessionId: string; query?: string },
) {
  await supabase.from("product_view_events").insert({
    retailer_id: store.retailer_id,
    store_id: store.id,
    product_id: params.productId,
    anonymous_session_id: params.sessionId,
    query: params.query ?? null,
  });
}
