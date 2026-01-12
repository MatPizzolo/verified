"use client"

import { useState, useEffect } from "react"
import { Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { apiGet } from "@/lib/api"
import { getSneakerUrl } from "@/lib/images"

interface SavedProduct {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    name: string
    slug: string
    brand: string
    colorway: string
    image_url: string
    retail_price_usd: number
  }
}

export default function SavedPage() {
  const { user, isLoading } = useAuth('/login')
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSavedProducts() {
      if (!user) return

      try {
        setLoading(true)
        const response = await apiGet('/api/saved-products')
        
        if (!response.ok) {
          throw new Error('Failed to fetch saved products')
        }

        const data = await response.json()
        setSavedProducts(data.saved_products || [])
      } catch (err) {
        console.error('Error fetching saved products:', err)
        setError('Error al cargar productos guardados')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSavedProducts()
    }
  }, [user])

  const handleRemoveSaved = async (productId: string) => {
    try {
      const response = await apiGet(`/api/saved-products/${productId}`)
      
      if (response.ok) {
        setSavedProducts(prev => prev.filter(item => item.product_id !== productId))
      }
    } catch (err) {
      console.error('Error removing saved product:', err)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded mb-6 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Perfil
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">Productos Guardados</h1>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
            <p className="text-danger-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {savedProducts.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No tienes productos guardados</h2>
            <p className="text-neutral-500 mb-6">Guarda tus zapatillas favoritas para encontrarlas fácilmente</p>
            <Button asChild>
              <Link href="/products">Explorar Productos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((item) => (
              <Card key={item.id} padding="none" hover>
                <Link href={`/products/${item.product.slug}`} className="block">
                  <div className="relative aspect-square bg-neutral-100">
                    <Image
                      src={getSneakerUrl(item.product.image_url)}
                      alt={`${item.product.brand} ${item.product.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-neutral-500 mb-1">{item.product.brand}</p>
                    <h3 className="font-semibold text-neutral-900 mb-1">{item.product.name}</h3>
                    <p className="text-sm text-neutral-500 mb-2">{item.product.colorway}</p>
                    <p className="text-lg font-bold text-neutral-900">
                      ${item.product.retail_price_usd}
                    </p>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRemoveSaved(item.product_id)}
                  >
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    Quitar de Guardados
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
