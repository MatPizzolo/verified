export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  colorway: string
  sku?: string
  image_url: string
  lowest_ask: number | null
  highest_bid: number | null
  last_sale: number | null
  sizes_available: number[]
}

export interface Bid {
  id: string
  product_name: string
  product_image: string
  size: number
  price: number
  status: "active" | "filled" | "expired" | "cancelled"
  created_at: string
  expires_at: string
}

export interface Ask {
  id: string
  product_name: string
  product_image: string
  size: number
  price: number
  status: "active" | "filled" | "expired" | "cancelled"
  created_at: string
  expires_at: string
}

export interface Transaction {
  id: string
  product_name: string
  product_image: string
  size: number
  price: number
  type: "buy" | "sell"
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
}

export interface Variant {
  id: string
  product_id: string
  size_eu: number
  size_us?: number
  lowest_ask?: number
  highest_bid?: number
}
