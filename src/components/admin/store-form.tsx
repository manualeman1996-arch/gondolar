"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { slugify } from "@/lib/text";
import { STORE_FORMAT_LABELS, type Store, type StoreFormat } from "@/lib/types";
import { upsertStore } from "@/app/admin/(dashboard)/stores/actions";

type FormValues = {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  country: string;
  format: StoreFormat;
  is_active: boolean;
};

export function StoreForm({
  store,
  onDone,
}: {
  store?: Store;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    defaultValues: {
      name: store?.name ?? "",
      slug: store?.slug ?? "",
      address: store?.address ?? "",
      city: store?.city ?? "",
      state: store?.state ?? "",
      country: store?.country ?? "AR",
      format: store?.format ?? "supermercado",
      is_active: store?.is_active ?? true,
    },
  });

  const slug = watch("slug");

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await upsertStore({ ...values, id: store?.id });
    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar.");
      return;
    }
    router.refresh();
    if (onDone) onDone();
    else if (res.id) router.push(`/admin/stores/${res.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Nombre</Label>
          <Input
            {...register("name", { required: true })}
            onBlur={(e) => {
              if (!slug && e.target.value) setValue("slug", slugify(e.target.value));
            }}
            placeholder="Super Demo Palermo"
          />
        </div>
        <div>
          <Label>Slug (URL pública)</Label>
          <Input
            {...register("slug", { required: true })}
            onChange={(e) => setValue("slug", slugify(e.target.value))}
            placeholder="super-demo-palermo"
          />
          <p className="mt-1 text-xs text-slate-400">/s/{slug || "tu-slug"}</p>
        </div>
        <div>
          <Label>Dirección</Label>
          <Input {...register("address")} />
        </div>
        <div>
          <Label>Ciudad</Label>
          <Input {...register("city")} />
        </div>
        <div>
          <Label>Provincia / Estado</Label>
          <Input {...register("state")} />
        </div>
        <div>
          <Label>País</Label>
          <Input {...register("country")} />
        </div>
        <div>
          <Label>Formato</Label>
          <Select {...register("format")}>
            {Object.entries(STORE_FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
            Sucursal activa
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Guardando…" : store ? "Guardar cambios" : "Crear sucursal"}
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
