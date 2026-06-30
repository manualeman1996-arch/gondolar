import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StoresList } from "@/components/admin/stores-list";
import type { Store } from "@/lib/types";

export default async function StoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Administrá tus locales y su QR público."
      />
      <StoresList stores={(data ?? []) as Store[]} />
    </div>
  );
}
