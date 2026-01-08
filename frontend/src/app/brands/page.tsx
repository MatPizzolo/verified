'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BrandCardSkeleton } from '@/components/brands/brand-card-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  product_count: number
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('name')
  const [selectedLetter, setSelectedLetter] = useState<string>('all')

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  useEffect(() => {
    loadBrands()
  }, [])

  async function loadBrands() {
    setLoading(true)
    const supabase = createClient()

    const { data: brandsData, error } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        slug,
        logo_url,
        description,
        products(count)
      `)

    if (error) {
      console.error('Error fetching brands:', error)
      setLoading(false)
      return
    }

    const brandsWithCount = brandsData?.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url,
      description: brand.description,
      product_count: brand.products?.[0]?.count || 0,
    })) || []

    setBrands(brandsWithCount)
    setLoading(false)
  }

  const filteredAndSortedBrands = useMemo(() => {
    let filtered = [...brands]

    if (selectedLetter !== 'all') {
      filtered = filtered.filter((brand) =>
        brand.name.toUpperCase().startsWith(selectedLetter)
      )
    }

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'popular':
        filtered.sort((a, b) => b.product_count - a.product_count)
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  }, [brands, selectedLetter, sortBy])

  const brandsByLetter = useMemo(() => {
    const grouped: Record<string, Brand[]> = {}
    
    filteredAndSortedBrands.forEach((brand) => {
      const firstLetter = brand.name.charAt(0).toUpperCase()
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = []
      }
      grouped[firstLetter].push(brand)
    })

    return grouped
  }, [filteredAndSortedBrands])

  const availableLetters = useMemo(() => {
    return new Set(brands.map((b) => b.name.charAt(0).toUpperCase()))
  }, [brands])

  function scrollToLetter(letter: string) {
    const element = document.getElementById(`letter-${letter}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">
            Directorio de Marcas
          </h1>
          <p className="text-neutral-600 mt-2">
            Explora todas las marcas disponibles en nuestro marketplace
          </p>
        </div>

        {/* A-Z Navigation Bar */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6 sticky top-16 z-10 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">
              Ir a:
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedLetter('all')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  selectedLetter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Todas
              </button>
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter)
                    if (availableLetters.has(letter)) {
                      scrollToLetter(letter)
                    }
                  }}
                  disabled={!availableLetters.has(letter)}
                  className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                    selectedLetter === letter
                      ? 'bg-primary-500 text-white'
                      : availableLetters.has(letter)
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600">Ordenar:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  <SelectItem value="popular">Más populares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-neutral-600">
              {loading ? (
                'Cargando...'
              ) : (
                <>
                  <span className="font-semibold text-neutral-900">
                    {filteredAndSortedBrands.length}
                  </span>{' '}
                  {filteredAndSortedBrands.length === 1 ? 'marca' : 'marcas'}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <BrandCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedBrands.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No se encontraron marcas"
            description={
              selectedLetter !== 'all'
                ? `No hay marcas que comiencen con "${selectedLetter}"`
                : 'No hay marcas disponibles en este momento'
            }
            action={
              selectedLetter !== 'all'
                ? {
                    label: 'Ver todas las marcas',
                    onClick: () => setSelectedLetter('all'),
                  }
                : undefined
            }
          />
        ) : selectedLetter === 'all' ? (
          <div className="space-y-12">
            {Object.entries(brandsByLetter)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, letterBrands]) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6 pb-2 border-b-2 border-primary-500">
                    {letter}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {letterBrands.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredAndSortedBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link
      href={`/products?brand=${brand.slug}`}
      className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-primary-300 transition-all group"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 mb-4 flex items-center justify-center bg-neutral-50 rounded-lg group-hover:bg-primary-50 transition-colors relative overflow-hidden">
          {brand.logo_url ? (
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={60}
              height={60}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<span class="text-2xl font-bold text-neutral-400">${brand.name.charAt(0)}</span>`
                }
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-neutral-400">
              {brand.name.charAt(0)}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
          {brand.name}
        </h3>

        <p className="text-sm text-neutral-500">
          {brand.product_count || 0}{' '}
          {brand.product_count === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </Link>
  )
}
