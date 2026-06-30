"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Pencil, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { CampaignForm } from "@/components/admin/campaign-form";
import {
  setCampaignActive,
  deleteCampaign,
} from "@/app/admin/(dashboard)/campaigns/actions";
import type { Campaign, Category, Product, Store } from "@/lib/types";

export function CampaignsManager({
  stores,
  products,
  categories,
  campaigns,
}: {
  stores: Store[];
  products: (Product & { storeName?: string })[];
  categories: Category[];
  campaigns: Campaign[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const productLabel = (id: string) => {
    const p = products.find((x) => x.id === id);
    return p ? `${p.name}${p.brand ? ` · ${p.brand}` : ""}` : "—";
  };
  const storeLabel = (id: string | null) =>
    id ? stores.find((s) => s.id === id)?.name ?? "—" : "Todas las sucursales";

  async function toggle(c: Campaign) {
    await setCampaignActive(c.id, !c.is_active);
    router.refresh();
  }
  async function remove(c: Campaign) {
    if (!confirm(`¿Eliminar la campaña "${c.name}"?`)) return;
    await deleteCampaign(c.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!creating && (
        <Button onClick={() => setCreating(true)} disabled={products.length === 0}>
          <Plus className="h-4 w-4" /> Nueva campaña
        </Button>
      )}
      {products.length === 0 && (
        <p className="text-sm text-slate-400">Cargá productos antes de crear campañas.</p>
      )}

      {creating && (
        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Nueva campaña</h3>
            <CampaignForm
              stores={stores}
              products={products}
              categories={categories}
              onDone={() => setCreating(false)}
            />
          </CardBody>
        </Card>
      )}

      <div className="space-y-2.5">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <Badge variant={c.is_active ? "success" : "neutral"}>
                      {c.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {c.brand ? `${c.brand} · ` : ""}
                    {productLabel(c.product_id)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {storeLabel(c.store_id)} ·{" "}
                    {c.keywords.length ? c.keywords.join(", ") : "sin keywords"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link href={`/admin/campaigns/${c.id}`}>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4" /> Métricas
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(c)}>
                    {c.is_active ? "Pausar" : "Activar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {editingId === c.id && (
                <div className="border-t border-slate-100 pt-4">
                  <CampaignForm
                    stores={stores}
                    products={products}
                    categories={categories}
                    campaign={c}
                    onDone={() => setEditingId(null)}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && !creating && (
        <p className="text-sm text-slate-400">Todavía no hay campañas.</p>
      )}
    </div>
  );
}
