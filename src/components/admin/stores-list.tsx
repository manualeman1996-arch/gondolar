"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { StoreForm } from "@/components/admin/store-form";
import { setStoreActive, deleteStore } from "@/app/admin/(dashboard)/stores/actions";
import { STORE_FORMAT_LABELS, type Store } from "@/lib/types";

export function StoresList({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function toggle(store: Store) {
    await setStoreActive(store.id, !store.is_active);
    router.refresh();
  }

  async function remove(store: Store) {
    if (!confirm(`¿Eliminar la sucursal "${store.name}"? Se borran sus productos.`)) return;
    await deleteStore(store.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Nueva sucursal</h3>
            <StoreForm onDone={() => setCreating(false)} />
          </CardBody>
        </Card>
      ) : (
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nueva sucursal
        </Button>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardBody className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{store.name}</p>
                  <Badge variant={store.is_active ? "success" : "neutral"}>
                    {store.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {STORE_FORMAT_LABELS[store.format]}
                  {store.city ? ` · ${store.city}` : ""}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">/s/{store.slug}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link href={`/admin/stores/${store.id}`}>
                  <Button size="sm" variant="outline">
                    <QrCode className="h-4 w-4" /> Ver / QR
                  </Button>
                </Link>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggle(store)}>
                    {store.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(store)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {stores.length === 0 && !creating && (
        <p className="text-sm text-slate-400">
          Todavía no tenés sucursales. Creá la primera.
        </p>
      )}
    </div>
  );
}
