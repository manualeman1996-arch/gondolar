"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRetailerId } from "@/lib/auth";
import { productSchema, parseTags } from "@/lib/validations";
import { slugify } from "@/lib/text";

export type ActionResult = { ok: boolean; error?: string; id?: string };

/** Finds (or creates) a category for the retailer by name. Returns its id. */
export async function resolveCategoryId(
  supabase: SupabaseClient,
  retailerId: string,
  name?: string | null,
): Promise<string | null> {
  const clean = (name ?? "").trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("retailer_id", retailerId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("categories")
    .insert({ retailer_id: retailerId, name: clean, slug })
    .select("id")
    .single();
  if (error) {
    // Race / conflict — re-read.
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("retailer_id", retailerId)
      .eq("slug", slug)
      .maybeSingle();
    return data?.id ?? null;
  }
  return created.id;
}

export async function upsertProduct(
  input: z.input<typeof productSchema> & { id?: string },
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const retailerId = await getRetailerId();

  const categoryId = await resolveCategoryId(supabase, retailerId, d.category_name);

  const productRow = {
    retailer_id: retailerId,
    store_id: d.store_id,
    category_id: categoryId,
    name: d.name,
    brand: d.brand || null,
    sku: d.sku || null,
    description: d.description || null,
    image_url: d.image_url || null,
    tags: parseTags(d.tags),
    is_active: d.is_active,
  };

  let productId = input.id;

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(productRow)
      .eq("id", productId);
    if (error) return { ok: false, error: error.message };
  } else {
    // Upsert by natural key (store + name + brand).
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", d.store_id)
      .ilike("name", d.name)
      .ilike("brand", d.brand || "")
      .maybeSingle();
    if (existing) {
      productId = existing.id;
      const { error } = await supabase
        .from("products")
        .update(productRow)
        .eq("id", productId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert(productRow)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      productId = created.id;
    }
  }

  // Location (one row per product).
  const locationRow = {
    product_id: productId,
    store_id: d.store_id,
    aisle: d.aisle || null,
    shelf: d.shelf || null,
    side: d.side || null,
    height: d.height || null,
    zone: d.zone || null,
    instructions: d.instructions || null,
  };
  const { error: locErr } = await supabase
    .from("product_locations")
    .upsert(locationRow, { onConflict: "product_id" });
  if (locErr) return { ok: false, error: locErr.message };

  revalidatePath("/admin/products");
  return { ok: true, id: productId };
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true };
}
