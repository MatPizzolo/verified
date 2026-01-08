'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/product-card'
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton'
import { FilterSidebar } from '@/components/products/filter-sidebar'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Package, SlidersHorizontal, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const PRODUCTS_PER_PAGE = 24

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface Product {
  id: string
  name: string
  slug: string
  brand: string
  colorway: string
  image_url: string
  retail_price_usd: number
  lowest_ask: number | null
  highest_bid: number | null
  last_sale: number | null
  sizes_available: number[]
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const brandParam = searchParams.get('brand')

  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : [])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [sortBy, setSortBy] = useState('featured')
  const [displayCount, setDisplayCount] = useState(PRODUCTS_PER_PAGE)

  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (brandParam && brands.length > 0) {
      setSelectedBrands([brandParam])
    }
  }, [brandParam, brands])

  useEffect(() => {
    if (allProducts.length > 0) {
      applyFilters()
    }
  }, [debouncedSearch, selectedBrands, priceRange, selectedSizes, sortBy, allProducts])

  async function loadInitialData() {
    setLoading(true)
    const supabase = createClient()

    const [productsResult, brandsResult] = await Promise.all([
      supabase
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
        .eq('active', true),
      supabase
        .from('brands')
        .select('*')
        .order('name')
    ])

    if (productsResult.error) {
      console.error('Error fetching products:', productsResult.error)
    }

    if (brandsResult.error) {
      console.error('Error fetching brands:', brandsResult.error)
    }

    const productsWithStats = productsResult.data?.map((product: any) => {
      const lowestAsk = product.variants
        ?.map((v: any) => v.market_stats?.[0]?.lowest_ask_ars)
        .filter((price: any) => price !== null)
        .sort((a: number, b: number) => a - b)[0]

      const highestBid = product.variants
        ?.map((v: any) => v.market_stats?.[0]?.highest_bid_ars)
        .filter((price: any) => price !== null)
        .sort((a: number, b: number) => b - a)[0]

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand?.name || 'Unknown',
        brandSlug: product.brand?.slug || '',
        colorway: product.colorway || '',
        image_url: product.image_url,
        retail_price_usd: product.retail_price_usd || 0,
        lowest_ask: lowestAsk || null,
        highest_bid: highestBid || null,
        last_sale: null,
        sizes_available: product.variants?.map((v: any) => v.size_us || v.size_eu) || [],
      }
    }) || []

    setAllProducts(productsWithStats)
    setBrands(brandsResult.data || [])
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...allProducts]

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.colorway.toLowerCase().includes(query)
      )
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) =>
        selectedBrands.includes(p.brandSlug)
      )
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes_available.some((size) => selectedSizes.includes(size))
      )
    }

    filtered = filtered.filter((p) => {
      const price = p.lowest_ask || p.retail_price_usd * 1000
      return price >= priceRange[0] && price <= priceRange[1]
    })

    switch (sortBy) {
      case 'newest':
        break
      case 'popular':
        break
      case 'price_low':
        filtered.sort((a, b) => {
          const priceA = a.lowest_ask || a.retail_price_usd * 1000
          const priceB = b.lowest_ask || b.retail_price_usd * 1000
          return priceA - priceB
        })
        break
      case 'price_high':
        filtered.sort((a, b) => {
          const priceA = a.lowest_ask || a.retail_price_usd * 1000
          const priceB = b.lowest_ask || b.retail_price_usd * 1000
          return priceB - priceA
        })
        break
      default:
        break
    }

    setProducts(filtered)
    setDisplayCount(PRODUCTS_PER_PAGE)
  }

  function handleClearFilters() {
    setSelectedBrands([])
    setPriceRange([0, 1000000])
    setSelectedSizes([])
    setSearchQuery('')
  }

  function handleLoadMore() {
    setLoadingMore(true)
    setTimeout(() => {
      setDisplayCount((prev) => prev + PRODUCTS_PER_PAGE)
      setLoadingMore(false)
    }, 300)
  }

  const displayedProducts = products.slice(0, displayCount)
  const hasMore = displayCount < products.length
  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000000 ||
    searchQuery.length > 0

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">
            Catálogo de Productos
          </h1>
          <p className="text-neutral-600 mt-2">
            Descubre las mejores zapatillas verificadas del mercado
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="search"
              placeholder="Buscar por nombre, marca o colorway..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-white border-neutral-300 focus:border-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Button & Sort */}
        <div className="lg:hidden flex gap-3 mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                    {selectedBrands.length + selectedSizes.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar
                  brands={brands}
                  selectedBrands={selectedBrands}
                  onBrandsChange={setSelectedBrands}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
                  selectedSizes={selectedSizes}
                  onSizesChange={setSelectedSizes}
                  onClearAll={handleClearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Destacados</SelectItem>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="popular">Más populares</SelectItem>
              <SelectItem value="price_low">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="price_high">Precio: Mayor a Menor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Layout: Sidebar + Grid */}
        <div className="flex gap-4">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <FilterSidebar
              brands={brands}
              selectedBrands={selectedBrands}
              onBrandsChange={setSelectedBrands}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              selectedSizes={selectedSizes}
              onSizesChange={setSelectedSizes}
              onClearAll={handleClearFilters}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-600">
                {loading ? (
                  'Cargando...'
                ) : (
                  <>
                    <span className="font-semibold text-neutral-900">
                      {products.length}
                    </span>{' '}
                    {products.length === 1 ? 'producto' : 'productos'}
                    {hasActiveFilters && ' encontrados'}
                  </>
                )}
              </p>

              {/* Desktop Sort */}
              <div className="hidden lg:block w-56">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Destacados</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="popular">Más populares</SelectItem>
                    <SelectItem value="price_low">Precio: Menor a Mayor</SelectItem>
                    <SelectItem value="price_high">Precio: Mayor a Menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No se encontraron productos"
                description={
                  hasActiveFilters
                    ? 'Intenta ajustar los filtros para ver más resultados'
                    : 'No hay productos disponibles en este momento'
                }
                action={
                  hasActiveFilters
                    ? {
                        label: 'Limpiar filtros',
                        onClick: handleClearFilters,
                      }
                    : undefined
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      size="lg"
                      variant="outline"
                      className="min-w-[200px]"
                    >
                      {loadingMore ? 'Cargando...' : 'Cargar más productos'}
                    </Button>
                    <p className="text-sm text-neutral-500 mt-3">
                      Mostrando {displayedProducts.length} de {products.length}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
