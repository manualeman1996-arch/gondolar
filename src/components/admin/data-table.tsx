import { Card } from "@/components/ui/card";

export function DataTable({
  columns,
  rows,
  empty = "Sin registros todavía.",
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-top text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </Card>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
