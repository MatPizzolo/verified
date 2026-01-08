"use client"

import Image from "next/image"
import { MoreHorizontal, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import { formatARS, formatDate } from "@/lib/format"
import type { Ask } from "@/lib/types"

interface AsksTableProps {
  asks: Ask[]
}

export function AsksTable({ asks }: AsksTableProps) {
  if (asks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-medium text-neutral-900 mb-1">No tenés ventas activas</h3>
        <p className="text-sm text-neutral-500">Cuando publiques una venta, aparecerá acá</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Producto
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Talle
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Precio
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Expira
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {asks.map((ask) => (
            <tr key={ask.id} className="hover:bg-neutral-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image
                      src={ask.product_image || "/placeholder.svg"}
                      alt={ask.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-neutral-900 text-sm line-clamp-1">{ask.product_name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-neutral-700">EU {ask.size}</td>
              <td className="py-4 px-4 text-sm font-semibold text-neutral-900">{formatARS(ask.price)}</td>
              <td className="py-4 px-4 text-sm text-neutral-500">{formatDate(ask.expires_at)}</td>
              <td className="py-4 px-4">
                <StatusBadge status={ask.status} />
              </td>
              <td className="py-4 px-4 text-right">
                {ask.status === "active" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-danger-600">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
