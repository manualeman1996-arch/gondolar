"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRetailerId } from "@/lib/auth";
import { campaignSchema, parseTags } from "@/lib/validations";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export async function upsertCampaign(
  input: z.input<typeof campaignSchema> & { id?: string },
): Promise<ActionResult> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const retailerId = await getRetailerId();

  const row = {
    retailer_id: retailerId,
    name: d.name,
    brand: d.brand || null,
    store_id: d.store_id || null,
    category_id: d.category_id || null,
    product_id: d.product_id,
    keywords: parseTags(d.keywords),
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    budget: typeof d.budget === "number" ? d.budget : null,
    is_active: d.is_active,
  };

  if (input.id) {
    const { error } = await supabase.from("campaigns").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${input.id}`);
    return { ok: true, id: input.id };
  }

  const { data: created, error } = await supabase
    .from("campaigns")
    .insert(row)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/campaigns");
  return { ok: true, id: created.id };
}

export async function setCampaignActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/campaigns");
  return { ok: true };
}
