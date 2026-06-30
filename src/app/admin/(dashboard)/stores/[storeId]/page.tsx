import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { StoreForm } from "@/components/admin/store-form";
import { StoreQR } from "@/components/admin/qr-code";
import type { Store } from "@/lib/types";

async function baseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();
  if (!data) notFound();
  const store = data as Store;

  const publicUrl = `${await baseUrl()}/s/${store.slug}`;

  return (
    <div>
      <Link
        href="/admin/stores"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Sucursales
      </Link>
      <PageHeader title={store.name} description="QR público y datos de la sucursal." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">QR de la sucursal</h3>
            <StoreQR url={publicUrl} fileName={`qr-${store.slug}`} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Editar sucursal</h3>
            <StoreForm store={store} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
