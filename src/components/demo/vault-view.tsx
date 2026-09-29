"use client"

import { ArrowLeftIcon, ChevronDownIcon, SearchXIcon, SirenIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ReceiptBar } from "@/components/diagrams/receipt-bar"
import { StatusChip, statusText } from "@/components/risk/status-chip"
import { Button } from "@/components/ui/button"
import { Wallet } from "@/components/ui/wallet"
import { href, type Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import {
  availableToBorrow,
  collateralUsd,
  healthFactor,
  liquidationPrice,
  statePrices,
  statusOf,
} from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL } from "@/lib/demo/tokens"
import type { LiquidationReceipt, Vault, VaultEvent } from "@/lib/demo/types"
import { formatDate, formatDateTime, formatHf, formatPct, formatPrice, formatToken, formatUsd, shortAddress } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { LiquidatePanel } from "./liquidate-panel"
import { PositionPreview } from "./position-preview"
import { VaultActions } from "./vault-actions"
import { TokenGlyph } from "./vault-bits"

export function VaultView({ id }: { id: string }) {
  const demo = useDemo()
  const { app, locale, status } = useAppCopy()
  const v = app.vault
  if (!demo) return null
  const vault = demo.vaults.find((x) => x.id === id)

  if (!vault) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <SearchXIcon className="size-10 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold">{v.notFound.title}</h1>
        <Button asChild className="mt-6">
          <Link href={href(locale, "/app")}>{v.notFound.cta}</Link>
        </Button>
      </section>
    )
  }

  const prices = statePrices(demo)
  const hf = healthFactor(vault, prices, demo.params)
  const st = statusOf(hf)
  const yours = vault.owner === demo.wallet.address
  const hasDebt = vault.debt > 0
  // The receipt of your latest liquidation of this vault (signature moment: debt covered vs bonus).
  const lastEvent = vault.history[vault.history.length - 1]
  const lastLiquidation =
    !yours && lastEvent?.kind === "liquidated" && lastEvent.receipt?.liquidator === demo.wallet.address ? lastEvent.receipt : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={href(locale, "/app")} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {v.back}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-3xl font-extrabold tracking-display tnum sm:text-4xl">{t(v.title, { n: vault.number })}</h1>
          <StatusChip status={st} label={hasDebt ? status[st] : status.noDebt} className="text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {yours ? (
            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold text-foreground">{v.yours}</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {v.owner}
              <Wallet address={vault.owner} size="sm" copyLabel={app.wallet.copy} copiedLabel={app.wallet.copied} />
            </span>
          )}
          <span>{t(v.opened, { date: formatDate(vault.openedAt, locale) })}</span>
        </div>
      </div>

      {yours && st === "liquidatable" ? (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-danger/50 bg-danger/5 p-4 text-sm">
          <SirenIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          {t(app.console.alerts.toast.liquidatable, { n: vault.number, hf: formatHf(hf, locale) })}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Your latest liquidation receipt sits left, clear of the top-right toasts. */}
          {lastLiquidation ? (
            <section aria-label={app.liquidate.receipt.title}>
              <Receipt receipt={lastLiquidation} locale={locale} />
            </section>
          ) : null}
          {/* Health (on your own vault, the actions panel shows it with a before/after preview) */}
          {!yours ? (
            <section aria-labelledby="health-title" className="rounded-3xl border bg-card p-5 sm:p-6">
              <h2 id="health-title" className="sr-only">
                {v.gauge}
              </h2>
              <PositionPreview after={vault} prices={prices} params={demo.params} />
            </section>
          ) : null}

          {/* Collateral */}
          <section aria-labelledby="col-title" className="rounded-3xl border bg-card">
            <div className="flex items-baseline justify-between gap-3 p-5 pb-3 sm:px-6">
              <h2 id="col-title" className="text-lg font-bold">
                {v.collateralTitle}
              </h2>
              <span className="font-bold tnum">{formatUsd(collateralUsd(vault, prices), locale)}</span>
            </div>
            {COLLATERAL.some((c) => (vault.collateral[c] ?? 0) > 0) ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="border-t text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">{v.cols.asset}</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">{v.cols.amount}</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">{v.cols.value}</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">{v.cols.threshold}</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">{v.cols.liqPrice}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLLATERAL.filter((c) => (vault.collateral[c] ?? 0) > 0).map((c) => {
                      const lp = liquidationPrice(vault, c, prices, demo.params)
                      return (
                        <tr key={c} className="border-t">
                          <th scope="row" className="px-5 py-3 text-left font-bold sm:px-6">
                            <span className="inline-flex items-center gap-2">
                              <TokenGlyph symbol={c} />
                              {c}
                            </span>
                          </th>
                          <td className="px-3 py-3 text-right tnum">{formatToken(vault.collateral[c] ?? 0, c, locale)}</td>
                          <td className="px-3 py-3 text-right tnum">{formatUsd((vault.collateral[c] ?? 0) * prices[c], locale)}</td>
                          <td className="px-3 py-3 text-right tnum">{formatPct(demo.params.collateral[c].liqThreshold, locale)}</td>
                          <td className="px-5 py-3 text-right font-bold tnum sm:px-6">{lp === null ? <span className="font-normal text-muted-foreground">{v.notReachable}</span> : formatPrice(lp, locale)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="border-t px-6 py-6 text-sm text-muted-foreground">{v.noCollateral}</p>
            )}
          </section>

          {/* Debt */}
          <section aria-labelledby="debt-title" className="rounded-3xl border bg-card p-5 sm:p-6">
            <h2 id="debt-title" className="text-lg font-bold">
              {v.debtTitle}
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Fact label={v.debt} value={formatToken(vault.debt, vault.debtToken, locale)} strong />
              <Fact label={v.apr} value={formatPct(demo.params.debt[vault.debtToken].apr, locale)} />
              {yours ? <Fact label={v.available} value={formatToken(availableToBorrow(vault, prices, demo.params), vault.debtToken, locale)} /> : null}
            </dl>
          </section>
        </div>

        <div className={cn("flex flex-col gap-6 lg:sticky lg:top-24", yours && "order-first lg:order-none")}>
          {yours ? (
            <VaultActions vault={vault} />
          ) : st === "liquidatable" && hasDebt ? (
            <LiquidatePanel vault={vault} />
          ) : (
            <section className="rounded-3xl border border-dashed bg-card p-5 text-sm sm:p-6">
              <p>{v.notYours}</p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href={href(locale, "/app#stress-test")}>{app.console.stress.title}</Link>
              </Button>
            </section>
          )}
        </div>
      </div>

      <History vault={vault} you={demo.wallet.address} locale={locale} />
    </div>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold tnum", strong && "text-lg font-extrabold")}>{value}</dd>
    </div>
  )
}

export function Receipt({ receipt, locale, animate = true }: { receipt: LiquidationReceipt; locale: Locale; animate?: boolean }) {
  const { app } = useAppCopy()
  const r = app.liquidate.receipt
  const seizedUsd = receipt.repaid + receipt.bonusUsd
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border bg-background/60 p-4", animate && "vl-stamp")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-bold">{r.title}</span>
        <span className="flex items-center gap-1.5 tnum">
          <span className={cn("font-bold", statusText[statusOf(receipt.hfBefore)])}>{formatHf(receipt.hfBefore, locale)}</span>
          <span aria-hidden="true">→</span>
          <span className={cn("font-bold", statusText[statusOf(receipt.hfAfter)])}>{formatHf(receipt.hfAfter, locale)}</span>
          <span className="sr-only">{t(r.hf, { before: formatHf(receipt.hfBefore, locale), after: formatHf(receipt.hfAfter, locale) })}</span>
        </span>
      </div>
      <p className="text-sm tnum">
        {formatToken(receipt.repaid, receipt.debtToken, locale)} → {formatToken(receipt.seized, receipt.seizedToken, locale)}
      </p>
      <ReceiptBar
        coversLabel={r.covers}
        bonusLabel={r.bonus}
        coversValue={formatUsd(receipt.repaid, locale)}
        bonusValue={formatUsd(receipt.bonusUsd, locale)}
        bonusShare={seizedUsd > 0 ? receipt.bonusUsd / seizedUsd : 0}
        animate={animate}
      />
      <p className="text-xs text-muted-foreground">{t(r.by, { who: shortAddress(receipt.liquidator) })}</p>
    </div>
  )
}

function History({ vault, you, locale }: { vault: Vault; you: string; locale: Locale }) {
  const { app } = useAppCopy()
  const h = app.vault.history
  const events = [...vault.history].reverse()
  return (
    <section aria-labelledby="history-title" className="rounded-3xl border bg-card">
      <h2 id="history-title" className="p-5 pb-3 text-lg font-bold sm:px-6">
        {h.title}
      </h2>
      {events.length === 0 ? (
        <p className="border-t px-6 py-6 text-sm text-muted-foreground">{h.empty}</p>
      ) : (
        <ol className="divide-y border-t">
          {events.map((e) => (
            <HistoryRow key={e.id} e={e} you={you} locale={locale} />
          ))}
        </ol>
      )}
    </section>
  )
}

function HistoryRow({ e, you, locale }: { e: VaultEvent; you: string; locale: Locale }) {
  const { app } = useAppCopy()
  const h = app.vault.history
  const [open, setOpen] = useState(false)
  const amount = e.token && e.amount !== undefined ? formatToken(e.amount, e.token, locale) : ""
  return (
    <li className="px-5 py-3 sm:px-6" title={e.hash}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold tnum", e.kind === "liquidated" && "text-danger", e.kind === "interest" && "font-normal text-muted-foreground")}>
            {t(h.kinds[e.kind], { amount })}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(e.at, locale)}
            {e.actor ? ` · ${t(h.by, { who: e.actor === you ? h.you : shortAddress(e.actor) })}` : ""}
          </p>
        </div>
        {e.receipt ? (
          <Button size="xs" variant="ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? h.hideReceipt : h.showReceipt}
            <ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {open && e.receipt ? (
        <div className="mt-3">
          <Receipt receipt={e.receipt} locale={locale} />
        </div>
      ) : null}
    </li>
  )
}
