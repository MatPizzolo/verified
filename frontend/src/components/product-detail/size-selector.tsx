"use client"

import { cn } from "@/lib/utils"

interface SizeSelectorProps {
  sizes: number[]
  selectedSize: number | null
  onSizeSelect: (size: number) => void
}

export function SizeSelector({ sizes, selectedSize, onSizeSelect }: SizeSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-900">Talle (EU)</span>
        <button className="text-xs text-secondary-500 hover:text-secondary-600 transition-colors">Guía de talles</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeSelect(size)}
            className={cn(
              "w-14 h-12 rounded-lg text-sm font-medium transition-all",
              selectedSize === size
                ? "bg-primary-500 text-white ring-2 ring-primary-500 ring-offset-2"
                : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200",
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
