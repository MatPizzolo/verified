"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/status-badge"
import { formatARS, formatDate } from "@/lib/format"
import type { Bid, Ask, Transaction } from "@/lib/types"

type Tab = "bids" | "asks" | "transactions"

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("bids")
  const [bids, setBids] = useState<Bid[]>([])
  const [asks, setAsks] = useState<Ask[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch bids
        const bidsRes = await fetch('http://localhost:4000/api/bids?status=all', {
          credentials: 'include',
        })
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json()
          setBids(bidsData.bids?.map((b: any) => ({
            id: b.id,
            product_name: b.variant?.product?.name || 'Unknown',
            product_image: b.variant?.product?.image_url || '',
            size: b.variant?.size_eu || 0,
            price: b.price_ars,
            status: b.status,
            created_at: b.created_at,
            expires_at: b.expires_at,
          })) || [])
        }

        // Fetch asks
        const asksRes = await fetch('http://localhost:4000/api/asks?status=all', {
          credentials: 'include',
        })
        if (asksRes.ok) {
          const asksData = await asksRes.json()
          setAsks(asksData.asks?.map((a: any) => ({
            id: a.id,
            product_name: a.variant?.product?.name || 'Unknown',
            product_image: a.variant?.product?.image_url || '',
            size: a.variant?.size_eu || 0,
            price: a.price_ars,
            status: a.status,
            created_at: a.created_at,
            expires_at: a.expires_at,
          })) || [])
        }

        // TODO: Fetch transactions when endpoint is ready
        setTransactions([])
      } catch (err) {
        setError('Error al cargar datos')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const counts = {
    bids: bids.length,
    asks: asks.length,
    transactions: transactions.length,
  }

  const activeBids = bids.filter(b => b.status === 'active').length
  const activeAsks = asks.filter(a => a.status === 'active').length
  const completedTransactions = transactions.filter(t => t.status === 'delivered').length

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Mi Dashboard</h1>
          <p className="text-neutral-500 mt-1">Gestioná tus ofertas, ventas y transacciones</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-sm text-neutral-500 mb-1">Ofertas Activas</p>
            <p className="text-2xl font-bold text-neutral-900">{activeBids}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-sm text-neutral-500 mb-1">Ventas Activas</p>
            <p className="text-2xl font-bold text-neutral-900">{activeAsks}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-sm text-neutral-500 mb-1">Compras Completadas</p>
            <p className="text-2xl font-bold text-neutral-900">{completedTransactions}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-8">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab("bids")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "bids"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Mis Ofertas ({counts.bids})
            </button>
            <button
              onClick={() => setActiveTab("asks")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "asks"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Mis Ventas ({counts.asks})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Transacciones ({counts.transactions})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">Cargando...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger-600">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === "bids" && <BidsTable bids={bids} />}
            {activeTab === "asks" && <AsksTable asks={asks} />}
            {activeTab === "transactions" && <TransactionsTable transactions={transactions} />}
          </>
        )}
      </div>
    </div>
  )
}

function BidsTable({ bids }: { bids: Bid[] }) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No tenés ofertas activas</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
            <th className="pb-3 font-medium">Producto</th>
            <th className="pb-3 font-medium">Talle</th>
            <th className="pb-3 font-medium">Oferta</th>
            <th className="pb-3 font-medium">Estado</th>
            <th className="pb-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {bids.map((bid) => (
            <tr key={bid.id} className="text-sm">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden">
                    {bid.product_image && (
                      <img src={bid.product_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-medium text-neutral-900">{bid.product_name}</span>
                </div>
              </td>
              <td className="py-4 text-neutral-600">EU {bid.size}</td>
              <td className="py-4 font-medium text-neutral-900">{formatARS(bid.price)}</td>
              <td className="py-4">
                <StatusBadge status={bid.status} />
              </td>
              <td className="py-4 text-neutral-500">{formatDate(bid.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AsksTable({ asks }: { asks: Ask[] }) {
  if (asks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No tenés ventas activas</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
            <th className="pb-3 font-medium">Producto</th>
            <th className="pb-3 font-medium">Talle</th>
            <th className="pb-3 font-medium">Precio</th>
            <th className="pb-3 font-medium">Estado</th>
            <th className="pb-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {asks.map((ask) => (
            <tr key={ask.id} className="text-sm">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden">
                    {ask.product_image && (
                      <img src={ask.product_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-medium text-neutral-900">{ask.product_name}</span>
                </div>
              </td>
              <td className="py-4 text-neutral-600">EU {ask.size}</td>
              <td className="py-4 font-medium text-neutral-900">{formatARS(ask.price)}</td>
              <td className="py-4">
                <StatusBadge status={ask.status} />
              </td>
              <td className="py-4 text-neutral-500">{formatDate(ask.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No tenés transacciones</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
            <th className="pb-3 font-medium">Producto</th>
            <th className="pb-3 font-medium">Talle</th>
            <th className="pb-3 font-medium">Precio</th>
            <th className="pb-3 font-medium">Tipo</th>
            <th className="pb-3 font-medium">Estado</th>
            <th className="pb-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {transactions.map((tx) => (
            <tr key={tx.id} className="text-sm">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden">
                    {tx.product_image && (
                      <img src={tx.product_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-medium text-neutral-900">{tx.product_name}</span>
                </div>
              </td>
              <td className="py-4 text-neutral-600">EU {tx.size}</td>
              <td className="py-4 font-medium text-neutral-900">{formatARS(tx.price)}</td>
              <td className="py-4">
                <span className={`text-xs font-medium ${tx.type === 'buy' ? 'text-primary-600' : 'text-secondary-600'}`}>
                  {tx.type === 'buy' ? 'Compra' : 'Venta'}
                </span>
              </td>
              <td className="py-4">
                <StatusBadge status={tx.status} />
              </td>
              <td className="py-4 text-neutral-500">{formatDate(tx.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
