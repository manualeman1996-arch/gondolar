"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label, Select, Input } from "@/components/ui/input";
import type { Store } from "@/lib/types";

export function AnalyticsFilters({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/analytics?${next.toString()}`);
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <Label>Sucursal</Label>
        <Select
          value={params.get("storeId") ?? ""}
          onChange={(e) => update("storeId", e.target.value)}
        >
          <option value="">Todas</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Desde</Label>
        <Input
          type="date"
          value={params.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
        />
      </div>
      <div>
        <Label>Hasta</Label>
        <Input
          type="date"
          value={params.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </div>
    </div>
  );
}
