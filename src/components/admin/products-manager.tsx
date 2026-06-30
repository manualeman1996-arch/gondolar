"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { ProductForm } from "@/components/admin/product-form";
import { locationSummary } from "@/lib/text";
import { setProductActive, deleteProduct } from "@/app/admin/(dashboard)/products/actions";
import type { ProductWithLocation, Store } from "@/lib/types";

export function ProductsManager({
  stores,
  products,
}: {
  stores: Store[];
  products: ProductWithLocation[];
}) {
  const router = useRouter();
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      storeFilter === "all"
        ? products
        : products.filter((p) => p.store_id === storeFilter),
    [products, storeFilter],
  );

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? "—";

  async function toggle(p: ProductWithLocation) {
    await setProductActive(p.id, !p.is_active);
    router.refresh();
  }
  async function remove(p: ProductWithLocation) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    await deleteProduct(p.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {!creating && (
          <Button onClick={() => setCreating(true)} disabled={stores.length === 0}>
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        )}
        <Link href="/admin/products/import">
          <Button variant="outline">
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
        </Link>
        <div className="ml-auto w-48">
          <Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            <option value="all">Todas las sucursales</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {stores.length === 0 && (
        <p className="text-sm text-slate-400">
          Creá una sucursal antes de cargar productos.
        </p>
      )}

      {creating && (
        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Nuevo producto</h3>
            <ProductForm stores={stores} onDone={() => setCreating(false)} />
          </CardBody>
        </Card>
      )}

      <div className="space-y-2.5">
        {filtered.map((p) => {
          const summary = p.location ? locationSummary(p.location) : "";
          return (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      {!p.is_active && <Badge variant="neutral">Inactivo</Badge>}
                      {p.category?.name && <Badge variant="brand">{p.category.name}</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">
                      {p.brand || "—"} · {storeName(p.store_id)}
                    </p>
                    {summary && <p className="mt-0.5 text-xs text-brand-700">{summary}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(p)}>
                      {p.is_active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {editingId === p.id && (
                  <div className="border-t border-slate-100 pt-4">
                    <ProductForm
                      stores={stores}
                      product={p}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && stores.length > 0 && !creating && (
        <p className="text-sm text-slate-400">No hay productos para mostrar.</p>
      )}
    </div>
  );
}
