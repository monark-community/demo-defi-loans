"use client"

import { RotateCcwIcon, TrendingDownIcon } from "lucide-react"
import { useState } from "react"

import { HealthRuler, type RulerDot } from "@/components/risk/health-ruler"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { t } from "@/i18n/t"
import type { Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"
import { statusOf } from "@/lib/demo/risk"
import { TOKENS } from "@/lib/demo/tokens"
import { formatChange, formatHf, formatPrice } from "@/lib/format"

/**
 * Nine example vaults, described by their health factor at the reference
 * price, the share of their solvency that comes from tETH, and their size.
 * HF(price) = hf0 × (ethShare × price / reference + (1 − ethShare)).
 */
const EXAMPLES = [
  { id: "a", hf0: 1.12, eth: 1, size: 26 },
  { id: "b", hf0: 1.3, eth: 1, size: 20 },
  { id: "c", hf0: 1.45, eth: 0.9, size: 30 },
  { id: "d", hf0: 1.63, eth: 1, size: 24, yours: true },
  { id: "e", hf0: 1.82, eth: 0.4, size: 32 },
  { id: "f", hf0: 2.1, eth: 1, size: 18 },
  { id: "g", hf0: 1.21, eth: 0.6, size: 16 },
  { id: "h", hf0: 2.6, eth: 1, size: 28 },
  { id: "i", hf0: 3.05, eth: 0.2, size: 14 },
]

const REF = TOKENS.tETH.usd

export function StressWidget({
  locale,
  copy,
  zones,
  statusLabels,
  lineLabel,
  youLabel,
}: {
  locale: Locale
  copy: Dictionary["home"]["widget"]
  zones: Record<"safe" | "at_risk" | "liquidatable", string>
  statusLabels: Record<"safe" | "at_risk" | "liquidatable", string>
  lineLabel: string
  youLabel: string
}) {
  // Slider in whole percent of the reference price (40–120).
  const [pct, setPct] = useState(100)
  const ratio = pct / 100
  const price = REF * ratio

  const dots: RulerDot[] = EXAMPLES.map((e) => {
    const hf = e.hf0 * (e.eth * ratio + (1 - e.eth))
    return {
      id: e.id,
      hf,
      size: e.size,
      yours: e.yours,
      label: `${formatHf(hf, locale)} · ${statusLabels[statusOf(hf)]}`,
    }
  })
  const liquidatable = dots.filter((d) => statusOf(d.hf) === "liquidatable").length
  const atRisk = dots.filter((d) => statusOf(d.hf) === "at_risk").length

  return (
    <figure className="relative rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="widget-title">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span id="widget-title" className="text-sm font-bold">
          {copy.title}
        </span>
        <span className="text-xs text-muted-foreground">{copy.hint}</span>
      </figcaption>

      <div className="mt-5" aria-label={copy.ruler} role="group">
        <HealthRuler
          dots={dots}
          zones={zones}
          lineLabel={lineLabel}
          youLabel={youLabel}
          formatTick={(v) => formatHf(v, locale)}
          assumedWidth={520}
        />
      </div>

      <div className="mt-4 rounded-2xl border bg-background/60 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="widget-price" className="text-sm font-semibold">
            {copy.slider}
          </label>
          <p className="text-right tnum">
            <span className="text-xl font-extrabold">{formatPrice(price, locale)}</span>{" "}
            <span className={pct < 100 ? "text-sm font-bold text-danger" : "text-sm text-muted-foreground"}>
              {pct === 100 ? "" : formatChange(ratio - 1, locale)}
            </span>
          </p>
        </div>
        <Slider
          id="widget-price"
          min={40}
          max={120}
          step={1}
          value={[pct]}
          onValueChange={(v) => setPct(v[0] ?? 100)}
          thumbLabel={copy.slider}
          aria-valuetext={formatPrice(price, locale)}
          className="mt-1"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setPct(75)} aria-pressed={pct === 75}>
            <TrendingDownIcon aria-hidden="true" />
            {copy.crash}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setPct(100)} disabled={pct === 100}>
            <RotateCcwIcon aria-hidden="true" />
            {copy.reset}
          </Button>
          <p aria-live="polite" className="ml-auto text-sm font-bold tnum">
            {liquidatable > 0 ? (
              <span className="text-danger">{t(copy.count, { n: liquidatable })}</span>
            ) : (
              <span className="text-muted-foreground">{copy.countNone}</span>
            )}
            {atRisk > 0 ? <span className="text-warning"> · {t(copy.atRisk, { n: atRisk })}</span> : null}
          </p>
        </div>
      </div>
    </figure>
  )
}
