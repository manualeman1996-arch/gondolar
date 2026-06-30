"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageX, SearchX } from "lucide-react";
import type { SearchResultItem } from "@/lib/types";
import { getAnonymousSessionId } from "@/lib/session";
import { ProductCard } from "@/components/shopper/product-card";

export function SearchResults({
  storeSlug,
  query,
}: {
  storeSlug: string;
  query: string;
}) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    fetch("/api/public/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug,
        query: trimmed,
        sessionId: getAnonymousSessionId(),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setResults(data.results ?? []);
      })
      .catch(() => active && setError("No se pudo buscar. Reintentá."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [storeSlug, query]);

  // Log a sponsored click when a promoted card is opened.
  const handleClick = useCallback(
    (item: SearchResultItem) => {
      if (!item.sponsored || !item.campaign_id) return;
      fetch("/api/public/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          storeId: item.store_id,
          sessionId: getAnonymousSessionId(),
          eventType: "promo_click",
          productId: item.id,
          campaignId: item.campaign_id,
          query,
        }),
      }).catch(() => {});
    },
    [query],
  );

  if (loading) {
    return (
      <div className="mt-4 flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center text-sm text-red-600">{error}</div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="mt-10 flex flex-col items-center text-center text-slate-400">
        <SearchX className="mb-2 h-8 w-8" />
        <p className="text-sm">Escribí qué producto estás buscando.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <PackageX className="mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">
          No encontramos “{query}”.
        </p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Probá con otro término (por ejemplo, la marca o la categoría) o
          consultá con un repositor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <p className="text-xs text-slate-400">
        {results.length} resultado{results.length === 1 ? "" : "s"}
      </p>
      {results.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          storeSlug={storeSlug}
          query={query}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
