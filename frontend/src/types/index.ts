export type UserRole = 'buyer' | 'seller' | 'admin';

export type ListingType = 'bid' | 'ask';

export type ListingStatus = 'active' | 'filled' | 'expired' | 'cancelled';

export type TransactionStatus = 
  | 'pending_payment'
  | 'pending_shipment'
  | 'in_transit_to_auth'
  | 'authenticating'
  | 'authenticated'
  | 'authentication_failed'
  | 'shipped_to_buyer'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  verified_seller: boolean;
  verified_email: boolean;
  verified_phone: boolean;
  reputation_score: number;
  total_sales: number;
  total_purchases: number;
  mercadopago_account_id?: string;
  mercadopago_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country: string;
  banned_at?: string;
  ban_reason?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  brand?: Brand;
  name: string;
  slug: string;
  colorway?: string;
  sku?: string;
  retail_price_usd?: number;
  description?: string;
  release_date?: string;
  gender?: string;
  image_url: string;
  image_urls?: string[];
  featured: boolean;
  active: boolean;
  total_sales: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  product?: Product;
  size_eu: number;
  size_us?: number;
  size_uk?: number;
  size_cm?: number;
  active: boolean;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  variant_id: string;
  variant?: Variant;
  user_id: string;
  user?: User;
  price_ars: number;
  price_usd?: number;
  usd_ars_rate?: number;
  status: ListingStatus;
  expires_at: string;
  matched_ask_id?: string;
  matched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Ask {
  id: string;
  variant_id: string;
  variant?: Variant;
  user_id: string;
  user?: User;
  price_ars: number;
  price_usd?: number;
  usd_ars_rate?: number;
  status: ListingStatus;
  expires_at: string;
  matched_bid_id?: string;
  matched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  bid_id: string;
  bid?: Bid;
  ask_id: string;
  ask?: Ask;
  variant_id: string;
  variant?: Variant;
  buyer_id: string;
  buyer?: User;
  seller_id: string;
  seller?: User;
  sale_price_ars: number;
  sale_price_usd?: number;
  usd_ars_rate?: number;
  platform_fee_ars: number;
  authentication_fee_ars: number;
  shipping_fee_ars: number;
  total_buyer_payment_ars: number;
  seller_payout_ars?: number;
  payout_id?: string;
  status: TransactionStatus;
  payment_id?: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  installments: number;
  paid_at?: string;
  tracking_number_to_auth?: string;
  carrier_to_auth?: string;
  shipped_to_auth_at?: string;
  arrived_at_auth_at?: string;
  authenticated_by?: string;
  authenticated_at?: string;
  authentication_passed?: boolean;
  authentication_notes?: string;
  authentication_images?: string[];
  tracking_number_to_buyer?: string;
  carrier_to_buyer?: string;
  shipped_to_buyer_at?: string;
  delivered_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  transaction_id: string;
  seller_id: string;
  amount_ars: number;
  mp_transfer_id?: string;
  mp_status?: string;
  status: PayoutStatus;
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  variant_id: string;
  transaction_id?: string;
  price_ars: number;
  price_usd?: number;
  recorded_at: string;
}

export interface MarketStats {
  id: string;
  variant_id: string;
  lowest_ask_ars?: number;
  lowest_ask_id?: string;
  highest_bid_ars?: number;
  highest_bid_id?: string;
  last_sale_price_ars?: number;
  last_sale_at?: string;
  total_asks: number;
  total_bids: number;
  total_sales: number;
  avg_sale_price_ars?: number;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  rate_type: 'official' | 'blue' | 'mep';
  usd_to_ars: number;
  source?: string;
  created_at: string;
}
