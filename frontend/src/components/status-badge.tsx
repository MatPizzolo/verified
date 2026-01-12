import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 
    | "active" 
    | "filled" 
    | "expired" 
    | "cancelled" 
    | "pending" 
    | "processing" 
    | "shipped" 
    | "delivered"
    | "pending_payment"
    | "pending_shipment"
    | "in_transit_to_auth"
    | "authenticating"
    | "authenticated"
    | "authentication_failed"
    | "shipped_to_buyer"
    | "completed"
    | "refunded"
}

const statusConfig = {
  // Listing statuses
  active: { label: "Activo", className: "bg-primary-100 text-primary-700" },
  filled: { label: "Completado", className: "bg-secondary-100 text-secondary-700" },
  expired: { label: "Expirado", className: "bg-neutral-100 text-neutral-500" },
  cancelled: { label: "Cancelado", className: "bg-danger-100 text-danger-700" },
  
  // Transaction statuses
  pending_payment: { label: "Pago Pendiente", className: "bg-warning-100 text-warning-700" },
  pending_shipment: { label: "Envío Pendiente", className: "bg-warning-100 text-warning-700" },
  in_transit_to_auth: { label: "En Tránsito", className: "bg-secondary-100 text-secondary-700" },
  authenticating: { label: "Autenticando", className: "bg-secondary-100 text-secondary-700" },
  authenticated: { label: "Autenticado", className: "bg-primary-100 text-primary-700" },
  authentication_failed: { label: "Autenticación Fallida", className: "bg-danger-100 text-danger-700" },
  shipped_to_buyer: { label: "Enviado al Comprador", className: "bg-primary-100 text-primary-700" },
  completed: { label: "Completado", className: "bg-primary-100 text-primary-700" },
  refunded: { label: "Reembolsado", className: "bg-neutral-100 text-neutral-600" },
  
  // Legacy statuses (for backward compatibility)
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
