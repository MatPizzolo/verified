import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VA</span>
              </div>
              <span className="font-bold text-lg">Verified AR</span>
            </div>
            <p className="text-sm text-neutral-400">El marketplace de zapatillas verificadas en Argentina.</p>
          </div>

          {/* Comprar */}
          <div>
            <h4 className="font-semibold mb-4">Comprar</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link href="/products?brand=Nike" className="hover:text-white transition-colors">
                  Nike
                </Link>
              </li>
              <li>
                <Link href="/products?brand=Jordan" className="hover:text-white transition-colors">
                  Jordan
                </Link>
              </li>
              <li>
                <Link href="/products?brand=Adidas" className="hover:text-white transition-colors">
                  Adidas
                </Link>
              </li>
            </ul>
          </div>

          {/* Vender */}
          <div>
            <h4 className="font-semibold mb-4">Vender</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Listar producto
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Mis ventas
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Cómo funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="font-semibold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-400">© 2026 Verified AR. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              Hecho en Argentina
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
