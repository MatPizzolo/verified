import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ProductCard } from "@/components/product-card"
import { createClient } from "@/lib/supabase/server"

export async function FeaturedProducts() {
  const supabase = await createClient()

  const { data: productsData } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, slug, logo_url),
      variants(
        id,
        size_eu,
        size_us,
        market_stats(lowest_ask_ars, highest_bid_ars)
      )
    `)
    .eq('active', true)
    .limit(8)

  const featured = productsData?.map((product: any) => {
    const lowestAsk = product.variants
      ?.map((v: any) => v.market_stats?.[0]?.lowest_ask_ars)
      .filter((price: any) => price !== null)
      .sort((a: number, b: number) => a - b)[0]

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand?.name || 'Unknown',
      colorway: product.colorway || '',
      image_url: product.image_url,
      retail_price_usd: product.retail_price_usd || 0,
      lowest_ask: lowestAsk || null,
    }
  }) || []

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
