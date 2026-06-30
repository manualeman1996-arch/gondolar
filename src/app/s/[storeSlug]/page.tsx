import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getStoreBySlug,
  getStoreCategories,
  getFeaturedProducts,
} from "@/lib/stores";
import { SearchBar } from "@/components/shopper/search-bar";
import { ProductCard } from "@/components/shopper/product-card";
import type { SearchResultItem } from "@/lib/types";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const supabase = await createClient();
  const found = await getStoreBySlug(supabase, storeSlug);
  if (!found) notFound();
  const { store } = found;

  const [categories, featured] = await Promise.all([
    getStoreCategories(supabase, store.id, store.retailer_id),
    getFeaturedProducts(supabase, store, 6),
  ]);

  const featuredItems: SearchResultItem[] = featured.map((p) => ({
    ...p,
    rank: 0,
    sponsored: false,
    campaign_id: null,
  }));

  return (
    <main className="px-4 pb-8 pt-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        ¿Qué estás buscando?
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Encontrá productos más rápido dentro de esta tienda.
      </p>

      <div className="mt-4">
        <SearchBar storeSlug={storeSlug} autoFocus />
      </div>

      {categories.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Tag className="h-4 w-4 text-brand-500" /> Categorías populares
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/s/${storeSlug}/search?q=${encodeURIComponent(c.name)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredItems.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-amber-500" /> Destacados
          </h2>
          <div className="flex flex-col gap-2.5">
            {featuredItems.map((item) => (
              <ProductCard key={item.id} item={item} storeSlug={storeSlug} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
