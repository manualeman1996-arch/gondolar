import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug } from "@/lib/stores";
import { searchStore } from "@/lib/search";
import { recordSearchEvent, recordCampaignEvent } from "@/lib/events";
import { searchInputSchema } from "@/lib/validations";
import { normalize } from "@/lib/text";

export async function POST(request: Request) {
  const parsed = searchInputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { storeSlug, query, sessionId } = parsed.data;

  const supabase = await createClient();
  const found = await getStoreBySlug(supabase, storeSlug);
  if (!found) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }
  const { store } = found;

  const outcome = await searchStore(supabase, store, query);

  // Record the (anonymous) search event.
  await recordSearchEvent(supabase, store, {
    sessionId,
    query,
    normalizedQuery: normalize(query),
    resultCount: outcome.resultCount,
  });

  // Record a sponsored impression when a campaign product was surfaced.
  if (outcome.sponsoredCampaign) {
    await recordCampaignEvent(supabase, store, {
      campaignId: outcome.sponsoredCampaign.id,
      productId: outcome.sponsoredCampaign.productId,
      sessionId,
      eventType: "impression",
      query,
    });
  }

  return NextResponse.json({
    results: outcome.results,
    resultCount: outcome.resultCount,
  });
}
