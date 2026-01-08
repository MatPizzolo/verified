"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortOption = "popular" | "newest" | "price-asc" | "price-desc"

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const labels: Record<SortOption, string> = {
    popular: "Más Popular",
    newest: "Más Nuevo",
    "price-asc": "Precio: Menor a Mayor",
    "price-desc": "Precio: Mayor a Menor",
  }

  return (
    <Select value={labels[value]} onValueChange={(label) => {
      const entry = Object.entries(labels).find(([_, v]) => v === label)
      if (entry) onChange(entry[0] as SortOption)
    }}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Más Popular">Más Popular</SelectItem>
        <SelectItem value="Más Nuevo">Más Nuevo</SelectItem>
        <SelectItem value="Precio: Menor a Mayor">Precio: Menor a Mayor</SelectItem>
        <SelectItem value="Precio: Mayor a Menor">Precio: Mayor a Menor</SelectItem>
      </SelectContent>
    </Select>
  )
}
