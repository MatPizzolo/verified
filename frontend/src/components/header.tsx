"use client"

import Link from "next/link"
import { Search, Menu, X, User, ShoppingBag, ChevronDown, LogOut, Heart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const { user, isLoading, handleLogout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [profileDropdownOpen])

  const handleProfileLogout = async () => {
    setProfileDropdownOpen(false)
    await handleLogout()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VA</span>
            </div>
            <span className="font-bold text-lg text-neutral-900 hidden sm:block">Verified AR</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input type="search" placeholder="Buscar zapatillas..." className="pl-10 bg-neutral-100 border-0" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 mr-2">
            {user ? (
              <>
                <Link
                  href="/products"
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  Productos
                </Link>
                <Link
                  href="/brands"
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  Marcas
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  Explorar
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  Cómo funciona
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-neutral-100 rounded animate-pulse" />
            ) : user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Vender
                  </Link>
                </Button>
                <button
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Saved items"
                >
                  <Heart className="w-5 h-5 text-neutral-600 hover:text-primary-600 transition-colors" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-neutral-600" />
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Mis Compras
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/saved"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Guardados
                      </Link>
                      <hr className="my-2 border-neutral-200" />
                      <button
                        onClick={handleProfileLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Ingresar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input type="search" placeholder="Buscar zapatillas..." className="pl-10 bg-neutral-100 border-0" />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="flex flex-col p-4 gap-3">
            {user ? (
              <>
                <Link href="/products" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Productos
                </Link>
                <Link href="/brands" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Marcas
                </Link>
                <Link href="/dashboard" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Mi Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/products" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Explorar
                </Link>
                <Link href="/how-it-works" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Cómo funciona
                </Link>
              </>
            )}
            <hr className="border-neutral-200" />
            {user ? (
              <button
                onClick={async () => {
                  await handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="text-sm font-medium py-2 text-left text-danger-600"
              >
                Cerrar Sesión
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Ingresar
                </Link>
                <Button asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
