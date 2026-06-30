import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getStoreBySlug,
  getProductById,
  getRelatedProducts,
} from "@/lib/stores";
import { LocationCard } from "@/components/shopper/location-card";
import { ProductCard } from "@/components/shopper/product-card";
import { FeedbackPanel } from "@/components/shopper/feedback-panel";
import { RecordView } from "@/components/shopper/record-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import type { SearchResultItem } from "@/lib/types";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { storeSlug, productId } = await params;
  const { q } = await searchParams;
  const supabase = await createClient();
  const found = await getStoreBySlug(supabase, storeSlug);
  if (!found) notFound();
  const { store } = found;

  const product = await getProductById(supabase, store.id, productId);
  if (!product) notFound();

  const related = await getRelatedProducts(supabase, product, 4);
  const relatedItems: SearchResultItem[] = related.map((p) => ({
    ...p,
    rank: 0,
    sponsored: false,
    campaign_id: null,
  }));

  const backHref = q
    ? `/s/${storeSlug}/search?q=${encodeURIComponent(q)}`
    : `/s/${storeSlug}`;

  return (
    <main className="px-4 pb-10 pt-4">
      <RecordView storeId={store.id} productId={product.id} query={q} />

      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-9 w-9 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          {product.brand && (
            <p className="text-sm font-medium text-slate-500">{product.brand}</p>
          )}
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            {product.name}
          </h1>
          {product.category?.name && (
            <Badge variant="brand" className="mt-2">
              {product.category.name}
            </Badge>
          )}
        </div>
      </div>

      {product.description && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {product.description}
        </p>
      )}

      <div className="mt-5">
        <LocationCard location={product.location} />
      </div>

      <div className="mt-5">
        <FeedbackPanel storeId={store.id} productId={product.id} query={q} />
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Productos relacionados
          </h2>
          <div className="flex flex-col gap-2.5">
            {relatedItems.map((item) => (
              <ProductCard key={item.id} item={item} storeSlug={storeSlug} query={q} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-7">
        <Link href={`/s/${storeSlug}`}>
          <Button variant="outline" size="lg" className="w-full">
            <Search className="h-5 w-5" /> Buscar otro producto
          </Button>
        </Link>
      </div>
    </main>
  );
}
