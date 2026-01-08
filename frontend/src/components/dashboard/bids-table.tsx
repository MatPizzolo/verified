"use client"

import Image from "next/image"
import { MoreHorizontal, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import { formatARS, formatDate } from "@/lib/format"
import type { Bid } from "@/lib/types"

interface BidsTableProps {
  bids: Bid[]
}

export function BidsTable({ bids }: BidsTableProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="font-medium text-neutral-900 mb-1">No tenés ofertas activas</h3>
        <p className="text-sm text-neutral-500">Cuando hagas una oferta, aparecerá acá</p>
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
              Oferta
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
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-neutral-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image
                      src={bid.product_image || "/placeholder.svg"}
                      alt={bid.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-neutral-900 text-sm line-clamp-1">{bid.product_name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-neutral-700">EU {bid.size}</td>
              <td className="py-4 px-4 text-sm font-semibold text-neutral-900">{formatARS(bid.price)}</td>
              <td className="py-4 px-4 text-sm text-neutral-500">{formatDate(bid.expires_at)}</td>
              <td className="py-4 px-4">
                <StatusBadge status={bid.status} />
              </td>
              <td className="py-4 px-4 text-right">
                {bid.status === "active" && (
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
