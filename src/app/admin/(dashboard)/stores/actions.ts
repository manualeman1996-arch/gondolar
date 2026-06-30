"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRetailerId } from "@/lib/auth";
import { storeSchema } from "@/lib/validations";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export async function upsertStore(
  input: z.input<typeof storeSchema> & { id?: string },
): Promise<ActionResult> {
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const supabase = await createClient();
  const retailerId = await getRetailerId();

  const row = {
    retailer_id: retailerId,
    name: data.name,
    slug: data.slug,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    format: data.format,
    is_active: data.is_active,
  };

  if (input.id) {
    const { error } = await supabase.from("stores").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("stores")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      const msg = error.message.includes("duplicate")
        ? "Ese slug ya está en uso."
        : error.message;
      return { ok: false, error: msg };
    }
    revalidatePath("/admin/stores");
    return { ok: true, id: inserted.id };
  }

  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${input.id}`);
  return { ok: true, id: input.id };
}

export async function setStoreActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/stores");
  return { ok: true };
}

export async function deleteStore(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/stores");
  return { ok: true };
}
