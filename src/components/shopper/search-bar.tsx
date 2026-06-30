"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({
  storeSlug,
  initialQuery = "",
  autoFocus = false,
}: {
  storeSlug: string;
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(`/s/${storeSlug}/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          inputMode="search"
          enterKeyHint="search"
          placeholder="Buscá yerba, pañales, leche sin lactosa…"
          className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          aria-label="Buscar productos"
        />
      </div>
      <Button type="submit" size="lg" className="shrink-0">
        Buscar
      </Button>
    </form>
  );
}
