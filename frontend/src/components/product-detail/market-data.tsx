import { formatARS } from "@/lib/format"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MarketDataProps {
  lowestAsk: number | null
  highestBid: number | null
  lastSale: number | null
}

export function MarketData({ lowestAsk, highestBid, lastSale }: MarketDataProps) {
  const priceTrend =
    lastSale && lowestAsk ? (lowestAsk > lastSale ? "up" : lowestAsk < lastSale ? "down" : "neutral") : "neutral"

  return (
    <div className="bg-neutral-100 rounded-xl p-4">
      <h3 className="text-sm font-medium text-neutral-500 mb-4">Datos del Mercado</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Lowest Ask</p>
          <p className="font-bold text-primary-600 text-lg">{formatARS(lowestAsk)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Highest Bid</p>
          <p className="font-bold text-neutral-900 text-lg">{formatARS(highestBid)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Last Sale</p>
          <div className="flex items-center gap-1">
            <p className="font-bold text-neutral-900 text-lg">{formatARS(lastSale)}</p>
            {priceTrend === "up" && <TrendingUp className="w-4 h-4 text-primary-500" />}
            {priceTrend === "down" && <TrendingDown className="w-4 h-4 text-danger-500" />}
            {priceTrend === "neutral" && <Minus className="w-4 h-4 text-neutral-400" />}
          </div>
        </div>
      </div>
    </div>
  )
}
