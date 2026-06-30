import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, shapeProduct } from "@/lib/stores";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsManager } from "@/components/admin/products-manager";
import type { Store } from "@/lib/types";

export default async function ProductsPage() {
  const supabase = await createClient();
  const [storesRes, productsRes] = await Promise.all([
    supabase.from("stores").select("*").order("name"),
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const stores = (storesRes.data ?? []) as Store[];
  const products = (productsRes.data ?? []).map(shapeProduct);

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Catálogo, ubicaciones y disponibilidad por sucursal."
      />
      <ProductsManager stores={stores} products={products} />
    </div>
  );
}
