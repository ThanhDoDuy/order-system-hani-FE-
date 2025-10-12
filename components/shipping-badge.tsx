import { cn } from "@/lib/utils"

interface ShippingBadgeProps {
  service: "standard" | "priority" | "express"
}

export function ShippingBadge({ service }: ShippingBadgeProps) {
  const getServiceStyles = () => {
    switch (service) {
      case "standard":
        return "text-info"
      case "priority":
        return "text-chart-2"
      case "express":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 rounded-full", getServiceStyles().replace("text-", "bg-"))} />
      <span className="text-sm capitalize">{service}</span>
    </div>
  )
}
