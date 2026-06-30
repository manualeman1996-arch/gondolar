import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, shapeProduct } from "@/lib/stores";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, formatDate } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/card";
import { locationSummary } from "@/lib/text";
import { FEEDBACK_REASON_LABELS, type FeedbackReason } from "@/lib/types";

export default async function FeedbackPage() {
  const supabase = await createClient();

  const [feedbackRes, storesRes, productsRes] = await Promise.all([
    supabase
      .from("feedback_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("stores").select("id, name"),
    supabase.from("products").select(PRODUCT_SELECT).limit(1000),
  ]);

  const storeMap = new Map((storesRes.data ?? []).map((s) => [s.id, s.name]));
  const products = (productsRes.data ?? []).map(shapeProduct);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows = (feedbackRes.data ?? []).map((f) => {
    const product = productMap.get(f.product_id);
    const loc = product?.location ? locationSummary(product.location) : "—";
    return [
      formatDate(f.created_at),
      storeMap.get(f.store_id) ?? "—",
      <span key="p" className="font-medium text-slate-900">
        {product ? `${product.name}${product.brand ? ` · ${product.brand}` : ""}` : "—"}
      </span>,
      f.found ? (
        <Badge key="f" variant="success">
          Lo encontró
        </Badge>
      ) : (
        <Badge key="f" variant="warning">
          No lo encontró
        </Badge>
      ),
      f.reason ? FEEDBACK_REASON_LABELS[f.reason as FeedbackReason] : "—",
      f.query || "—",
      <span key="l" className="text-slate-500">
        {loc}
      </span>,
    ];
  });

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Respuestas “lo encontré / no lo encontré” de los shoppers."
      />
      <DataTable
        columns={["Fecha", "Sucursal", "Producto", "Resultado", "Motivo", "Query", "Ubicación"]}
        rows={rows}
      />
    </div>
  );
}
