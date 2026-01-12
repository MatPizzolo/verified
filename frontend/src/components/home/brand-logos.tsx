const brands = [
  { name: "Nike" },
  { name: "Jordan" },
  { name: "Adidas" },
  { name: "New Balance" },
]

export function BrandLogos() {
  return (
    <section className="py-12 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-neutral-500 mb-8">Marcas verificadas disponibles</p>
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {brands.map((brand) => (
            <div key={brand.name} className="opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-2xl md:text-3xl font-bold text-neutral-800">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
