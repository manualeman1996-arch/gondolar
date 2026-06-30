import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { CampaignsManager } from "@/components/admin/campaigns-manager";
import type { Campaign, Category, Product, Store } from "@/lib/types";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const [storesRes, productsRes, categoriesRes, campaignsRes] = await Promise.all([
    supabase.from("stores").select("*").order("name"),
    supabase
      .from("products")
      .select("*, store:stores(name)")
      .eq("is_active", true)
      .order("name")
      .limit(1000),
    supabase.from("categories").select("*").order("name"),
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
  ]);

  const stores = (storesRes.data ?? []) as Store[];
  const products = ((productsRes.data ?? []) as (Product & { store?: { name?: string } | { name?: string }[] })[]).map(
    (p) => {
      const store = Array.isArray(p.store) ? p.store[0] : p.store;
      return { ...p, storeName: store?.name };
    },
  );
  const categories = (categoriesRes.data ?? []) as Category[];
  const campaigns = (campaignsRes.data ?? []) as Campaign[];

  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Retail media dentro del local: productos patrocinados en la búsqueda."
      />
      <CampaignsManager
        stores={stores}
        products={products}
        categories={categories}
        campaigns={campaigns}
      />
    </div>
  );
}
