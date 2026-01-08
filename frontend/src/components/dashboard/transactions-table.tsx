"use client"

import Image from "next/image"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { formatARS, formatDate } from "@/lib/format"
import type { Transaction } from "@/lib/types"

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="font-medium text-neutral-900 mb-1">No tenés transacciones</h3>
        <p className="text-sm text-neutral-500">Cuando compres o vendas, aparecerá acá</p>
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
              Tipo
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Talle
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Precio
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image
                      src={tx.product_image || "/placeholder.svg"}
                      alt={tx.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-neutral-900 text-sm line-clamp-1">{tx.product_name}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    tx.type === "buy" ? "text-primary-600" : "text-secondary-600"
                  }`}
                >
                  {tx.type === "buy" ? (
                    <>
                      <ArrowDownLeft className="w-4 h-4" />
                      Compra
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      Venta
                    </>
                  )}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-neutral-700">EU {tx.size}</td>
              <td className="py-4 px-4 text-sm font-semibold text-neutral-900">{formatARS(tx.price)}</td>
              <td className="py-4 px-4 text-sm text-neutral-500">{formatDate(tx.created_at)}</td>
              <td className="py-4 px-4">
                <StatusBadge status={tx.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
