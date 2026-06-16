export type Role = 'customer' | 'staff' | 'admin';
export type ProductCategory = 'table' | 'chair';
export type ProductStatus = 'draft' | 'published';
export type ImageType = 'on_white' | 'lifestyle' | 'detail';

export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};

export type Collection = {
  id: string; slug: string; name: string; description: string | null;
  hero_image_url: string | null; sort_order: number; created_at: string;
};

export type WoodSpecies = { id: string; name: string; swatch_color: string; sort_order: number };
export type Finish = { id: string; name: string; swatch_color: string; sort_order: number };

export type Product = {
  id: string; slug: string; name: string; category: ProductCategory;
  collection_id: string | null; short_description: string | null; story: string | null;
  base_price_cents: number; lead_time_weeks: number | null; region: string | null;
  status: ProductStatus; featured: boolean; created_at: string; updated_at: string;
};

export type ProductImage = { id: string; product_id: string; url: string; type: ImageType; sort_order: number };
export type ProductSize = { id: string; product_id: string; label: string; seats: number | null; price_delta_cents: number; sort_order: number };

export type StorefrontCard = Product & {
  image_url: string | null;
  wood_swatches: string[]; // swatch_color values, for the card dots
};

export type ConfigOption = { id: string; name: string; swatch_color: string; price_delta_cents: number };

export type StorefrontProduct = Product & {
  collection_name: string | null;
  images: ProductImage[];
  woods: ConfigOption[];
  finishes: ConfigOption[];
  sizes: ProductSize[];
};

export type SampleRequestRow = {
  id: string;
  product_id: string | null;
  product_name: string | null;
  wood_name: string | null;
  finish_name: string | null;
  status: 'requested' | 'shipped' | 'delivered';
  created_at: string;
};

export type QuoteStatus = 'requested' | 'sent' | 'accepted' | 'declined' | 'expired';
export type OrderStatus = 'confirmed' | 'in_production' | 'shipping' | 'delivered' | 'cancelled';

export type QuoteItem = {
  id: string; quote_id: string; product_id: string | null; title_snapshot: string;
  wood_name: string | null; finish_name: string | null; size_label: string | null;
  quantity: number; unit_price_cents: number; configuration_json: Record<string, unknown> | null;
};
export type Quote = {
  id: string; customer_id: string; status: QuoteStatus; subtotal_cents: number; total_cents: number;
  valid_until: string | null; notes: string | null; created_at: string;
};
export type OrderItem = Omit<QuoteItem, 'quote_id'> & { order_id: string };
export type Order = {
  id: string; customer_id: string; quote_id: string | null; status: OrderStatus;
  subtotal_cents: number; total_cents: number; est_delivery_date: string | null; created_at: string;
};
export type OrderStatusEvent = { id: string; order_id: string; status: string; note: string | null; created_at: string };
export type Message = { id: string; customer_id: string; sender: 'customer' | 'staff'; body: string; read_at: string | null; created_at: string };
