import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "emerald" | "orange" | "slate";
}) {
  const accents = {
    brand: "text-brand-700",
    emerald: "text-emerald-700",
    orange: "text-orange-600",
    slate: "text-slate-900",
  };
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className={cn("mt-1 text-2xl font-bold", accents[accent ?? "slate"])}>
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export function BarList({
  title,
  items,
  empty = "Sin datos todavía",
  unit,
}: {
  title: string;
  items: { label: string; value: number; id?: string }[];
  empty?: string;
  unit?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
        {items.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">{empty}</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item, i) => (
              <li key={item.id ?? item.label + i}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{item.label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {item.value}
                    {unit ? ` ${unit}` : ""}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
