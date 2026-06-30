import Link from "next/link";
import { MapPin, Search, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <MapPin className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ShelfSearch</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Búsqueda dentro de la tienda. El shopper escanea un QR, busca un producto
        y le decimos dónde encontrarlo.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/s/super-demo-palermo">
          <Button size="lg" className="gap-2">
            <Search className="h-5 w-5" /> Ver demo de tienda
          </Button>
        </Link>
        <Link href="/admin">
          <Button size="lg" variant="outline" className="gap-2">
            <BarChart3 className="h-5 w-5" /> Dashboard admin
          </Button>
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        Demo: tienda <code className="rounded bg-slate-100 px-1">/s/super-demo-palermo</code>
      </p>
    </main>
  );
}
