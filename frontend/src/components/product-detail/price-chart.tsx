"use client"

import { formatARS } from "@/lib/format"

// Mock price history data
const mockPriceHistory = [
  { date: "Oct", price: 420000 },
  { date: "Nov", price: 435000 },
  { date: "Dic", price: 460000 },
  { date: "Ene", price: 445000 },
  { date: "Feb", price: 470000 },
  { date: "Mar", price: 450000 },
]

export function PriceChart() {
  // Simple chart without recharts dependency
  const maxPrice = Math.max(...mockPriceHistory.map(d => d.price))
  const minPrice = Math.min(...mockPriceHistory.map(d => d.price))
  const range = maxPrice - minPrice

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h3 className="font-semibold text-neutral-900 mb-4">Historial de Precios</h3>
      <div className="h-64 flex items-end justify-between gap-2">
        {mockPriceHistory.map((item, index) => {
          const height = range > 0 ? ((item.price - minPrice) / range) * 100 + 20 : 50
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">{formatARS(item.price)}</span>
                <div
                  className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                  style={{ height: `${height}%`, minHeight: '20px' }}
                />
              </div>
              <span className="text-xs text-neutral-500">{item.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
