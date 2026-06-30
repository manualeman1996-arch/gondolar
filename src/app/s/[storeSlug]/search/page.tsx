import { SearchBar } from "@/components/shopper/search-bar";
import { SearchResults } from "@/components/shopper/search-results";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { storeSlug } = await params;
  const { q } = await searchParams;
  const query = q ?? "";

  return (
    <main className="px-4 pb-8 pt-5">
      <SearchBar storeSlug={storeSlug} initialQuery={query} />
      <SearchResults storeSlug={storeSlug} query={query} />
    </main>
  );
}
