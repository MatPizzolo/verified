"use client"

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ProductFilters } from "./product-filters"

interface MobileFiltersProps {
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  selectedSizes: number[]
  setSelectedSizes: (sizes: number[]) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
}

export function MobileFilters(props: MobileFiltersProps) {
  const filterCount =
    props.selectedBrands.length +
    props.selectedSizes.length +
    (props.priceRange[0] > 0 || props.priceRange[1] < 600000 ? 1 : 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {filterCount > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ProductFilters {...props} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
