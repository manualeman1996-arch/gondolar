"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { CheckCircle2, FileUp, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  importProducts,
  type ImportResult,
} from "@/app/admin/(dashboard)/products/import/actions";

const REQUIRED = ["store_slug", "product_name"];
const COLUMNS = [
  "store_slug",
  "product_name",
  "brand",
  "category",
  "tags",
  "aisle",
  "shelf",
  "side",
  "height",
  "zone",
  "instructions",
];

export function CsvImport() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setParseError(null);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const missing = REQUIRED.filter((c) => !headers.includes(c));
        if (missing.length) {
          setParseError(`Faltan columnas requeridas: ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        setRows(res.data);
      },
      error: () => setParseError("No se pudo leer el archivo."),
    });
  }

  async function run() {
    setImporting(true);
    try {
      const res = await importProducts(rows);
      setResult(res);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <FileUp className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <label className="cursor-pointer">
              <span className="font-medium text-brand-700 hover:underline">
                Elegí un archivo CSV
              </span>
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
            </label>
            {fileName && <p className="mt-1 text-sm text-slate-500">{fileName}</p>}
          </div>

          <p className="text-xs text-slate-500">
            Columnas: <code className="text-slate-700">{COLUMNS.join(", ")}</code>.
            Requeridas: <strong>store_slug</strong>, <strong>product_name</strong>.
          </p>
          <a href="/sample-products.csv" download>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" /> Descargar CSV de ejemplo
            </Button>
          </a>

          {parseError && (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" /> {parseError}
            </p>
          )}

          {rows.length > 0 && !result && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {rows.length} fila{rows.length === 1 ? "" : "s"} listas para importar.
              </p>
              <Button onClick={run} disabled={importing}>
                {importing ? "Importando…" : `Importar ${rows.length}`}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {rows.length > 0 && !result && (
        <Card>
          <CardBody>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Previsualización</h3>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="py-2 pr-3">Sucursal</th>
                    <th className="py-2 pr-3">Producto</th>
                    <th className="py-2 pr-3">Marca</th>
                    <th className="py-2 pr-3">Categoría</th>
                    <th className="py-2 pr-3">Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 12).map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-3">{String(r.store_slug ?? "")}</td>
                      <td className="py-2 pr-3">{String(r.product_name ?? "")}</td>
                      <td className="py-2 pr-3">{String(r.brand ?? "")}</td>
                      <td className="py-2 pr-3">{String(r.category ?? "")}</td>
                      <td className="py-2 pr-3 text-slate-500">
                        {[r.aisle, r.shelf, r.side].filter(Boolean).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 12 && (
                <p className="mt-2 text-xs text-slate-400">
                  … y {rows.length - 12} más.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card>
          <CardBody className="space-y-3">
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Importación completada
            </p>
            <div className="flex gap-6 text-sm">
              <span className="text-slate-700">
                <strong className="text-emerald-700">{result.created}</strong> creados
              </span>
              <span className="text-slate-700">
                <strong className="text-brand-700">{result.updated}</strong> actualizados
              </span>
              <span className="text-slate-700">
                <strong className="text-red-600">{result.errors.length}</strong> errores
              </span>
            </div>
            {result.errors.length > 0 && (
              <ul className="space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>
                    Fila {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" onClick={() => { setRows([]); setResult(null); setFileName(""); }}>
              Importar otro archivo
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
