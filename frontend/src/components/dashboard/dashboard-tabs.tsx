"use client"

import { cn } from "@/lib/utils"

type Tab = "bids" | "asks" | "transactions"

interface DashboardTabsProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  counts: {
    bids: number
    asks: number
    transactions: number
  }
}

export function DashboardTabs({ activeTab, onTabChange, counts }: DashboardTabsProps) {
  const tabs = [
    { id: "bids" as const, label: "Mis Ofertas", count: counts.bids },
    { id: "asks" as const, label: "Mis Ventas", count: counts.asks },
    { id: "transactions" as const, label: "Transacciones", count: counts.transactions },
  ]

  return (
    <div className="border-b border-neutral-200">
      <nav className="flex gap-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative py-4 text-sm font-medium transition-colors",
              activeTab === tab.id ? "text-primary-600" : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500",
                )}
              >
                {tab.count}
              </span>
            </span>
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
