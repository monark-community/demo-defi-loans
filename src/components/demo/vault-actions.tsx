"use client"

import { Loader2Icon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { borrow, deposit, repay, withdraw } from "@/lib/demo/ops"
import { availableToBorrow, availableToWithdraw, healthFactor, statePrices, type Position } from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL, floorTo, parseAmount } from "@/lib/demo/tokens"
import type { CollateralSymbol, TokenSymbol, Vault } from "@/lib/demo/types"
import { formatHf, formatToken, inputValue } from "@/lib/format"
import { cn } from "@/lib/utils"

import { AmountField } from "./amount-field"
import { useAppCopy } from "./app-provider"
import { PositionPreview } from "./position-preview"
import { TxFeedback } from "./tx-feedback"

type Action = "deposit" | "withdraw" | "borrow" | "repay"
const ACTIONS: Action[] = ["deposit", "withdraw", "borrow", "repay"]

/** Deposit, withdraw, borrow and repay on your own vault, each with a before/after simulation. */
export function VaultActions({ vault }: { vault: Vault }) {
  const { app } = useAppCopy()
  const [tab, setTab] = useState<Action>(vault.debt > 0 ? "repay" : "deposit")
  return (
    <section aria-labelledby="actions-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="actions-title" className="text-lg font-bold">
        {app.vault.actions.title}
      </h2>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Action)} className="mt-4">
        <TabsList className="grid h-11 w-full grid-cols-4">
          {ACTIONS.map((a) => (
            <TabsTrigger key={a} value={a} className="px-1 text-[0.8125rem] sm:px-3 sm:text-sm">
              {app.vault.actions.tabs[a]}
            </TabsTrigger>
          ))}
        </TabsList>
        {ACTIONS.map((a) => (
          <TabsContent key={a} value={a} className="mt-5">
            <ActionForm action={a} vault={vault} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function ActionForm({ action, vault }: { action: Action; vault: Vault }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const a = app.vault.actions
  const tx = useTx()
  const held = COLLATERAL.filter((c) => (vault.collateral[c] ?? 0) > 0)
  const [asset, setAsset] = useState<CollateralSymbol>(action === "withdraw" ? (held[0] ?? "tETH") : "tETH")
  const [input, setInput] = useState("")
  const [touched, setTouched] = useState(false)
  const [doneLabel, setDoneLabel] = useState<string | undefined>(undefined)
  if (!demo) return null

  const prices = statePrices(demo)
  const isCollateral = action === "deposit" || action === "withdraw"
  const token: TokenSymbol = isCollateral ? asset : vault.debtToken
  const parsed = input.trim() ? parseAmount(input) : null
  const amount = parsed ?? 0

  let max = 0
  let hint = ""
  if (action === "deposit") {
    max = demo.balances[asset]
    hint = t(app.open.balance, { amount: formatToken(max, asset, locale) })
  } else if (action === "withdraw") {
    max = availableToWithdraw(vault, asset, prices, demo.params)
    hint = t(a.availableWithdraw, { amount: formatToken(max, asset, locale) })
  } else if (action === "borrow") {
    max = availableToBorrow(vault, prices, demo.params)
    hint = t(a.availableBorrow, { amount: formatToken(max, token, locale) })
  } else {
    max = Math.min(vault.debt, demo.balances[vault.debtToken])
    hint = t(a.owed, { amount: formatToken(vault.debt, token, locale) })
  }

  let error: string | null = null
  if (input.trim() && parsed === null) error = a.errors.invalid
  else if (action === "repay" && vault.debt <= 0) error = a.errors.noDebt
  else if (touched && amount <= 0) error = a.errors.zero
  else if (amount > 0) {
    if (action === "deposit" && amount > demo.balances[asset] + 1e-9) error = a.errors.balance
    if (action === "withdraw" && amount > max + 1e-9) error = amount > (vault.collateral[asset] ?? 0) + 1e-9 ? a.errors.balance : a.errors.withdraw
    if (action === "borrow" && amount > max + 1e-6) error = a.errors.borrow
    if (action === "repay") {
      if (amount > vault.debt + 1e-6) error = a.errors.repay
      else if (amount > demo.balances[vault.debtToken] + 1e-9) error = a.errors.balance
    }
  }

  const after: Position = {
    collateral: { ...vault.collateral },
    debtToken: vault.debtToken,
    debt: vault.debt,
  }
  if (!error && amount > 0) {
    if (action === "deposit") after.collateral[asset] = (after.collateral[asset] ?? 0) + amount
    if (action === "withdraw") after.collateral[asset] = Math.max(0, (after.collateral[asset] ?? 0) - amount)
    if (action === "borrow") after.debt += amount
    if (action === "repay") after.debt = Math.max(0, after.debt - amount)
  }

  const submit = async () => {
    setTouched(true)
    if (error || amount <= 0 || tx.busy) return
    const label = formatToken(amount, token, locale)
    const ok = await tx.run(
      {
        title: t(a.summary[action], { n: vault.number }),
        rows: [
          { label: a.tabs[action], value: label },
          { label: app.open.rows.hf, value: formatHf(healthFactor(after, prices, demo.params), locale) },
        ],
        movesValue: true,
      },
      (hash) => {
        if (action === "deposit") return deposit(vault.id, asset, amount, hash)
        if (action === "withdraw") return withdraw(vault.id, asset, amount, hash)
        if (action === "borrow") return borrow(vault.id, amount, hash)
        return repay(vault.id, amount, hash)
      }
    )
    if (ok) {
      // Confirmation stays inline (next to the button), so no toast sits on the preview.
      setDoneLabel(t(a.done[action], { amount: label, n: vault.number }))
      setInput("")
      setTouched(false)
    }
  }

  const assetChoices = action === "withdraw" ? held : COLLATERAL

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      {isCollateral ? (
        <div role="group" aria-label={a.asset} className="flex flex-wrap gap-1.5">
          {assetChoices.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={asset === c}
              className={cn(asset === c && "border-primary bg-primary/10")}
              onClick={() => {
                setAsset(c)
                setInput("")
              }}
            >
              {c}
            </Button>
          ))}
        </div>
      ) : null}
      <AmountField
        id={`${action}-amount`}
        label={a.amount}
        value={input}
        onChange={setInput}
        symbol={token}
        hint={hint}
        error={error}
        onMax={max > 0 ? () => setInput(inputValue(action === "repay" ? max : floorTo(max, token), locale, 8)) : undefined}
        maxLabel={a.max}
        maxAria={t(app.open.maxAria, { asset: token })}
        disabled={tx.busy}
      />
      <div className="rounded-2xl border bg-background/60 p-4">
        <PositionPreview before={vault} after={after} prices={prices} params={demo.params} title={a.preview} />
      </div>
      <Button type="submit" size="lg" disabled={tx.busy || (action === "repay" && vault.debt <= 0)}>
        {tx.busy ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
        {t(a.submit[action], { asset: token })}
      </Button>
      <TxFeedback state={tx.state} confirmedLabel={doneLabel} onRetry={() => void submit()} onDismiss={tx.reset} />
    </form>
  )
}
