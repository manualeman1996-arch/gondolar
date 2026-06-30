import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Loads the authenticated admin's profile (with retailer scope). Redirects to
 * login when there is no session. Use at the top of protected server pages.
 */
export async function requireProfile(): Promise<{
  profile: Profile;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    // Authenticated but no profile row — treat as unprovisioned admin.
    redirect("/admin/login?error=no_profile");
  }

  return { profile: profile as Profile, userEmail: user.email ?? null };
}

/**
 * Returns the authenticated admin's retailer id (throws if unauthenticated).
 * Used by server actions to stamp `retailer_id` on inserts (RLS also enforces it).
 */
export async function getRetailerId(): Promise<string> {
  const { profile } = await requireProfile();
  if (!profile.retailer_id) {
    throw new Error("El usuario no está asociado a un retailer.");
  }
  return profile.retailer_id;
}
