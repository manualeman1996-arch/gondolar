import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreBySlug, getStoreCategories } from "@/lib/stores";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const found = await getStoreBySlug(supabase, slug);
  if (!found) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }
  const categories = await getStoreCategories(
    supabase,
    found.store.id,
    found.store.retailer_id,
  );
  return NextResponse.json({
    store: found.store,
    retailerName: found.retailerName,
    categories,
  });
}
