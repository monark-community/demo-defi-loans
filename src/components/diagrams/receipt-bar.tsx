import { cn } from "@/lib/utils"

/**
 * Signature moment: the seized collateral splits into the part that covers
 * the debt repaid and the liquidator's bonus. The bar grows in (vl-grow).
 */
export function ReceiptBar({
  coversLabel,
  bonusLabel,
  coversValue,
  bonusValue,
  bonusShare,
  animate = true,
  className,
}: {
  coversLabel: string
  bonusLabel: string
  coversValue: string
  bonusValue: string
  /** Bonus ÷ total seized value (0–1). */
  bonusShare: number
  animate?: boolean
  className?: string
}) {
  const bonusPct = Math.max(4, Math.min(40, bonusShare * 100))
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className={cn("flex h-4 w-full overflow-hidden rounded-full border", animate && "vl-grow")} aria-hidden="true">
        <span className="h-full bg-chart-3/70" style={{ width: `${100 - bonusPct}%` }} />
        <span className="h-full border-l-2 border-card bg-primary" style={{ width: `${bonusPct}%` }} />
      </div>
      <dl className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-3/70" aria-hidden="true" />
          <dt className="text-muted-foreground">{coversLabel}</dt>
          <dd className="font-bold tnum">{coversValue}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
          <dt className="text-muted-foreground">{bonusLabel}</dt>
          <dd className="font-bold tnum">{bonusValue}</dd>
        </div>
      </dl>
    </div>
  )
}
