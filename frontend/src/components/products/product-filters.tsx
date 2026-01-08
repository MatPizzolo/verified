"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { formatARS } from "@/lib/format"

const brands = ["Nike", "Jordan", "Adidas", "New Balance"]
const sizes = [38, 39, 40, 41, 42, 43, 44, 45]

interface ProductFiltersProps {
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  selectedSizes: number[]
  setSelectedSizes: (sizes: number[]) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
}

export function ProductFilters({
  selectedBrands,
  setSelectedBrands,
  selectedSizes,
  setSelectedSizes,
  priceRange,
  setPriceRange,
}: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    brand: true,
    size: true,
    price: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands(
      selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand],
    )
  }

  const toggleSize = (size: number) => {
    setSelectedSizes(selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size])
  }

  const clearFilters = () => {
    setSelectedBrands([])
    setSelectedSizes([])
    setPriceRange([0, 600000])
  }

  const hasActiveFilters =
    selectedBrands.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 600000

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-neutral-500 hover:text-neutral-900 h-auto p-0 text-xs"
          >
            Limpiar todo
          </Button>
        )}
      </div>

      {/* Brand Filter */}
      <div className="border-b border-neutral-200 pb-4">
        <button
          onClick={() => toggleSection("brand")}
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900"
        >
          Marca
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.brand ? "rotate-180" : ""}`} />
        </button>
        {openSections.brand && (
          <div className="space-y-3 mt-3">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <span className="text-sm text-neutral-700">{brand}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Size Filter */}
      <div className="border-b border-neutral-200 pb-4">
        <button
          onClick={() => toggleSection("size")}
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900"
        >
          Talle (EU)
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.size ? "rotate-180" : ""}`} />
        </button>
        {openSections.size && (
          <div className="flex flex-wrap gap-2 mt-3">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  selectedSizes.includes(size)
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900"
        >
          Precio
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
        </button>
        {openSections.price && (
          <div className="mt-4 space-y-4">
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={600000}
              min={0}
              step={10000}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>{formatARS(priceRange[0])}</span>
              <span>{formatARS(priceRange[1])}</span>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map((brand) => (
            <span
              key={brand}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs"
            >
              {brand}
              <button onClick={() => toggleBrand(brand)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedSizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs"
            >
              EU {size}
              <button onClick={() => toggleSize(size)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
