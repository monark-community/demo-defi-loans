"use client"

import { ArrowRightIcon } from "lucide-react"

import { HealthRuler } from "@/components/risk/health-ruler"
import { StatusChip, statusText } from "@/components/risk/status-chip"
import { t } from "@/i18n/t"
import {
  borrowLimitUsd,
  debtUsd,
  healthFactor,
  liquidationPrice,
  ltv,
  statusOf,
  type Position,
  type Prices,
} from "@/lib/demo/risk"
import { COLLATERAL } from "@/lib/demo/tokens"
import type { RiskParams } from "@/lib/demo/types"
import { formatHf, formatPct, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/**
 * Pre-trade simulation: health factor (before → after), a one-dot ruler,
 * LTV, borrow limit used and a liquidation price per collateral asset.
 */
export function PositionPreview({
  after,
  before,
  prices,
  params,
  title,
  className,
}: {
  after: Position
  before?: Position
  prices: Prices
  params: RiskParams
  title?: string
  className?: string
}) {
  const { app, locale, status } = useAppCopy()
  const o = app.open.preview
  const m = app.console.map
  const hf = healthFactor(after, prices, params)
  const hfBefore = before ? healthFactor(before, prices, params) : undefined
  const changed = hfBefore !== undefined && Math.abs((Number.isFinite(hfBefore) ? hfBefore : 99) - (Number.isFinite(hf) ? hf : 99)) > 0.004
  const st = statusOf(hf)
  const limit = borrowLimitUsd(after, prices, params)
  const used = limit > 0 ? debtUsd(after) / limit : 0
  const assets = COLLATERAL.filter((c) => (after.collateral[c] ?? 0) > 0)

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {title ? <p className="text-sm font-bold">{title}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{o.hf}</span>
        <span className="flex items-center gap-2 tnum" aria-live="polite">
          {changed && hfBefore !== undefined ? (
            <>
              <span className="text-muted-foreground line-through">{formatHf(hfBefore, locale)}</span>
              <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </>
          ) : null}
          <span className={cn("text-2xl font-extrabold", Number.isFinite(hf) ? statusText[st] : "")}>{formatHf(hf, locale)}</span>
          <StatusChip status={st} label={Number.isFinite(hf) ? status[st] : status.noDebt} />
        </span>
      </div>

      <HealthRuler
        dots={[
          {
            id: "you",
            hf: Number.isFinite(hf) ? hf : 99,
            size: 22,
            yours: true,
            label: `${o.hf} ${formatHf(hf, locale)}`,
            ghostHf: changed && hfBefore !== undefined ? (Number.isFinite(hfBefore) ? hfBefore : 99) : undefined,
          },
        ]}
        zones={m.zones}
        lineLabel={m.line}
        formatTick={(v) => formatHf(v, locale)}
        assumedWidth={400}
        legend={false}
      />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border px-3 py-2">
          <dt className="text-xs text-muted-foreground">{o.ltv}</dt>
          <dd className="font-bold tnum">{formatPct(ltv(after, prices), locale)}</dd>
        </div>
        <div className="rounded-xl border px-3 py-2">
          <dt className="text-xs text-muted-foreground">{o.limit}</dt>
          <dd className="font-bold tnum">{formatPct(Math.min(used, 9.99), locale, 0)}</dd>
          <dd aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <span className={cn("block h-full rounded-full transition-[width] duration-200", used > 1 ? "bg-danger" : used > 0.85 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(100, used * 100)}%` }} />
          </dd>
        </div>
        {assets.map((a) => {
          const lp = liquidationPrice(after, a, prices, params)
          return (
            <div key={a} className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-3 rounded-xl border px-3 py-2">
              <dt className="text-xs text-muted-foreground">{t(o.liqPrice, { asset: a })}</dt>
              <dd className="text-right tnum">
                {lp === null ? (
                  <span className="font-bold text-muted-foreground">{o.notReachable}</span>
                ) : (
                  <>
                    <span className="font-bold">{formatPrice(lp, locale)}</span>
                    {lp < prices[a] ? (
                      <span className="ml-2 text-xs text-muted-foreground">{t(o.drop, { pct: formatPct(1 - lp / prices[a], locale, 1) })}</span>
                    ) : (
                      <span className="ml-2 text-xs font-semibold text-danger">{t(o.above, { pct: formatPct(lp / prices[a] - 1, locale, 1) })}</span>
                    )}
                  </>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
