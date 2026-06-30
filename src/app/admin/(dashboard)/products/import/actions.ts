"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRetailerId } from "@/lib/auth";
import { csvRowSchema, parseTags } from "@/lib/validations";
import { resolveCategoryId } from "@/app/admin/(dashboard)/products/actions";

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export async function importProducts(
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const supabase = await createClient();
  const retailerId = await getRetailerId();

  // Map the retailer's stores by slug (RLS-scoped).
  const { data: stores } = await supabase.from("stores").select("id, slug");
  const storeBySlug = new Map(
    (stores ?? []).map((s) => [s.slug as string, s.id as string]),
  );

  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const lineNo = i + 2; // account for header row in the file
    const parsed = csvRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({
        row: lineNo,
        message: parsed.error.errors[0]?.message ?? "Fila inválida",
      });
      continue;
    }
    const r = parsed.data;
    const storeId = storeBySlug.get(r.store_slug.trim());
    if (!storeId) {
      result.errors.push({
        row: lineNo,
        message: `Sucursal "${r.store_slug}" no encontrada`,
      });
      continue;
    }

    const categoryId = await resolveCategoryId(supabase, retailerId, r.category);

    const productRow = {
      retailer_id: retailerId,
      store_id: storeId,
      category_id: categoryId,
      name: r.product_name.trim(),
      brand: r.brand?.trim() || null,
      tags: parseTags(r.tags),
      is_active: true,
    };

    // Upsert by natural key (store + name + brand).
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .ilike("name", r.product_name.trim())
      .ilike("brand", r.brand?.trim() || "")
      .maybeSingle();

    let productId: string;
    if (existing) {
      const { error } = await supabase
        .from("products")
        .update(productRow)
        .eq("id", existing.id);
      if (error) {
        result.errors.push({ row: lineNo, message: error.message });
        continue;
      }
      productId = existing.id;
      result.updated += 1;
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert(productRow)
        .select("id")
        .single();
      if (error) {
        result.errors.push({ row: lineNo, message: error.message });
        continue;
      }
      productId = created.id;
      result.created += 1;
    }

    const { error: locErr } = await supabase.from("product_locations").upsert(
      {
        product_id: productId,
        store_id: storeId,
        aisle: r.aisle?.trim() || null,
        shelf: r.shelf?.trim() || null,
        side: r.side?.trim() || null,
        height: r.height?.trim() || null,
        zone: r.zone?.trim() || null,
        instructions: r.instructions?.trim() || null,
      },
      { onConflict: "product_id" },
    );
    if (locErr) {
      result.errors.push({ row: lineNo, message: locErr.message });
    }
  }

  revalidatePath("/admin/products");
  return result;
}
