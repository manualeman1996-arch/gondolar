"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { ProductWithLocation, Store } from "@/lib/types";
import { upsertProduct } from "@/app/admin/(dashboard)/products/actions";

type FormValues = {
  store_id: string;
  name: string;
  brand: string;
  category_name: string;
  sku: string;
  description: string;
  image_url: string;
  tags: string;
  is_active: boolean;
  aisle: string;
  shelf: string;
  side: string;
  height: string;
  zone: string;
  instructions: string;
};

export function ProductForm({
  stores,
  product,
  onDone,
}: {
  stores: Store[];
  product?: ProductWithLocation;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      store_id: product?.store_id ?? stores[0]?.id ?? "",
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      category_name: product?.category?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      image_url: product?.image_url ?? "",
      tags: (product?.tags ?? []).join(", "),
      is_active: product?.is_active ?? true,
      aisle: product?.location?.aisle ?? "",
      shelf: product?.location?.shelf ?? "",
      side: product?.location?.side ?? "",
      height: product?.location?.height ?? "",
      zone: product?.location?.zone ?? "",
      instructions: product?.location?.instructions ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await upsertProduct({ ...values, id: product?.id });
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar.");
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Sucursal</Label>
          <Select {...register("store_id", { required: true })}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Nombre</Label>
          <Input {...register("name", { required: true })} placeholder="Playadito Suave 1kg" />
        </div>
        <div>
          <Label>Marca</Label>
          <Input {...register("brand")} placeholder="Playadito" />
        </div>
        <div>
          <Label>Categoría</Label>
          <Input {...register("category_name")} placeholder="Yerba" />
          <p className="mt-1 text-xs text-slate-400">Se crea automáticamente si no existe.</p>
        </div>
        <div>
          <Label>SKU interno (opcional)</Label>
          <Input {...register("sku")} />
        </div>
        <div className="sm:col-span-2">
          <Label>Tags / palabras clave</Label>
          <Input {...register("tags")} placeholder="yerba, suave, mate" />
          <p className="mt-1 text-xs text-slate-400">Separadas por coma.</p>
        </div>
        <div className="sm:col-span-2">
          <Label>Descripción (opcional)</Label>
          <Textarea {...register("description")} rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Label>URL de imagen (opcional)</Label>
          <Input {...register("image_url")} placeholder="https://…" />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-800">Ubicación</h4>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <Label>Pasillo</Label>
            <Input {...register("aisle")} placeholder="4" />
          </div>
          <div>
            <Label>Góndola</Label>
            <Input {...register("shelf")} placeholder="A" />
          </div>
          <div>
            <Label>Lado</Label>
            <Input {...register("side")} placeholder="derecha" />
          </div>
          <div>
            <Label>Altura</Label>
            <Input {...register("height")} placeholder="media" />
          </div>
          <div>
            <Label>Zona</Label>
            <Input {...register("zone")} placeholder="Almacén" />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <Label>Instrucciones</Label>
            <Input {...register("instructions")} placeholder="Pasillo 4, primera góndola" />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
        Producto activo
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
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
