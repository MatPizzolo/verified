import { Search, Gavel, Truck } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Explorá",
    description: "Buscá entre miles de zapatillas de las mejores marcas. Filtrá por talle, precio y más.",
  },
  {
    icon: Gavel,
    title: "Ofertá o Comprá",
    description: "Hacé una oferta al precio que querés o comprá al instante al precio más bajo disponible.",
  },
  {
    icon: Truck,
    title: "Recibí Verificado",
    description: "Verificamos cada producto antes de enviártelo. Garantía de autenticidad 100%.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">¿Cómo Funciona?</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Comprá y vendé sneakers de forma segura en tres simples pasos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-6">
                <step.icon className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-semibold text-neutral-900">{step.title}</h3>
              </div>
              <p className="text-neutral-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
