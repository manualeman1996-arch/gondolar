"use client";

import Link from "next/link";
import { ChevronRight, ImageIcon, MapPin, Sparkles } from "lucide-react";
import type { SearchResultItem } from "@/lib/types";
import { locationSummary } from "@/lib/text";
import { Badge } from "@/components/ui/card";

export function ProductCard({
  item,
  storeSlug,
  query,
  onClick,
}: {
  item: SearchResultItem;
  storeSlug: string;
  query?: string;
  onClick?: (item: SearchResultItem) => void;
}) {
  const summary = item.location ? locationSummary(item.location) : "";
  const href = `/s/${storeSlug}/product/${item.id}${
    query ? `?q=${encodeURIComponent(query)}` : ""
  }`;

  return (
    <Link
      href={href}
      onClick={() => onClick?.(item)}
      className="group flex items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-7 w-7 text-slate-300" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          {item.sponsored && (
            <Badge variant="promo">
              <Sparkles className="h-3 w-3" /> Promocionado
            </Badge>
          )}
          {item.brand && (
            <span className="text-xs font-medium text-slate-500">{item.brand}</span>
          )}
        </div>
        <p className="truncate font-semibold text-slate-900">{item.name}</p>
        {item.category?.name && (
          <p className="text-xs text-slate-400">{item.category.name}</p>
        )}
        {summary && (
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-brand-700">
            <MapPin className="h-3.5 w-3.5" /> {summary}
          </p>
        )}
      </div>

      <ChevronRight className="self-center text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </Link>
  );
}
