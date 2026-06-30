// Domain + database types for ShelfSearch.
// Kept hand-written (instead of generated) so the repo is self-contained.

export type StoreFormat =
  | "supermercado"
  | "mayorista"
  | "farmacia"
  | "construccion"
  | "pet_shop"
  | "otro";

export type AdminRole = "retailer_admin" | "super_admin";

export type EventType =
  | "search"
  | "product_view"
  | "found_feedback"
  | "promo_click";

export type CampaignEventType = "impression" | "click";

export type FeedbackReason =
  | "no_estaba_gondola"
  | "ubicacion_incorrecta"
  | "no_vi_marca"
  | "agotado"
  | "otro";

export interface Retailer {
  id: string;
  name: string;
  logo_url: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  retailer_id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  format: StoreFormat;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  retailer_id: string | null;
  name: string;
  slug: string;
  parent_category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  retailer_id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductLocation {
  id: string;
  product_id: string;
  store_id: string;
  aisle: string | null;
  shelf: string | null;
  side: string | null;
  height: string | null;
  zone: string | null;
  instructions: string | null;
  updated_at: string;
}

export interface Campaign {
  id: string;
  retailer_id: string;
  name: string;
  brand: string | null;
  store_id: string | null;
  category_id: string | null;
  product_id: string;
  keywords: string[];
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  retailer_id: string | null;
  role: AdminRole;
  name: string | null;
  created_at: string;
}

// ── Composed view models ─────────────────────────────────────────────────────

export interface ProductWithLocation extends Product {
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  location?: ProductLocation | null;
}

export interface SearchResultItem extends ProductWithLocation {
  rank: number;
  sponsored: boolean;
  campaign_id?: string | null;
}

// Result shape returned by the `search_products` Postgres function.
export interface SearchProductsRow {
  product_id: string;
  rank: number;
}

export const STORE_FORMAT_LABELS: Record<StoreFormat, string> = {
  supermercado: "Supermercado",
  mayorista: "Mayorista",
  farmacia: "Farmacia",
  construccion: "Construcción",
  pet_shop: "Pet shop",
  otro: "Otro",
};

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  no_estaba_gondola: "No estaba en la góndola",
  ubicacion_incorrecta: "La ubicación era incorrecta",
  no_vi_marca: "No vi la marca",
  agotado: "Estaba agotado",
  otro: "Otro",
};
