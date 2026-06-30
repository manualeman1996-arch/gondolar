import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, formatDate } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/card";

export default async function SearchesPage() {
  const supabase = await createClient();

  const [searchRes, storesRes, productsRes, feedbackRes] = await Promise.all([
    supabase
      .from("search_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("stores").select("id, name"),
    supabase.from("products").select("id, name, brand"),
    supabase
      .from("feedback_events")
      .select("anonymous_session_id, product_id, found")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const storeMap = new Map((storesRes.data ?? []).map((s) => [s.id, s.name]));
  const productMap = new Map(
    (productsRes.data ?? []).map((p) => [
      p.id,
      `${p.name}${p.brand ? ` · ${p.brand}` : ""}`,
    ]),
  );
  // session+product -> found (latest wins; rows already desc).
  const feedbackMap = new Map<string, boolean>();
  for (const f of feedbackRes.data ?? []) {
    const key = `${f.anonymous_session_id}:${f.product_id}`;
    if (!feedbackMap.has(key)) feedbackMap.set(key, f.found);
  }

  const searches = searchRes.data ?? [];

  const rows = searches.map((s) => {
    let outcome: React.ReactNode = <span className="text-slate-300">—</span>;
    if (s.clicked_product_id) {
      const key = `${s.anonymous_session_id}:${s.clicked_product_id}`;
      if (feedbackMap.has(key)) {
        outcome = feedbackMap.get(key) ? (
          <Badge variant="success">Lo encontró</Badge>
        ) : (
          <Badge variant="warning">No lo encontró</Badge>
        );
      }
    }
    return [
      formatDate(s.created_at),
      storeMap.get(s.store_id) ?? "—",
      <span key="q" className="font-medium text-slate-900">
        {s.query || <em className="text-slate-400">(vacío)</em>}
      </span>,
      s.result_count === 0 ? (
        <Badge key="r" variant="danger">
          0 resultados
        </Badge>
      ) : (
        s.result_count
      ),
      s.clicked_product_id ? productMap.get(s.clicked_product_id) ?? "—" : "—",
      outcome,
    ];
  });

  return (
    <div>
      <PageHeader
        title="Búsquedas"
        description="Últimas 200 búsquedas de shoppers (anónimas)."
      />
      <DataTable
        columns={["Fecha", "Sucursal", "Query", "Resultados", "Producto clickeado", "Resultado"]}
        rows={rows}
      />
    </div>
  );
}
