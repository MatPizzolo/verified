import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ProductCard } from "@/components/product-card"
import { mockProducts } from "@/lib/mock-data"

export function FeaturedProducts() {
  const featured = mockProducts.slice(0, 8)

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Productos Destacados</h2>
            <p className="text-neutral-500 mt-1">Los sneakers más buscados del momento</p>
          </div>
          <Button variant="ghost" className="text-primary-600 hover:text-primary-700" asChild>
            <Link href="/products">
              Ver todos
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
