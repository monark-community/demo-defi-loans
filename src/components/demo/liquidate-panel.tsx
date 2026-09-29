"use client"

import { GavelIcon, Loader2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { StatusChip, statusText } from "@/components/risk/status-chip"
import { Button } from "@/components/ui/button"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { liquidate } from "@/lib/demo/ops"
import { largestCollateral, maxLiquidation, quoteLiquidation, statePrices, statusOf } from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL, floorTo, parseAmount } from "@/lib/demo/tokens"
import type { CollateralSymbol, Vault } from "@/lib/demo/types"
import { formatHf, formatPct, formatToken, formatUsd, inputValue } from "@/lib/format"
import { cn } from "@/lib/utils"

import { AmountField } from "./amount-field"
import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

/** The liquidator's side: repay up to the close factor, pick the collateral to receive, see the bonus. */
export function LiquidatePanel({ vault }: { vault: Vault }) {
  const demo = useDemo()
  const { app, locale, disclaimer, status } = useAppCopy()
  const l = app.liquidate
  const tx = useTx()
  const held = COLLATERAL.filter((c) => (vault.collateral[c] ?? 0) > 0)
  const [asset, setAsset] = useState<CollateralSymbol | null>(null)
  const [input, setInput] = useState("")
  const [touched, setTouched] = useState(false)
  if (!demo) return null

  const prices = statePrices(demo)
  const seizeAsset: CollateralSymbol = asset && held.includes(asset) ? asset : largestCollateral(vault, prices)
  const maxRepay = maxLiquidation(vault, demo.params)
  const balance = demo.balances[vault.debtToken]
  const parsed = input.trim() ? parseAmount(input) : null
  const amount = parsed ?? 0

  let error: string | null = null
  if (input.trim() && parsed === null) error = l.errors.invalid
  else if (touched && amount <= 0) error = l.errors.zero
  else if (amount > maxRepay + 1e-6) error = l.errors.over
  else if (amount > balance + 1e-9) error = t(l.errors.balance, { asset: vault.debtToken })

  const q = quoteLiquidation(vault, error ? 0 : amount, seizeAsset, prices, demo.params)

  const submit = async () => {
    setTouched(true)
    if (error || amount <= 0 || tx.busy) return
    const ok = await tx.run(
      {
        title: t(l.summary, { n: vault.number }),
        rows: [
          { label: l.rows.repay, value: formatToken(q.repay, vault.debtToken, locale) },
          { label: l.rows.receive, value: formatToken(q.seized, seizeAsset, locale) },
          { label: l.rows.bonus, value: formatUsd(q.bonusUsd, locale) },
        ],
        movesValue: true,
      },
      (hash) => liquidate(vault.id, amount, seizeAsset, hash)
    )
    if (ok) {
      toast.success(t(l.done, { n: vault.number, amount: formatToken(q.seized, seizeAsset, locale) }))
      setInput("")
      setTouched(false)
    }
  }

  const hfBefore = q.hfBefore
  const stAfter = statusOf(q.hfAfter)

  return (
    <section aria-labelledby="liq-title" className="rounded-3xl border-2 border-danger/40 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <GavelIcon className="size-5 text-danger" aria-hidden="true" />
        <h2 id="liq-title" className="text-lg font-bold">
          {l.title}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>

      <form
        noValidate
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <AmountField
          id="liq-amount"
          label={t(l.repay, { asset: vault.debtToken })}
          value={input}
          onChange={setInput}
          symbol={vault.debtToken}
          hint={t(l.maxHint, { amount: formatToken(maxRepay, vault.debtToken, locale) })}
          error={error}
          onMax={() => setInput(inputValue(floorTo(Math.min(maxRepay, balance), vault.debtToken), locale, 2))}
          maxLabel={l.max}
          maxAria={t(app.open.maxAria, { asset: vault.debtToken })}
          disabled={tx.busy}
        />
        <p className="-mt-2 text-xs text-muted-foreground tnum">{t(l.balance, { amount: formatToken(balance, vault.debtToken, locale) })}</p>

        <div>
          <p className="text-sm font-semibold" id="seize-label">
            {l.seize}
          </p>
          <div role="group" aria-labelledby="seize-label" className="mt-2 flex flex-wrap gap-1.5">
            {held.map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={seizeAsset === c}
                className={cn(seizeAsset === c && "border-primary bg-primary/10")}
                onClick={() => setAsset(c)}
              >
                {c} · +{formatPct(demo.params.collateral[c].liqBonus, locale, 1)}
              </Button>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-2xl border bg-background/60 p-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{l.preview.repaid}</dt>
            <dd className="font-bold tnum">{formatToken(q.repay, vault.debtToken, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{l.preview.seized}</dt>
            <dd className="font-bold tnum">{formatToken(q.seized, seizeAsset, locale)}</dd>
            <dd className="text-xs text-muted-foreground tnum">{formatUsd(q.seizedUsd, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{l.preview.bonus}</dt>
            <dd className="font-bold text-success tnum">{formatUsd(q.bonusUsd, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{l.preview.hfAfter}</dt>
            <dd className="flex flex-wrap items-center gap-1.5 tnum">
              <span className={cn("font-bold", statusText[statusOf(hfBefore)])}>{formatHf(hfBefore, locale)}</span>
              <span aria-hidden="true">→</span>
              <span className={cn("font-extrabold", statusText[stAfter])}>{formatHf(q.hfAfter, locale)}</span>
              {amount > 0 && !error ? <StatusChip status={stAfter} label={status[stAfter]} /> : null}
            </dd>
          </div>
          {q.capped ? <p className="col-span-2 text-xs text-warning">{l.capped}</p> : null}
        </dl>

        <Disclaimer text={disclaimer} />
        <Button type="submit" size="lg" disabled={tx.busy}>
          {tx.busy ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <GavelIcon aria-hidden="true" />}
          {t(l.submit, { n: vault.number })}
        </Button>
        <TxFeedback state={tx.state} onRetry={() => void submit()} onDismiss={tx.reset} />
      </form>
    </section>
  )
}
