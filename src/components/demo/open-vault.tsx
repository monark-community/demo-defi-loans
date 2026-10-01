"use client"

import { Loader2Icon, LockIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { openVault } from "@/lib/demo/ops"
import { borrowLimitUsd, healthFactor, statePrices, thresholdUsd, type Position } from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL, DEBT, floorTo, parseAmount } from "@/lib/demo/tokens"
import type { CollateralBag, CollateralSymbol, DebtSymbol } from "@/lib/demo/types"
import { formatHf, formatPct, formatToken, inputValue } from "@/lib/format"
import { cn } from "@/lib/utils"

import { AmountField } from "./amount-field"
import { useAppCopy } from "./app-provider"
import { PositionPreview } from "./position-preview"
import { TxFeedback } from "./tx-feedback"

export function OpenVault() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const o = app.open
  const router = useRouter()
  const tx = useTx()
  const [amounts, setAmounts] = useState<Record<CollateralSymbol, string>>({ tETH: "", tWBTC: "", tLINK: "" })
  const [debtToken, setDebtToken] = useState<DebtSymbol>("tUSDC")
  const [debtInput, setDebtInput] = useState("")
  const [submitted, setSubmitted] = useState(false)
  if (!demo) return null

  const prices = statePrices(demo)
  const collateral: CollateralBag = {}
  const colErrors: Partial<Record<CollateralSymbol, string>> = {}
  for (const c of COLLATERAL) {
    const raw = amounts[c].trim()
    if (!raw) continue
    const n = parseAmount(raw)
    if (n === null) colErrors[c] = o.errors.invalid
    else if (n > demo.balances[c] + 1e-9) colErrors[c] = o.errors.balance
    else if (n > 0) collateral[c] = n
  }
  const debtParsed = debtInput.trim() ? parseAmount(debtInput) : 0
  const debt = debtParsed ?? 0
  const position: Position = { collateral, debtToken, debt }
  const hasCollateral = Object.keys(collateral).length > 0
  const limit = borrowLimitUsd(position, prices, demo.params)
  const suggested = floorTo(Math.min(limit, thresholdUsd(position, prices, demo.params) / 1.5), debtToken)

  let debtError: string | null = null
  if (debtParsed === null) debtError = o.errors.invalid
  else if (hasCollateral && debt > limit + 1e-6) debtError = o.errors.ltv
  else if (submitted && debt <= 0) debtError = o.errors.noDebt

  const collateralError = submitted && !hasCollateral && Object.keys(colErrors).length === 0 ? o.errors.noCollateral : null
  const valid = hasCollateral && Object.keys(colErrors).length === 0 && !debtError && debt > 0
  const number = demo.nextVaultNumber

  const submit = async () => {
    setSubmitted(true)
    if (!valid || tx.busy) return
    const lock = COLLATERAL.filter((c) => collateral[c]).map((c) => formatToken(collateral[c] ?? 0, c, locale)).join(" + ")
    let newId = ""
    const ok = await tx.run(
      {
        title: t(o.summary, { n: number }),
        rows: [
          { label: o.rows.collateral, value: lock },
          { label: o.rows.borrow, value: formatToken(debt, debtToken, locale) },
          { label: o.rows.hf, value: formatHf(healthFactor(position, prices, demo.params), locale) },
        ],
        movesValue: true,
      },
      (hash) =>
        openVault({ collateral, debtToken, debt }, hash, (id) => {
          newId = id
        })
    )
    if (ok && newId) {
      // The new vault's own page is the confirmation (its history starts with "Opened").
      router.push(href(locale, `/app/vaults/${newId}`))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{o.title}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="flex flex-col gap-6"
        >
          <fieldset className="rounded-3xl border bg-card p-5 sm:p-6" disabled={tx.busy}>
            <legend className="sr-only">{o.collateralTitle}</legend>
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-bold" aria-hidden="true">
                {o.collateralTitle}
              </h2>
              <InfoTip label={o.collateralHintLabel}>{o.collateralHint}</InfoTip>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              {COLLATERAL.map((c) => (
                <AmountField
                  key={c}
                  id={`col-${c}`}
                  label={t(o.amountLabel, { asset: c })}
                  value={amounts[c]}
                  onChange={(v) => setAmounts((a) => ({ ...a, [c]: v }))}
                  symbol={c}
                  hint={`${t(o.balance, { amount: formatToken(demo.balances[c], c, locale) })} · ${t(o.ltvHint, { pct: formatPct(demo.params.collateral[c].maxLtv, locale, 0) })}`}
                  error={colErrors[c]}
                  onMax={() => setAmounts((a) => ({ ...a, [c]: inputValue(floorTo(demo.balances[c], c), locale, 8) }))}
                  maxLabel={o.max}
                  maxAria={t(o.maxAria, { asset: c })}
                />
              ))}
            </div>
            {collateralError ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {collateralError}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="rounded-3xl border bg-card p-5 sm:p-6" disabled={tx.busy}>
            <legend className="sr-only">{o.debtTitle}</legend>
            <h2 className="text-lg font-bold" aria-hidden="true">
              {o.debtTitle}
            </h2>
            <div className="mt-4" role="group" aria-label={o.debtAsset}>
              <p className="text-sm font-semibold" aria-hidden="true">
                {o.debtAsset}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {DEBT.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={debtToken === d}
                    onClick={() => setDebtToken(d)}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors",
                      debtToken === d ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
                    )}
                  >
                    <span className="font-bold">{d}</span>
                    <span className="text-xs text-muted-foreground tnum">{t(o.apr, { apr: formatPct(demo.params.debt[d].apr, locale) })}</span>
                  </button>
                ))}
              </div>
            </div>
            <AmountField
              id="debt"
              className="mt-5"
              label={o.debtAmount}
              value={debtInput}
              onChange={setDebtInput}
              symbol={debtToken}
              error={debtError}
            />
            {hasCollateral && suggested > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground tnum">{t(o.safeMax, { amount: formatToken(suggested, debtToken, locale) })}</span>
                <Button type="button" size="xs" variant="outline" onClick={() => setDebtInput(inputValue(suggested, locale, 2))}>
                  {o.useSafe}
                </Button>
              </div>
            ) : null}
          </fieldset>

          <div className="flex flex-col gap-3">
            <Button type="submit" size="lg" disabled={tx.busy} className="self-stretch sm:self-start">
              {tx.busy ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <LockIcon aria-hidden="true" />}
              {o.submit}
            </Button>
            <TxFeedback state={tx.state} onRetry={() => void submit()} onDismiss={tx.reset} />
          </div>
        </form>

        <aside aria-labelledby="preview-title" className="rounded-3xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-1">
            <h2 id="preview-title" className="text-lg font-bold">
              {o.previewTitle}
            </h2>
            <InfoTip label={o.howLabel}>
              <p>{o.howBody}</p>
              <Link href={href(locale, "/how-it-works")} className="mt-2 inline-block font-bold text-primary-ink underline underline-offset-4">
                {o.howLink}
              </Link>
            </InfoTip>
          </div>
          {hasCollateral ? (
            <PositionPreview after={position} prices={prices} params={demo.params} className="mt-4" />
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{o.previewEmpty}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
