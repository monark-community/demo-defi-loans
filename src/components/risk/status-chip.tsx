import { ShieldCheckIcon, SirenIcon, TriangleAlertIcon } from "lucide-react"

import type { VaultStatus } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

const STYLE: Record<VaultStatus, { icon: typeof ShieldCheckIcon; cls: string }> = {
  safe: { icon: ShieldCheckIcon, cls: "border-success/40 bg-success/10 text-success" },
  at_risk: { icon: TriangleAlertIcon, cls: "border-warning/50 bg-warning/10 text-warning" },
  liquidatable: { icon: SirenIcon, cls: "border-danger/50 bg-danger/10 text-danger" },
}

/** Status is always colour + icon + text label (family convention). */
export function StatusChip({ status, label, className }: { status: VaultStatus; label: string; className?: string }) {
  const { icon: Icon, cls } = STYLE[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap", cls, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

/** Text colour class for a status (numbers next to a chip). */
export const statusText: Record<VaultStatus, string> = {
  safe: "text-success",
  at_risk: "text-warning",
  liquidatable: "text-danger",
}
