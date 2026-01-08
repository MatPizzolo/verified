import Image from "next/image"

const brands = [
  { name: "Nike", logo: "/nike-logo-black.jpg" },
  { name: "Jordan", logo: "/jordan-jumpman-logo-black.jpg" },
  { name: "Adidas", logo: "/adidas-logo-black.jpg" },
  { name: "New Balance", logo: "/new-balance-logo-black.jpg" },
]

export function BrandLogos() {
  return (
    <section className="py-12 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-neutral-500 mb-8">Marcas verificadas disponibles</p>
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {brands.map((brand) => (
            <div key={brand.name} className="opacity-60 hover:opacity-100 transition-opacity">
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={brand.name}
                width={100}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
