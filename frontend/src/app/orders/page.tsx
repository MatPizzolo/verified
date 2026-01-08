"use client"

import { useState, useEffect } from "react"
import { Package, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function OrdersPage() {
  const { user, isLoading } = useAuth('/login')
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      // TODO: Fetch orders from backend
      // For now, show empty state
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded mb-6"></div>
            <div className="h-64 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Perfil
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900">Mis Compras</h1>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No tienes compras aún</h2>
            <p className="text-neutral-500 mb-6">Explora nuestros productos y encuentra tus zapatillas favoritas</p>
            <Button asChild>
              <Link href="/products">Explorar Productos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order items will be rendered here */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <p className="text-neutral-500">Tus compras aparecerán aquí</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
