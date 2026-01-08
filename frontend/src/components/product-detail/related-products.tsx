import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

interface RelatedProductsProps {
  products: Product[]
  currentProductId: string
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  const related = products.filter((p) => p.id !== currentProductId).slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-neutral-900 mb-6">Productos Relacionados</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
