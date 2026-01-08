import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { formatARS } from "@/lib/format"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-square bg-neutral-100 relative overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-neutral-500 mb-1">{product.brand}</p>
          <h3 className="font-medium text-neutral-900 line-clamp-2 text-sm mb-2 group-hover:text-primary-500 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 mb-1">Lowest Ask</p>
          <p className="font-bold text-neutral-900">{formatARS(product.lowest_ask)}</p>
        </div>
      </div>
    </Link>
  )
}
