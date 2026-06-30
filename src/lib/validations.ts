import { z } from "zod";

// ── Public (shopper) ─────────────────────────────────────────────────────────

export const searchInputSchema = z.object({
  storeSlug: z.string().min(1),
  query: z.string().max(200).default(""),
  sessionId: z.string().min(1).max(100),
});

export const eventSchema = z.object({
  storeId: z.string().uuid(),
  sessionId: z.string().min(1).max(100),
  eventType: z.enum(["search", "product_view", "found_feedback", "promo_click"]),
  query: z.string().max(200).optional(),
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});

export const feedbackSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  sessionId: z.string().min(1).max(100),
  found: z.boolean(),
  query: z.string().max(200).optional(),
  reason: z
    .enum([
      "no_estaba_gondola",
      "ubicacion_incorrecta",
      "no_vi_marca",
      "agotado",
      "otro",
    ])
    .optional(),
});

// ── Admin ────────────────────────────────────────────────────────────────────

export const storeFormatSchema = z.enum([
  "supermercado",
  "mayorista",
  "farmacia",
  "construccion",
  "pet_shop",
  "otro",
]);

export const storeSchema = z.object({
  name: z.string().min(1, "Requerido"),
  slug: z
    .string()
    .min(1, "Requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  format: storeFormatSchema,
  is_active: z.boolean().default(true),
});

export const productSchema = z.object({
  store_id: z.string().uuid("Elegí una sucursal"),
  name: z.string().min(1, "Requerido"),
  brand: z.string().optional().or(z.literal("")),
  category_name: z.string().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")), // comma-separated in the form
  is_active: z.boolean().default(true),
  // location
  aisle: z.string().optional().or(z.literal("")),
  shelf: z.string().optional().or(z.literal("")),
  side: z.string().optional().or(z.literal("")),
  height: z.string().optional().or(z.literal("")),
  zone: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Requerido"),
  brand: z.string().optional().or(z.literal("")),
  store_id: z.string().uuid().optional().or(z.literal("")), // "" => all stores
  category_id: z.string().uuid().optional().or(z.literal("")),
  product_id: z.string().uuid("Elegí un producto patrocinado"),
  keywords: z.string().optional().or(z.literal("")), // comma-separated
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().nonnegative().optional(),
  is_active: z.boolean().default(true),
});

// CSV import row (snake_case columns from the spec).
export const csvRowSchema = z.object({
  store_slug: z.string().min(1, "store_slug requerido"),
  product_name: z.string().min(1, "product_name requerido"),
  brand: z.string().optional().default(""),
  category: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  aisle: z.string().optional().default(""),
  shelf: z.string().optional().default(""),
  side: z.string().optional().default(""),
  height: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  instructions: z.string().optional().default(""),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export function parseTags(input?: string | null): string[] {
  if (!input) return [];
  return input
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}
