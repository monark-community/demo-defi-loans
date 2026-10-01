import Link from "next/link"
import type { ComponentProps } from "react"

import { HF_AT_RISK, HF_LIQUIDATION } from "@/lib/demo/tokens"
import { RULER_MAX, rulerPosition, statusOf } from "@/lib/demo/risk"
import type { VaultStatus } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

export interface RulerDot {
  id: string
  hf: number
  /** Diameter in px. */
  size: number
  yours?: boolean
  href?: string
  label: string
  /** Where the dot was before (governance preview): drawn as a dashed ghost. */
  ghostHf?: number
  highlight?: boolean
}

const FILL: Record<VaultStatus, string> = {
  safe: "border-success bg-[color-mix(in_oklch,var(--success)_22%,var(--card))]",
  at_risk: "border-warning bg-[color-mix(in_oklch,var(--warning)_26%,var(--card))]",
  liquidatable: "border-danger bg-[color-mix(in_oklch,var(--danger)_24%,var(--card))]",
}

const LANE = 30
const pct = (hf: number) => `${(rulerPosition(hf) * 100).toFixed(3)}%`

/** Greedy lanes so dots do not overlap. */
function lanes(dots: RulerDot[], width: number): Map<string, number> {
  const sorted = [...dots].sort((a, b) => rulerPosition(a.hf) - rulerPosition(b.hf) || a.id.localeCompare(b.id))
  const ends: number[] = []
  const out = new Map<string, number>()
  for (const d of sorted) {
    const x = rulerPosition(d.hf) * width
    let lane = ends.findIndex((end) => end < x - d.size / 2 - 4)
    if (lane === -1) {
      lane = ends.length
      ends.push(0)
    }
    ends[lane] = x + d.size / 2
    out.set(d.id, lane)
  }
  return out
}

/**
 * The health ruler: every vault as a dot on one health-factor axis, with the
 * liquidatable / at-risk / safe bands and the 1.00 liquidation line.
 * Presentational only; positions animate with CSS when health factors change.
 */
export function HealthRuler({
  dots,
  zones,
  lineLabel,
  youLabel,
  ticks = [1.25, 1.5, 2, 3],
  formatTick,
  assumedWidth = 900,
  legend,
  className,
}: {
  dots: RulerDot[]
  zones: Record<VaultStatus, string>
  lineLabel: string
  youLabel?: string
  ticks?: number[]
  formatTick: (hf: number) => string
  /** Width used to compute lanes (a narrow ruler passes a smaller one). */
  assumedWidth?: number
  /** Extra legend text (e.g. "Dot size shows debt"), or false to hide the legend row. */
  legend?: string | false
  className?: string
}) {
  const laneOf = lanes(dots, assumedWidth)
  const laneCount = Math.max(1, ...[...laneOf.values()].map((l) => l + 1))
  const top = 46
  const height = top + laneCount * LANE + 34
  const legendHeight = legend === false ? 0 : 24
  const liq = rulerPosition(HF_LIQUIDATION) * 100
  const risk = rulerPosition(HF_AT_RISK) * 100

  return (
    <div className={cn("w-full select-none", className)}>
    <div className="relative w-full" style={{ height }}>
      {/* Bands span the full width; everything positioned by HF sits in a padded track so edge dots stay visible. */}
      {/* Bands */}
      <div aria-hidden="true" className="absolute top-8 right-5 bottom-7 left-3 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 left-0 bg-danger/10" style={{ width: `${liq}%` }} />
        <div className="absolute inset-y-0 bg-warning/12" style={{ left: `${liq}%`, width: `${risk - liq}%` }} />
        <div className="absolute inset-y-0 right-0 bg-success/10" style={{ left: `${risk}%` }} />
      </div>
      {/* Zone labels */}
      <div aria-hidden="true" className="absolute top-0 right-5 left-3 h-6 text-[0.6875rem] font-bold tracking-wide uppercase">
        <span className="absolute left-0 text-danger">{zones.liquidatable}</span>
        {assumedWidth >= 600 ? (
          <span className="absolute hidden -translate-x-1/2 whitespace-nowrap text-warning md:inline" style={{ left: `${(liq + risk) / 2}%` }}>
            {zones.at_risk}
          </span>
        ) : null}
        <span className="absolute right-0 text-success">{zones.safe}</span>
      </div>
      <div className="absolute inset-y-0 right-5 left-3">
      {/* Liquidation line */}
      <div aria-hidden="true" className="absolute top-6 bottom-5 w-0.5 -translate-x-1/2 rounded-full bg-primary" style={{ left: `${liq}%` }} />
      {/* Ticks: 1.00 is the liquidation line */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-5 text-[0.6875rem] text-muted-foreground tnum">
        <span className="absolute -translate-x-1/2 font-extrabold text-primary-ink" style={{ left: `${liq}%` }}>
          {formatTick(HF_LIQUIDATION)}
        </span>
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
            {t >= RULER_MAX ? `${formatTick(t)}+` : formatTick(t)}
          </span>
        ))}
      </div>
      {/* Ghosts: where dots were before a change */}
      {dots
        .filter((d) => d.ghostHf !== undefined && Math.abs((d.ghostHf ?? 0) - d.hf) > 0.005)
        .map((d) => (
          <span
            key={`g-${d.id}`}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-muted-foreground/60"
            style={{ left: pct(d.ghostHf ?? d.hf), top: top + (laneOf.get(d.id) ?? 0) * LANE + LANE / 2, width: d.size, height: d.size }}
          />
        ))}
      {/* Dots */}
      {dots.map((d) => {
        const status = statusOf(d.hf)
        const style = {
          left: pct(d.hf),
          top: top + (laneOf.get(d.id) ?? 0) * LANE + LANE / 2,
          width: d.size,
          height: d.size,
        }
        const cls = cn(
          "vl-glide absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
          FILL[status],
          d.yours && "ring-[3px] ring-primary ring-offset-2 ring-offset-card",
          d.highlight && "outline-2 outline-offset-4 outline-foreground/70 outline-dashed",
          d.href && "hover:z-10 hover:border-[3px] focus-visible:z-10"
        )
        const you =
          d.yours && youLabel ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full text-[0.625rem] leading-none font-extrabold text-primary-ink uppercase"
            >
              {youLabel}
            </span>
          ) : null
        return d.href ? (
          <Link key={d.id} href={d.href} aria-label={d.label} title={d.label} className={cls} style={style}>
            {you}
          </Link>
        ) : (
          <span key={d.id} role="img" aria-label={d.label} title={d.label} className={cls} style={style}>
            {you}
          </span>
        )
      })}
      </div>
    </div>
    {legend !== false ? (
      <p aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground" style={{ minHeight: legendHeight }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-0.5 rounded-full bg-primary" />
          {lineLabel}
        </span>
        {youLabel ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-muted-foreground ring-2 ring-primary ring-offset-1 ring-offset-card" />
            {youLabel}
          </span>
        ) : null}
        {legend ? <span>{legend}</span> : null}
      </p>
    ) : null}
    </div>
  )
}

/**
 * Two rulers: lanes computed for a phone-width track below `md`, and for a
 * wide track above it. The hidden one is display:none, so it is out of the
 * accessibility tree and focus order.
 */
export function ResponsiveRuler({
  narrowWidth = 330,
  ...props
}: ComponentProps<typeof HealthRuler> & { narrowWidth?: number }) {
  return (
    <>
      <div className="md:hidden">
        <HealthRuler {...props} assumedWidth={narrowWidth} />
      </div>
      <div className="hidden md:block">
        <HealthRuler {...props} />
      </div>
    </>
  )
}

/** Dot diameter from debt in USD (square-root scale, 14–34 px). */
export function dotSize(debtUsd: number): number {
  const t = Math.sqrt(Math.max(0, Math.min(debtUsd, 30000)) / 30000)
  return Math.round(14 + t * 20)
}
