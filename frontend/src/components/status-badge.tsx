import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "filled" | "expired" | "cancelled" | "pending" | "processing" | "shipped" | "delivered"
}

const statusConfig = {
  active: { label: "Activo", className: "bg-primary-100 text-primary-700" },
  filled: { label: "Completado", className: "bg-secondary-100 text-secondary-700" },
  expired: { label: "Expirado", className: "bg-neutral-100 text-neutral-500" },
  cancelled: { label: "Cancelado", className: "bg-danger-100 text-danger-700" },
  pending: { label: "Pendiente", className: "bg-warning-100 text-warning-700" },
  processing: { label: "Procesando", className: "bg-secondary-100 text-secondary-700" },
  shipped: { label: "Enviado", className: "bg-primary-100 text-primary-700" },
  delivered: { label: "Entregado", className: "bg-primary-100 text-primary-700" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  )
}
