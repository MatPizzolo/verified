"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatARS } from "@/lib/format"
import Image from "next/image"

interface BidAskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "bid" | "ask"
  productName: string
  productImage: string
  selectedSize: number | null
  suggestedPrice?: number | null
}

export function BidAskModal({
  open,
  onOpenChange,
  mode,
  productName,
  productImage,
  selectedSize,
  suggestedPrice,
}: BidAskModalProps) {
  const [price, setPrice] = useState(suggestedPrice?.toString() || "")
  const [expiration, setExpiration] = useState("14 días")

  const priceNum = Number.parseInt(price) || 0
  const fee = Math.round(priceNum * 0.095) // 9.5% fee
  const total = mode === "bid" ? priceNum + fee : priceNum - fee

  // Simple USD conversion (example rate)
  const usdRate = 1200
  const usdEquivalent = priceNum > 0 ? (priceNum / usdRate).toFixed(2) : "0.00"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "bid" ? "Hacer Oferta" : "Crear Venta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-3 bg-neutral-100 rounded-lg">
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden relative">
              <Image src={productImage || "/placeholder.svg"} alt={productName} fill className="object-cover" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 text-sm">{productName}</p>
              <p className="text-sm text-neutral-500">Talle EU {selectedSize || "—"}</p>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-sm font-medium text-neutral-900 mb-2 block">Tu Precio (ARS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8 text-lg font-semibold"
                placeholder="0"
              />
            </div>
            {priceNum > 0 && <p className="text-xs text-neutral-500 mt-1">≈ USD ${usdEquivalent}</p>}
          </div>

          {/* Expiration */}
          <div>
            <label className="text-sm font-medium text-neutral-900 mb-2 block">Expiración</label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 días">7 días</SelectItem>
                <SelectItem value="14 días">14 días</SelectItem>
                <SelectItem value="30 días">30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-neutral-100 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">{mode === "bid" ? "Tu oferta" : "Precio de venta"}</span>
              <span className="text-neutral-900">{formatARS(priceNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Comisión (9.5%)</span>
              <span className="text-neutral-900">
                {mode === "bid" ? "+" : "-"} {formatARS(fee)}
              </span>
            </div>
            <hr className="border-neutral-200" />
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-900">{mode === "bid" ? "Total a pagar" : "Vas a recibir"}</span>
              <span className="text-primary-600">{formatARS(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedSize || priceNum <= 0}
            >
              {mode === "bid" ? "Confirmar Oferta" : "Publicar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
