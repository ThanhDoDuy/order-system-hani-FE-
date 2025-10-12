import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "order" | "product"
}

export function StatusBadge({ status, variant = "order" }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (variant === "order") {
      switch (status) {
        case "new":
          return "bg-info/10 text-info border-info/20"
        case "preparing":
          return "bg-warning/10 text-warning border-warning/20"
        case "shipped":
          return "bg-success/10 text-success border-success/20"
        case "cancelled":
          return "bg-destructive/10 text-destructive border-destructive/20"
        case "rejected":
          return "bg-destructive/10 text-destructive border-destructive/20"
        case "draft":
          return "bg-muted text-muted-foreground border-border"
        default:
          return "bg-muted text-muted-foreground border-border"
      }
    } else {
      switch (status) {
        case "active":
          return "bg-success/10 text-success border-success/20"
        case "inactive":
          return "bg-muted text-muted-foreground border-border"
        default:
          return "bg-muted text-muted-foreground border-border"
      }
    }
  }

  const getStatusLabel = () => {
    if (variant === "order") {
      switch (status) {
        case "new":
          return "New order"
        case "preparing":
          return "Preparing"
        case "shipped":
          return "Shipped"
        case "cancelled":
          return "Cancelled"
        case "rejected":
          return "Rejected"
        case "draft":
          return "Draft"
        default:
          return status
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", getStatusStyles())}
    >
      {getStatusLabel()}
    </span>
  )
}
