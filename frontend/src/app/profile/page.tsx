"use client"

import { User, ShoppingBag, Package, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function ProfilePage() {
  const { user, isLoading, handleLogout } = useAuth('/login')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-32 bg-neutral-200 rounded-lg mb-6"></div>
            <div className="h-64 bg-neutral-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-neutral-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900">
                {user?.user_metadata?.full_name || user?.email}
              </h1>
              <p className="text-neutral-500">{user?.email}</p>
              <p className="text-sm text-neutral-400 mt-1">Miembro desde {new Date(user?.created_at).toLocaleDateString('es-AR')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Vender</h3>
                <p className="text-sm text-neutral-500">Publica tus productos</p>
              </div>
            </div>
          </Link>

          <Link
            href="/orders"
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Mis Compras</h3>
                <p className="text-sm text-neutral-500">Historial de pedidos</p>
              </div>
            </div>
          </Link>

          <Link
            href="/settings"
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Configuración</h3>
                <p className="text-sm text-neutral-500">Cuenta y preferencias</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Mi Actividad</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">0</div>
              <div className="text-sm text-neutral-500">Compras</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">0</div>
              <div className="text-sm text-neutral-500">Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">0</div>
              <div className="text-sm text-neutral-500">Ofertas Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">0</div>
              <div className="text-sm text-neutral-500">Productos Listados</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
