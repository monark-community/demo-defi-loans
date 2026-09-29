"use client"

import { ArrowRightIcon, BellIcon, ChevronDownIcon, PlusIcon, RotateCcwIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { dotSize, ResponsiveRuler } from "@/components/risk/health-ruler"
import { StatusChip, statusText } from "@/components/risk/status-chip"
import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { Slider } from "@/components/ui/slider"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { setShocks } from "@/lib/demo/ops"
import {
  collateralUsd,
  debtUsd,
  healthFactor,
  largestCollateral,
  liquidationPrice,
  protocolStats,
  statePrices,
  statusOf,
} from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL, TOKENS } from "@/lib/demo/tokens"
import type { AlertEvent, CollateralSymbol, DemoState, Vault, VaultStatus } from "@/lib/demo/types"
import { formatChange, formatDateTime, formatHf, formatPrice, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { CollateralList, Owner } from "./vault-bits"

type Filter = "all" | "yours" | "at_risk" | "liquidatable"
const PAGE = 6

export function Console() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const c = app.console
  if (!demo) return null

  const prices = statePrices(demo)
  const stats = protocolStats(demo.vaults, prices, demo.params)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{c.title}</h1>
        <Button asChild className="sm:hidden">
          <Link href={href(locale, "/app/open")}>
            <PlusIcon aria-hidden="true" />
            {app.nav.open}
          </Link>
        </Button>
      </div>

      {/* Protocol stats */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={c.stats.collateral} value={formatUsd(stats.collateralUsd, locale, true)} hint={t(c.stats.collateralRatio, { ratio: formatPctPlain(stats.collateralRatio, locale) })} />
        <Stat label={c.stats.debt} value={formatUsd(stats.debtUsd, locale, true)} />
        <Stat
          label={c.stats.atRisk}
          value={formatUsd(stats.atRiskDebtUsd, locale, true)}
          hint={stats.atRisk + stats.liquidatable === 1 ? c.stats.atRiskHintOne : t(c.stats.atRiskHint, { n: stats.atRisk + stats.liquidatable })}
          tone={stats.atRiskDebtUsd > 0 ? "text-warning" : undefined}
        />
        <Stat
          label={c.stats.liquidatable}
          value={String(stats.liquidatable)}
          hint={t(c.stats.liquidatableHint, { n: stats.vaults })}
          tone={stats.liquidatable > 0 ? "text-danger" : undefined}
        />
      </dl>

      <RiskMap demo={demo} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <StressTest demo={demo} />
        <Alerts alerts={demo.alerts} />
      </div>

      <VaultTable demo={demo} />
    </div>
  )
}

function formatPctPlain(ratio: number, locale: "en" | "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "percent", maximumFractionDigits: 0 }).format(ratio)
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 text-2xl font-extrabold tracking-display tnum transition-colors duration-200 sm:text-[1.75rem]", tone)}>{value}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-muted-foreground tnum">{hint}</dd> : null}
    </div>
  )
}

function RiskMap({ demo }: { demo: DemoState }) {
  const { app, locale, status } = useAppCopy()
  const m = app.console.map
  const prices = statePrices(demo)
  const dots = demo.vaults.map((v) => {
    const hf = healthFactor(v, prices, demo.params)
    const yours = v.owner === demo.wallet.address
    const vars = { n: v.number, hf: formatHf(hf, locale), status: Number.isFinite(hf) ? status[statusOf(hf)] : status.noDebt }
    return {
      id: v.id,
      hf: Number.isFinite(hf) ? hf : 99,
      size: dotSize(debtUsd(v)),
      yours,
      href: href(locale, `/app/vaults/${v.id}`),
      label: t(yours ? m.dotYours : m.dot, vars),
    }
  })

  return (
    <section id="risk-map" aria-labelledby="map-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-1">
        <h2 id="map-title" className="text-xl font-bold">
          {m.title}
        </h2>
        <InfoTip label={m.infoLabel}>{m.info}</InfoTip>
      </div>
      <div className="mt-5 pt-1">
        <ResponsiveRuler
          dots={dots}
          zones={m.zones}
          lineLabel={m.line}
          youLabel={m.you}
          legend={m.size}
          formatTick={(v) => formatHf(v, locale)}
          assumedWidth={1000}
        />
      </div>
    </section>
  )
}

const PRESETS: { key: "crash" | "selloff" | "link" | "reset"; shocks: Record<CollateralSymbol, number> }[] = [
  { key: "crash", shocks: { tETH: 0.75, tWBTC: 1, tLINK: 1 } },
  { key: "selloff", shocks: { tETH: 0.85, tWBTC: 0.85, tLINK: 0.85 } },
  { key: "link", shocks: { tETH: 1, tWBTC: 1, tLINK: 0.7 } },
]

function StressTest({ demo }: { demo: DemoState }) {
  const { app, locale } = useAppCopy()
  const s = app.console.stress
  const isReference = COLLATERAL.every((a) => demo.shocks[a] === 1)

  return (
    <section id="stress-test" aria-labelledby="stress-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="stress-title" className="text-xl font-bold">
        {s.title}
      </h2>

      <div className="mt-5 flex flex-col gap-4">
        {COLLATERAL.map((asset) => {
          const mult = demo.shocks[asset]
          const price = TOKENS[asset].usd * mult
          const id = `shock-${asset}`
          return (
            <div key={asset}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="text-sm font-semibold">
                  {t(s.slider, { asset })}
                </label>
                <p className="text-right tnum">
                  <span className="font-extrabold">{formatPrice(price, locale)}</span>
                  {mult !== 1 ? (
                    <span className={cn("ml-1.5 text-sm font-bold", mult < 1 ? "text-danger" : "text-success")}>{formatChange(mult - 1, locale)}</span>
                  ) : (
                    <span className="ml-1.5 text-xs text-muted-foreground">{t(s.reference, { price: formatPrice(TOKENS[asset].usd, locale) })}</span>
                  )}
                </p>
              </div>
              <Slider
                id={id}
                min={40}
                max={150}
                step={1}
                value={[Math.round(mult * 100)]}
                onValueChange={(v) => setShocks({ [asset]: (v[0] ?? 100) / 100 })}
                thumbLabel={t(s.slider, { asset })}
                aria-valuetext={formatPrice(price, locale)}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="eyebrow text-muted-foreground" id="presets-label">
          {s.presets.label}
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="presets-label">
          {PRESETS.map((p) => {
            const active = COLLATERAL.every((a) => demo.shocks[a] === p.shocks[a])
            return (
              <Button key={p.key} size="sm" variant="outline" aria-pressed={active} className={cn(active && "border-primary bg-primary/10")} onClick={() => setShocks(p.shocks)}>
                {s.presets[p.key]}
              </Button>
            )
          })}
          <Button size="sm" variant="ghost" disabled={isReference} onClick={() => setShocks({ tETH: 1, tWBTC: 1, tLINK: 1 })}>
            <RotateCcwIcon aria-hidden="true" />
            {s.presets.reset}
          </Button>
        </div>
      </div>
    </section>
  )
}

const ALERT_STYLE: Record<AlertEvent["kind"], string> = {
  at_risk: "border-warning",
  liquidatable: "border-danger",
  recovered: "border-success",
  liquidated: "border-foreground",
}

function Alerts({ alerts }: { alerts: AlertEvent[] }) {
  const { app, locale } = useAppCopy()
  const a = app.console.alerts
  const shown = alerts.slice(0, 5)
  return (
    <section aria-labelledby="alerts-title" className="flex flex-col rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <BellIcon className="size-5 text-primary" aria-hidden="true" />
        <h2 id="alerts-title" className="text-xl font-bold">
          {a.title}
        </h2>
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <ol aria-live="polite" className="mt-4 flex flex-col gap-2">
          {shown.map((alert) => (
            <li key={alert.id} className={cn("vl-stamp flex items-center gap-3 rounded-2xl border border-l-4 bg-background/50 py-2.5 pr-2 pl-3", ALERT_STYLE[alert.kind])}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {t(a.kinds[alert.kind], { n: alert.vaultNumber })}
                  {alert.yours ? <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-px text-[0.6875rem] font-bold">{a.yours}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground tnum">
                  {formatDateTime(alert.at, locale)} · {app.console.table.cols.hf} {formatHf(alert.hf, locale)}
                </p>
              </div>
              <Button asChild size="icon-sm" variant="ghost">
                <Link href={href(locale, `/app/vaults/${alert.vaultId}`)} aria-label={t(a.view, { n: alert.vaultNumber })}>
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function VaultTable({ demo }: { demo: DemoState }) {
  const { app, locale, status } = useAppCopy()
  const tb = app.console.table
  const [filter, setFilter] = useState<Filter>("all")
  const [showAll, setShowAll] = useState(false)
  const prices = statePrices(demo)

  const allRows = demo.vaults
    .map((v) => ({ v, hf: healthFactor(v, prices, demo.params) }))
    .sort((a, b) => a.hf - b.hf)
    .filter(({ v, hf }) => {
      if (filter === "yours") return v.owner === demo.wallet.address
      if (filter === "at_risk") return statusOf(hf) === "at_risk"
      if (filter === "liquidatable") return statusOf(hf) === "liquidatable"
      return true
    })
  // Long lists are paged (brand guidelines §8): the riskiest vaults first, the rest on demand.
  const rows = showAll ? allRows : allRows.slice(0, PAGE)
  const hidden = allRows.length - PAGE

  return (
    <section aria-labelledby="vaults-title" className="rounded-3xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <h2 id="vaults-title" className="text-xl font-bold">
          {tb.title}
        </h2>
        <div role="group" aria-label={tb.filterLabel} className="flex flex-wrap gap-1.5">
          {(Object.keys(tb.filters) as Filter[]).map((f) => (
            <Button key={f} size="xs" variant={filter === f ? "default" : "outline"} aria-pressed={filter === f} onClick={() => {
                setFilter(f)
                setShowAll(false)
              }} className="h-8 px-3">
              {tb.filters[f]}
            </Button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border-t p-8 text-center text-sm text-muted-foreground">
          <p>{filter === "yours" ? tb.emptyYours : tb.empty}</p>
          {filter === "yours" ? (
            <Button asChild size="sm" className="mt-4">
              <Link href={href(locale, "/app/open")}>
                <PlusIcon aria-hidden="true" />
                {app.nav.open}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden border-t md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{tb.caption}</caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-3 font-semibold">{tb.cols.vault}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{tb.cols.collateral}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{tb.cols.debt}</th>
                  <th scope="col" className="px-3 py-3 font-semibold">{tb.cols.hf}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{tb.cols.liqPrice}</th>
                  <th scope="col" className="w-12 px-3 py-3"><span className="sr-only">{tb.cols.vault}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ v, hf }) => (
                  <VaultRow key={v.id} v={v} hf={hf} demo={demo} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="flex flex-col divide-y border-t md:hidden">
            {rows.map(({ v, hf }) => {
              const st: VaultStatus = statusOf(hf)
              const yours = v.owner === demo.wallet.address
              return (
                <li key={v.id}>
                  <Link href={href(locale, `/app/vaults/${v.id}`)} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50" aria-label={t(tb.open, { n: v.number })}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold tnum">#{v.number}</span>
                        <Owner address={v.owner} yours={yours} youLabel={tb.you} />
                      </div>
                      <CollateralList collateral={v.collateral} locale={locale} className="mt-1.5 text-sm" />
                      <p className="mt-1 text-sm text-muted-foreground tnum">
                        {tb.cols.debt}: {formatToken(v.debt, v.debtToken, locale)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("text-xl font-extrabold tnum", statusText[st])}>{formatHf(hf, locale)}</span>
                      <StatusChip status={st} label={Number.isFinite(hf) ? status[st] : status.noDebt} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          {hidden > 0 ? (
            <div className="border-t p-3 text-center">
              <Button size="sm" variant="ghost" aria-expanded={showAll} onClick={() => setShowAll((x) => !x)}>
                {showAll ? tb.showLess : t(tb.showAll, { n: allRows.length })}
                <ChevronDownIcon className={cn("transition-transform", showAll && "rotate-180")} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

function VaultRow({ v, hf, demo }: { v: Vault; hf: number; demo: DemoState }) {
  const { app, locale, status } = useAppCopy()
  const tb = app.console.table
  const prices = statePrices(demo)
  const st = statusOf(hf)
  const yours = v.owner === demo.wallet.address
  const main = largestCollateral(v, prices)
  const lp = liquidationPrice(v, main, prices, demo.params)
  return (
    <tr className={cn("border-t align-middle transition-colors hover:bg-muted/40", yours && "bg-primary/5")}>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2">
          <Link href={href(locale, `/app/vaults/${v.id}`)} className="font-extrabold tnum underline-offset-4 hover:underline">
            #{v.number}
          </Link>
          <Owner address={v.owner} yours={yours} youLabel={tb.you} />
        </div>
      </td>
      <td className="px-3 py-3.5">
        <CollateralList collateral={v.collateral} locale={locale} />
        <span className="text-xs text-muted-foreground tnum">{formatUsd(collateralUsd(v, prices), locale)}</span>
      </td>
      <td className="px-3 py-3.5 text-right whitespace-nowrap tnum">{formatToken(v.debt, v.debtToken, locale)}</td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn("w-12 text-lg font-extrabold tnum", statusText[st])}>{formatHf(hf, locale)}</span>
          <StatusChip status={st} label={Number.isFinite(hf) ? status[st] : status.noDebt} />
        </div>
      </td>
      <td className="px-3 py-3.5 text-right whitespace-nowrap tnum">
        {lp !== null ? (
          <>
            {formatPrice(lp, locale)} <span className="text-xs text-muted-foreground">{main}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{app.vault.notReachable}</span>
        )}
      </td>
      <td className="px-3 py-3.5">
        <Button asChild size="icon-sm" variant="ghost">
          <Link href={href(locale, `/app/vaults/${v.id}`)} aria-label={t(tb.open, { n: v.number })}>
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </td>
    </tr>
  )
}

