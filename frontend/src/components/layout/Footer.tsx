import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-secondary-900 text-secondary-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                Verified AR
              </span>
            </div>
            <p className="text-sm text-secondary-400">
              El marketplace de zapatillas más confiable de Argentina
            </p>
          </div>
          
          {/* Products */}
          <div>
            <h3 className="font-semibold text-white mb-4">Productos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Todas las zapatillas
                </Link>
              </li>
              <li>
                <Link href="/products?brand=nike" className="hover:text-white transition-colors">
                  Nike
                </Link>
              </li>
              <li>
                <Link href="/products?brand=jordan" className="hover:text-white transition-colors">
                  Jordan
                </Link>
              </li>
              <li>
                <Link href="/products?brand=adidas" className="hover:text-white transition-colors">
                  Adidas
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-secondary-800 mt-8 pt-8 text-sm text-center text-secondary-400">
          <p>&copy; {currentYear} Verified AR. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
