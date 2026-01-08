'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <header className="bg-white border-b border-secondary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="font-display font-bold text-xl text-secondary-900">
              Verified AR
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/products"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/products')
                  ? 'bg-secondary-100 text-secondary-900'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              Productos
            </Link>
            <Link
              href="/how-it-works"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/how-it-works')
                  ? 'bg-secondary-100 text-secondary-900'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              Cómo funciona
            </Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Ingresar
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
