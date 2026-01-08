"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { formatARS } from "@/lib/format"
import { Package } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded border border-neutral-200 overflow-hidden transition-all hover:shadow hover:border-primary-300">
        <div className="aspect-[3/2] sm:aspect-[4/3] bg-neutral-100 relative overflow-hidden">
          {!imageError && product.image_url ? (
            <Image
              src={product.image_url}
              alt={`${product.brand} ${product.name}`}
              fill
              sizes="(max-width: 320px) 25vw, (max-width: 640px) 8vw, 5vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <Package className="w-4 h-4 text-neutral-300" />
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="text-[10px] font-medium text-neutral-500 mb-0.5 uppercase tracking-wide">
            {product.brand}
          </p>
          <h3 className="font-medium text-neutral-900 line-clamp-1 text-[11px] mb-1 group-hover:text-primary-600 transition-colors leading-tight">
            {product.name}
          </h3>
          <p className="font-bold text-neutral-900 text-xs">
            {product.lowest_ask ? formatARS(product.lowest_ask) : 'N/A'}
          </p>
        </div>
      </div>
    </Link>
  )
}
