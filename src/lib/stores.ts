import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ProductWithLocation, Store } from "@/lib/types";

const PRODUCT_SELECT =
  "id, retailer_id, store_id, category_id, name, brand, sku, description, image_url, tags, is_active, created_at, updated_at, category:categories(id, name, slug), location:product_locations(*)";

export function shapeProduct(row: Record<string, unknown>): ProductWithLocation {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const location = Array.isArray(row.location) ? row.location[0] : row.location;
  return {
    ...(row as unknown as ProductWithLocation),
    category: (category as ProductWithLocation["category"]) ?? null,
    location: (location as ProductWithLocation["location"]) ?? null,
  };
}

export { PRODUCT_SELECT };

export async function getStoreBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ store: Store; retailerName: string } | null> {
  const { data } = await supabase
    .from("stores")
    .select("*, retailer:retailers(name)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  const raw = (data as { retailer?: { name?: string } | { name?: string }[] })
    .retailer;
  const retailerObj = Array.isArray(raw) ? raw[0] : raw;
  const retailerName = retailerObj?.name ?? "";
  return { store: data as Store, retailerName };
}

export async function getProductById(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
): Promise<ProductWithLocation | null> {
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();
  return data ? shapeProduct(data) : null;
}

export async function getStoreCategories(
  supabase: SupabaseClient,
  storeId: string,
  retailerId: string,
): Promise<Category[]> {
  // Only categories that actually have active products in this store.
  const { data: products } = await supabase
    .from("products")
    .select("category_id")
    .eq("store_id", storeId)
    .eq("is_active", true);
  const ids = Array.from(
    new Set(
      (products ?? [])
        .map((p) => (p as { category_id: string | null }).category_id)
        .filter(Boolean) as string[],
    ),
  );
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("categories")
    .select("*")
    .in("id", ids)
    .order("name");
  return (data ?? []) as Category[];
}

export async function getRelatedProducts(
  supabase: SupabaseClient,
  product: ProductWithLocation,
  limit = 4,
): Promise<ProductWithLocation[]> {
  if (!product.category_id) return [];
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", product.store_id)
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(limit);
  return (data ?? []).map(shapeProduct);
}

export async function getFeaturedProducts(
  supabase: SupabaseClient,
  store: { id: string },
  limit = 6,
): Promise<ProductWithLocation[]> {
  // Featured = products referenced by an active campaign for this store, then
  // fall back to recent products.
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("product_id")
    .eq("is_active", true)
    .or(`store_id.eq.${store.id},store_id.is.null`);
  const sponsoredIds = (campaigns ?? [])
    .map((c) => (c as { product_id: string }).product_id)
    .filter(Boolean);

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", store.id)
    .eq("is_active", true)
    .limit(limit);
  const products = (data ?? []).map(shapeProduct);
  // Put sponsored products first.
  return products.sort((a, b) => {
    const as = sponsoredIds.includes(a.id) ? 0 : 1;
    const bs = sponsoredIds.includes(b.id) ? 0 : 1;
    return as - bs;
  });
}
