import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedbackSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const f = parsed.data;

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", f.storeId)
    .maybeSingle();
  if (!store) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  const { error } = await supabase.from("feedback_events").insert({
    retailer_id: store.retailer_id,
    store_id: store.id,
    product_id: f.productId,
    anonymous_session_id: f.sessionId,
    query: f.query ?? null,
    found: f.found,
    reason: f.reason ?? null,
  });
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
