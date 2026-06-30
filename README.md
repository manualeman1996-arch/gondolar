# ShelfSearch

Búsqueda dentro de la tienda + shelf intelligence para retailers físicos con
muchos SKUs. Un shopper escanea el QR de una sucursal, busca un producto desde
una webapp mobile-first (sin app, sin login) y recibe su ubicación
(pasillo · góndola · lado · altura · zona). El feedback "lo encontré / no lo
encontré" y cada búsqueda alimentan un dashboard de retail intelligence con
analytics y campañas de productos patrocinados (retail media MVP).

## Stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS** · componentes propios
- **Supabase** Postgres + Auth (solo admins) con **Row Level Security** multi-tenant
- `@supabase/supabase-js` + `@supabase/ssr` (sin ORM extra)
- **zod** (validación) · **react-hook-form** · **recharts** · **papaparse** (CSV) · **qrcode** · **lucide-react**

## Roles

| Rol | Acceso |
|-----|--------|
| **Shopper anónimo** | `/s/[storeSlug]` — sin login, sin datos personales |
| **Admin retailer** | `/admin/*` — dashboard, CRUD, CSV, analytics, campañas |
| **Super admin** *(modelo preparado)* | `/super-admin` — métricas globales (rol + RLS listos) |

## Estructura

```
src/
  lib/            supabase clients, search.ts, events.ts, analytics.ts, validations.ts, auth.ts
  components/     ui/  shopper/  admin/
  app/
    s/[storeSlug]/            home · search · product/[id]      (shopper público)
    admin/(auth)/login        login (Supabase Auth)
    admin/(dashboard)/        dashboard · stores · products · products/import
                              searches · feedback · analytics · campaigns
    api/public/               search · feedback · events · stores · products
supabase/
  migrations/0001_init.sql       tablas + enums + extensiones + RLS + triggers
  migrations/0002_search_fn.sql  ss_normalize + search_products (unaccent + pg_trgm)
  seed.sql                       datos demo (Super Demo, 2 sucursales, 29 productos, 2 campañas)
  seed_admin.sql                 usuario admin demo vía SQL (alternativa al script)
scripts/seed-admin.mjs           crea el admin user con service role
public/sample-products.csv       CSV de ejemplo para el importador
```

## Modelo de datos

`retailers · stores · categories · products · product_locations · search_events ·
product_view_events · feedback_events · campaigns · campaign_events · profiles`.
Todo scopeado por `retailer_id`; RLS garantiza que un retailer nunca ve datos de otro.
Los eventos son anónimos (`anonymous_session_id` random, **sin PII**).

## Cómo correrlo localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá con tu proyecto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon o publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # solo para el seed del admin
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Para esta demo ya hay un proyecto Supabase aprovisionado y `.env.local`
> apuntando a él (ver más abajo). Si querés uno propio, seguí los pasos 3–4.

### 3. Aplicar el schema (proyecto nuevo)

En el SQL editor de Supabase (o con la CLI), ejecutá en orden:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_search_fn.sql`
3. `supabase/seed.sql`

### 4. Crear el usuario admin

Opción A — script con service role:

```bash
npm run seed:admin
```

Opción B — SQL directo: ejecutá `supabase/seed_admin.sql`.

Credenciales demo: **admin@shelfsearch.demo / shelfsearch123**
(cambiá la contraseña antes de cualquier uso real).

### 5. Levantar la app

```bash
npm run dev
# http://localhost:3000
```

## Demo end-to-end

1. **Shopper:** abrí `http://localhost:3000/s/super-demo-palermo`.
2. Buscá **"yerba"** → 3 productos con ubicación · abrí uno → **"Sí, lo encontré"**.
3. Buscá **"pañales"** → *Huggies Triple Protección Talle G* aparece arriba con
   etiqueta **Promocionado** (se registra impresión; al abrirlo, click de campaña).
4. Buscá **"leche sin lactosa"** / **"panales"** (sin tilde) → matchea igual
   (búsqueda normalizada con `unaccent` + tolerante).
5. Buscá algo inexistente (**"xyz123"**) → queda como búsqueda sin resultado.
6. **Admin:** entrá a `http://localhost:3000/admin/login`, logueate.
   - **Dashboard:** búsquedas, tasa encontró/no encontró, top no-encontrados, fricción.
   - **Sucursales:** URL pública + **QR descargable** (PNG/SVG).
   - **Productos:** CRUD + **Importar CSV** (`public/sample-products.csv`).
   - **Campañas:** CRUD + dashboard por campaña (impresiones, clicks, CTR).
   - **Analytics:** gráficos por día, found vs not found, filtros por sucursal/fecha.

## Búsqueda

Función Postgres `search_products(store, query)` que normaliza (minúsculas +
sin acentos) y rankea por tiers: nombre exacto → marca → categoría → tag →
parcial → token. El merge de productos patrocinados (campaña activa que matchea
keyword o categoría) se hace en la capa server, que además registra la impresión.

## Seguridad / privacidad

- RLS en todas las tablas; aislamiento total entre retailers vía `current_retailer_id()`.
- Shoppers anónimos: las tablas de eventos permiten `INSERT` anónimo (telemetría
  sin PII) y solo el admin del retailer puede leerlas. Esta permisividad de
  `INSERT` es **intencional** (advisor `rls_policy_always_true` esperado).
- El `service_role` key nunca se expone al browser (solo en scripts server).

## Deploy (Vercel)

1. Importá el repo en Vercel.
2. Cargá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_APP_URL` con el dominio final).
3. Deploy. La DB/Auth siguen en Supabase.

## Proyecto Supabase de esta demo

- Project ref: `bzbhxhuhckistjdkdqgs` · región `us-east-1`
- Migraciones + seed ya aplicados; usuario admin demo creado.
- `.env.local` (no versionado) ya apunta a este proyecto.
