import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { CsvImport } from "@/components/admin/csv-import";

export default function ImportPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Productos
      </Link>
      <PageHeader
        title="Importar productos (CSV)"
        description="Cargá o actualizá tu catálogo en lote. Se actualizan por sucursal + nombre + marca."
      />
      <CsvImport />
    </div>
  );
}
