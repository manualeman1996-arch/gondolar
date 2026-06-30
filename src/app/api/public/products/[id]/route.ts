import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, shapeProduct } from "@/lib/stores";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ product: shapeProduct(data) });
}
