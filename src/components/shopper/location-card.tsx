import { MapPin, Navigation } from "lucide-react";
import type { ProductLocation } from "@/lib/types";
import { locationSummary } from "@/lib/text";

export function LocationCard({ location }: { location?: ProductLocation | null }) {
  if (!location) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Ubicación no disponible. Consultá con un repositor.
      </div>
    );
  }

  const summary = locationSummary(location);

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Ubicación
          </p>
          <p className="text-lg font-semibold leading-tight text-slate-900">
            {summary || location.zone || "Consultá en góndola"}
          </p>
          {location.zone && summary && (
            <p className="text-sm text-slate-600">Zona: {location.zone}</p>
          )}
        </div>
      </div>
      {location.instructions && (
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          {location.instructions}
        </p>
      )}
    </div>
  );
}
