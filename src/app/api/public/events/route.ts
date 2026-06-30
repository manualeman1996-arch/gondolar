import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordCampaignEvent, recordProductView } from "@/lib/events";
import { eventSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const e = parsed.data;

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", e.storeId)
    .maybeSingle();
  if (!store) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  if (e.eventType === "product_view" && e.productId) {
    await recordProductView(supabase, store, {
      productId: e.productId,
      sessionId: e.sessionId,
      query: e.query,
    });
  }

  if (e.eventType === "promo_click" && e.campaignId && e.productId) {
    await recordCampaignEvent(supabase, store, {
      campaignId: e.campaignId,
      productId: e.productId,
      sessionId: e.sessionId,
      eventType: "click",
      query: e.query,
    });
  }

  return NextResponse.json({ ok: true });
}
