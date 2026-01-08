"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { formatARS } from "@/lib/format"

interface Brand {
  id: string
  name: string
  slug: string
}

interface FilterSidebarProps {
  brands: Brand[]
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  selectedSizes: number[]
  onSizesChange: (sizes: number[]) => void
  onClearAll: () => void
}

const US_SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15]

export function FilterSidebar({
  brands,
  selectedBrands,
  onBrandsChange,
  priceRange,
  onPriceChange,
  selectedSizes,
  onSizesChange,
  onClearAll,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState({
    brand: true,
    size: true,
    price: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleBrand = (slug: string) => {
    onBrandsChange(
      selectedBrands.includes(slug)
        ? selectedBrands.filter((b) => b !== slug)
        : [...selectedBrands, slug]
    )
  }

  const toggleSize = (size: number) => {
    onSizesChange(
      selectedSizes.includes(size)
        ? selectedSizes.filter((s) => s !== size)
        : [...selectedSizes, size]
    )
  }

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000000

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-20 h-fit">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <h3 className="font-semibold text-lg text-neutral-900">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
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
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
          >
            Marca
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openSections.brand ? "rotate-180" : ""
              }`}
            />
          </button>
          {openSections.brand && (
            <div className="space-y-3 mt-3 max-h-64 overflow-y-auto">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedBrands.includes(brand.slug)}
                    onCheckedChange={() => toggleBrand(brand.slug)}
                  />
                  <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Size Filter */}
        <div className="border-b border-neutral-200 pb-4">
          <button
            onClick={() => toggleSection("size")}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
          >
            Talle (US)
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openSections.size ? "rotate-180" : ""
              }`}
            />
          </button>
          {openSections.size && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {US_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`h-10 rounded-md text-sm font-medium transition-all ${
                    selectedSizes.includes(size)
                      ? "bg-primary-500 text-white shadow-sm"
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
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
          >
            Precio
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openSections.price ? "rotate-180" : ""
              }`}
            />
          </button>
          {openSections.price && (
            <div className="mt-4 space-y-4">
              <Slider
                value={priceRange}
                onValueChange={(value) => onPriceChange(value as [number, number])}
                max={1000000}
                min={0}
                step={10000}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{formatARS(priceRange[0])}</span>
                <span className="text-neutral-600">{formatARS(priceRange[1])}</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-500 mb-3">
              Filtros activos
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedBrands.map((slug) => {
                const brand = brands.find((b) => b.slug === slug)
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium"
                  >
                    {brand?.name}
                    <button
                      onClick={() => toggleBrand(slug)}
                      className="hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
              {selectedSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium"
                >
                  US {size}
                  <button
                    onClick={() => toggleSize(size)}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
