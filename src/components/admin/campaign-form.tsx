"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Campaign, Category, Product, Store } from "@/lib/types";
import { upsertCampaign } from "@/app/admin/(dashboard)/campaigns/actions";

type FormValues = {
  name: string;
  brand: string;
  store_id: string;
  category_id: string;
  product_id: string;
  keywords: string;
  start_date: string;
  end_date: string;
  budget: string;
  is_active: boolean;
};

export function CampaignForm({
  stores,
  products,
  categories,
  campaign,
  onDone,
}: {
  stores: Store[];
  products: (Product & { storeName?: string })[];
  categories: Category[];
  campaign?: Campaign;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      name: campaign?.name ?? "",
      brand: campaign?.brand ?? "",
      store_id: campaign?.store_id ?? "",
      category_id: campaign?.category_id ?? "",
      product_id: campaign?.product_id ?? products[0]?.id ?? "",
      keywords: (campaign?.keywords ?? []).join(", "),
      start_date: campaign?.start_date ?? "",
      end_date: campaign?.end_date ?? "",
      budget: campaign?.budget != null ? String(campaign.budget) : "",
      is_active: campaign?.is_active ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await upsertCampaign({
      ...values,
      budget: values.budget ? Number(values.budget) : undefined,
      id: campaign?.id,
    });
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar.");
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Nombre de campaña</Label>
          <Input {...register("name", { required: true })} placeholder="Huggies Talle G" />
        </div>
        <div>
          <Label>Marca</Label>
          <Input {...register("brand")} placeholder="Huggies" />
        </div>
        <div>
          <Label>Sucursal</Label>
          <Select {...register("store_id")}>
            <option value="">Todas las sucursales</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Categoría objetivo (opcional)</Label>
          <Select {...register("category_id")}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Producto patrocinado</Label>
          <Select {...register("product_id", { required: true })}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.brand ? ` · ${p.brand}` : ""}
                {p.storeName ? ` (${p.storeName})` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Keywords objetivo</Label>
          <Input {...register("keywords")} placeholder="pañales, bebe, talle g, huggies" />
          <p className="mt-1 text-xs text-slate-400">Separadas por coma.</p>
        </div>
        <div>
          <Label>Fecha inicio</Label>
          <Input type="date" {...register("start_date")} />
        </div>
        <div>
          <Label>Fecha fin</Label>
          <Input type="date" {...register("end_date")} />
        </div>
        <div>
          <Label>Presupuesto (opcional)</Label>
          <Input type="number" step="0.01" {...register("budget")} placeholder="0.00" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
            Campaña activa
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={formState.isSubmitting || products.length === 0}>
          {formState.isSubmitting ? "Guardando…" : campaign ? "Guardar cambios" : "Crear campaña"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
