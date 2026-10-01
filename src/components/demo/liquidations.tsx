"use client"

import { ArrowRightIcon, GavelIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"

import { StatusChip, statusText } from "@/components/risk/status-chip"
import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { collateralUsd, healthFactor, maxLiquidation, statePrices, statusOf } from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL } from "@/lib/demo/tokens"
import { formatDateTime, formatHf, formatPct, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { CollateralList, Owner } from "./vault-bits"

export function Liquidations() {
  const demo = useDemo()
  const { app, locale, status } = useAppCopy()
  const l = app.liquidations
  if (!demo) return null

  const prices = statePrices(demo)
  const rated = demo.vaults.map((v) => ({ v, hf: healthFactor(v, prices, demo.params) })).sort((a, b) => a.hf - b.hf)
  const ready = rated.filter(({ hf }) => statusOf(hf) === "liquidatable")
  const watch = rated.filter(({ hf }) => statusOf(hf) === "at_risk")
  const recent = demo.vaults
    .flatMap((v) => v.history.filter((e) => e.kind === "liquidated" && e.receipt).map((e) => ({ v, e })))
    .sort((a, b) => b.e.at.localeCompare(a.e.at))
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{l.title}</h1>
          <InfoTip label={l.infoLabel}>{l.info}</InfoTip>
        </div>
        <p className="mt-2 text-sm text-muted-foreground tnum">
          {t(l.balanceNote, { usdc: formatToken(demo.balances.tUSDC, "tUSDC", locale), dai: formatToken(demo.balances.tDAI, "tDAI", locale) })}
        </p>
      </div>

      <section aria-labelledby="ready-title">
        <h2 id="ready-title" className="text-xl font-bold">
          {l.queueTitle}
        </h2>
        {ready.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center">
            <ShieldCheckIcon className="size-9 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-4 text-lg font-bold">{l.empty.title}</p>
            <Button asChild className="mt-6">
              <Link href={href(locale, "/app#stress-test")}>{l.empty.cta}</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {ready.map(({ v, hf }) => {
              const bestBonus = Math.max(...COLLATERAL.filter((c) => (v.collateral[c] ?? 0) > 0).map((c) => demo.params.collateral[c].liqBonus))
              const maxRepay = maxLiquidation(v, demo.params)
              return (
                <li key={v.id} className="vl-stamp flex flex-col rounded-3xl border-2 border-danger/40 bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold tnum">#{v.number}</span>
                      <Owner address={v.owner} yours={v.owner === demo.wallet.address} youLabel={app.console.table.you} />
                    </div>
                    <span className="flex items-center gap-2">
                      <span className={cn("text-2xl font-extrabold tnum", statusText.liquidatable)}>{formatHf(hf, locale)}</span>
                      <StatusChip status="liquidatable" label={status.liquidatable} />
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">{l.card.collateral}</dt>
                      <dd>
                        <CollateralList collateral={v.collateral} locale={locale} />
                        <span className="text-xs text-muted-foreground tnum">{formatUsd(collateralUsd(v, prices), locale)}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{l.card.debt}</dt>
                      <dd className="font-semibold tnum">{formatToken(v.debt, v.debtToken, locale)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{l.card.maxRepay}</dt>
                      <dd className="font-semibold tnum">{formatToken(maxRepay, v.debtToken, locale)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{l.card.bonus}</dt>
                      <dd className="font-semibold text-success tnum">
                        {formatPct(bestBonus, locale, 1)} · {formatUsd(maxRepay * bestBonus, locale)}
                      </dd>
                    </div>
                  </dl>
                  <Button asChild className="mt-5 self-start">
                    <Link href={href(locale, `/app/vaults/${v.id}`)}>
                      <GavelIcon aria-hidden="true" />
                      {l.card.liquidate}
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="watch-title" className="rounded-3xl border bg-card">
          <div className="p-5 pb-3 sm:px-6">
            <h2 id="watch-title" className="text-lg font-bold">
              {l.watchTitle}
            </h2>
          </div>
          {watch.length === 0 ? (
            <p className="border-t px-6 py-6 text-sm text-muted-foreground">{l.watchEmpty}</p>
          ) : (
            <ul className="divide-y border-t">
              {watch.map(({ v, hf }) => (
                <li key={v.id}>
                  <Link href={href(locale, `/app/vaults/${v.id}`)} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:px-6" aria-label={t(app.console.table.open, { n: v.number })}>
                    <span className="font-extrabold tnum">#{v.number}</span>
                    <Owner address={v.owner} yours={v.owner === demo.wallet.address} youLabel={app.console.table.you} />
                    <span className="ml-auto flex items-center gap-2">
                      <span className={cn("font-extrabold tnum", statusText.at_risk)}>{formatHf(hf, locale)}</span>
                      <StatusChip status="at_risk" label={status.at_risk} />
                    </span>
                    <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-title" className="rounded-3xl border bg-card">
          <h2 id="recent-title" className="p-5 pb-3 text-lg font-bold sm:px-6">
            {l.recentTitle}
          </h2>
          {recent.length === 0 ? (
            <p className="border-t px-6 py-6 text-sm text-muted-foreground">{l.recentEmpty}</p>
          ) : (
            <ul className="divide-y border-t">
              {recent.map(({ v, e }) => (
                <li key={e.id} className="px-5 py-3 sm:px-6">
                  <Link href={href(locale, `/app/vaults/${v.id}`)} className="text-sm font-semibold underline-offset-4 hover:underline tnum">
                    {t(l.recentRow, {
                      n: v.number,
                      amount: formatToken(e.receipt?.repaid ?? 0, e.receipt?.debtToken ?? v.debtToken, locale),
                      bonus: formatUsd(e.receipt?.bonusUsd ?? 0, locale),
                    })}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.at, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
