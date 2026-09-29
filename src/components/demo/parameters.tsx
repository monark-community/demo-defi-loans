"use client"

import { FastForwardIcon, GavelIcon, Loader2Icon, TimerIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { dotSize, HealthRuler } from "@/components/risk/health-ruler"
import { StatusChip } from "@/components/risk/status-chip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { advanceTime, executeProposal, paramValue, queueProposal, withParam } from "@/lib/demo/ops"
import { debtUsd, healthFactor, statePrices, statusOf } from "@/lib/demo/risk"
import { useDemo } from "@/lib/demo/store"
import { COLLATERAL, DEBT, TIMELOCK_HOURS } from "@/lib/demo/tokens"
import type { CollateralSymbol, DebtSymbol, ParamKey, Proposal, TokenSymbol } from "@/lib/demo/types"
import { formatDateTime, formatHf, formatPct, inputValue } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

const RANGES: Record<ParamKey, [number, number]> = {
  maxLtv: [10, 90],
  liqThreshold: [20, 95],
  liqBonus: [0, 20],
  apr: [0, 30],
}

export function Parameters() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const p = app.params
  if (!demo) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{p.title}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{p.intro}</p>
      </div>

      <section aria-labelledby="table-title" className="rounded-3xl border bg-card">
        <h2 id="table-title" className="p-5 pb-3 text-lg font-bold sm:px-6">
          {p.tableTitle}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-t text-left text-xs text-muted-foreground">
                <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">{p.cols.asset}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{p.cols.maxLtv}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{p.cols.liqThreshold}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">{p.cols.liqBonus}</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">{p.cols.apr}</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {COLLATERAL.map((c) => (
                <tr key={c} className="border-t">
                  <th scope="row" className="px-5 py-3 text-left font-bold sm:px-6">{c}</th>
                  <td className="px-3 py-3 text-right">{formatPct(demo.params.collateral[c].maxLtv, locale)}</td>
                  <td className="px-3 py-3 text-right">{formatPct(demo.params.collateral[c].liqThreshold, locale)}</td>
                  <td className="px-3 py-3 text-right">{formatPct(demo.params.collateral[c].liqBonus, locale)}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground sm:px-6">–</td>
                </tr>
              ))}
              {DEBT.map((d) => (
                <tr key={d} className="border-t">
                  <th scope="row" className="px-5 py-3 text-left font-bold sm:px-6">{d}</th>
                  <td className="px-3 py-3 text-right text-muted-foreground">–</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">–</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">–</td>
                  <td className="px-5 py-3 text-right sm:px-6">{formatPct(demo.params.debt[d].apr, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">{t(p.closeFactor, { pct: formatPct(demo.params.closeFactor, locale, 0) })}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <ProposeForm />
        <ProposalList />
      </div>
    </div>
  )
}

function ProposeForm() {
  const demo = useDemo()
  const { app, locale, status, disclaimer } = useAppCopy()
  const p = app.params
  const f = p.propose
  const tx = useTx()
  const [asset, setAsset] = useState<TokenSymbol>("tETH")
  const [param, setParam] = useState<ParamKey>("liqThreshold")
  const [input, setInput] = useState("")
  const [touched, setTouched] = useState(false)
  if (!demo) return null

  const isDebt = (DEBT as string[]).includes(asset)
  const paramChoices: ParamKey[] = isDebt ? ["apr"] : ["maxLtv", "liqThreshold", "liqBonus"]
  const activeParam: ParamKey = paramChoices.includes(param) ? param : paramChoices[0]!
  const current = paramValue(demo, asset, activeParam)
  const [min, max] = RANGES[activeParam]

  const raw = input.trim().replace(",", ".").replace("%", "")
  const pct = raw ? Number(raw) : NaN
  let error: string | null = null
  if (raw && (!/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(pct))) error = f.errors.invalid
  else if (raw && (pct < min || pct > max)) error = t(f.errors.range, { min, max })
  else if (raw && Math.abs(pct / 100 - current) < 1e-9) error = f.errors.same
  else if (raw && !isDebt) {
    const cp = demo.params.collateral[asset as CollateralSymbol]
    if (activeParam === "liqThreshold" && pct / 100 <= cp.maxLtv) error = t(f.errors.threshold, { ltv: formatPct(cp.maxLtv, locale) })
    if (activeParam === "maxLtv" && pct / 100 >= cp.liqThreshold) error = t(f.errors.ltv, { lt: formatPct(cp.liqThreshold, locale) })
  }
  if (touched && !raw) error = f.errors.invalid
  const next = raw && !error ? pct / 100 : null

  // Impact preview: re-rate every vault with the proposed parameter.
  const prices = statePrices(demo)
  const nextParams = next !== null ? withParam(demo, asset, activeParam, next) : demo.params
  const rated = demo.vaults.map((v) => {
    const before = healthFactor(v, prices, demo.params)
    const after = healthFactor(v, prices, nextParams)
    return { v, before, after, moved: statusOf(before) !== statusOf(after) }
  })
  const moved = rated.filter((r) => r.moved)
  const dots = rated.map((r) => ({
    id: r.v.id,
    hf: Number.isFinite(r.after) ? r.after : 99,
    ghostHf: Number.isFinite(r.before) ? r.before : 99,
    size: dotSize(debtUsd(r.v)),
    yours: r.v.owner === demo.wallet.address,
    highlight: r.moved,
    label: t(f.change, { n: r.v.number, from: formatHf(r.before, locale), to: formatHf(r.after, locale) }),
  }))

  const submit = async () => {
    setTouched(true)
    if (next === null || error || tx.busy) return
    const name = p.names[activeParam]
    let newId = ""
    const ok = await tx.run(
      {
        title: t(f.summary, { name, asset }),
        rows: [
          { label: f.rows.from, value: formatPct(current, locale) },
          { label: f.rows.to, value: formatPct(next, locale) },
          { label: f.rows.timelock, value: f.timelock },
        ],
        movesValue: false,
      },
      (hash) =>
        queueProposal(asset, activeParam, next, hash, (id) => {
          newId = id
        })
    )
    if (ok) {
      toast.success(t(f.done, { n: newId.replace(/^p/, "") }))
      setInput("")
      setTouched(false)
    }
  }

  return (
    <section aria-labelledby="propose-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="propose-title" className="text-lg font-bold">
        {f.title}
      </h2>
      <form
        noValidate
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <fieldset disabled={tx.busy} className="flex flex-col gap-4">
          <div>
            <p id="asset-label" className="text-sm font-semibold">
              {f.asset}
            </p>
            <div role="group" aria-labelledby="asset-label" className="mt-2 flex flex-wrap gap-1.5">
              {[...COLLATERAL, ...DEBT].map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={asset === a}
                  className={cn(asset === a && "border-primary bg-primary/10")}
                  onClick={() => {
                    setAsset(a)
                    setInput("")
                  }}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p id="param-label" className="text-sm font-semibold">
              {f.param}
            </p>
            <div role="group" aria-labelledby="param-label" className="mt-2 flex flex-wrap gap-1.5">
              {paramChoices.map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={activeParam === k}
                  className={cn(activeParam === k && "border-primary bg-primary/10")}
                  onClick={() => {
                    setParam(k)
                    setInput("")
                  }}
                >
                  {p.names[k]}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="param-value" className="text-sm font-semibold">
                {f.value}
              </label>
              <span className="text-xs text-muted-foreground tnum">{t(f.current, { value: formatPct(current, locale) })}</span>
            </div>
            <Input
              id="param-value"
              inputMode="decimal"
              autoComplete="off"
              placeholder={inputValue(current * 100, locale, 2)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "param-error" : undefined}
              className="h-12 rounded-2xl text-lg font-bold tnum"
            />
            {error ? (
              <p id="param-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="rounded-2xl border bg-background/60 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-bold">{f.impactTitle}</p>
            <p aria-live="polite" className={cn("text-sm font-bold", moved.length ? "text-warning" : "text-muted-foreground")}>
              {next === null ? "" : moved.length ? t(f.impactSome, { n: moved.length }) : f.impactNone}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[30rem]">
              <HealthRuler
                dots={dots}
                zones={app.console.map.zones}
                lineLabel={app.console.map.line}
                formatTick={(v) => formatHf(v, locale)}
                assumedWidth={560}
                legend={false}
              />
            </div>
          </div>
          {moved.length ? (
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {moved.map((r) => (
                <li key={r.v.id} className="flex flex-wrap items-center gap-2 tnum">
                  <Link href={href(locale, `/app/vaults/${r.v.id}`)} className="font-bold underline-offset-4 hover:underline">
                    #{r.v.number}
                  </Link>
                  <span className="text-muted-foreground">{t(f.hfChange, { from: formatHf(r.before, locale), to: formatHf(r.after, locale) })}</span>
                  <StatusChip status={statusOf(r.after)} label={status[statusOf(r.after)]} />
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{f.impactNote}</p>
        </div>

        <Disclaimer text={disclaimer} />
        <Button type="submit" size="lg" disabled={tx.busy} className="self-stretch sm:self-start">
          {tx.busy ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <TimerIcon aria-hidden="true" />}
          {f.submit}
        </Button>
        <TxFeedback state={tx.state} onRetry={() => void submit()} onDismiss={tx.reset} />
      </form>
    </section>
  )
}

function ProposalList() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const pr = app.params.proposals
  if (!demo) return null
  return (
    <section aria-labelledby="proposals-title" className="rounded-3xl border bg-card">
      <h2 id="proposals-title" className="p-5 pb-3 text-lg font-bold sm:px-6">
        {pr.title}
      </h2>
      {demo.proposals.length === 0 ? (
        <p className="border-t px-6 py-6 text-sm text-muted-foreground">{pr.empty}</p>
      ) : (
        <ol className="divide-y border-t">
          {demo.proposals.map((p) => (
            <ProposalRow key={p.id} proposal={p} clock={demo.clock} />
          ))}
        </ol>
      )}
    </section>
  )
}

function ProposalRow({ proposal: p, clock }: { proposal: Proposal; clock: string }) {
  const { app, locale } = useAppCopy()
  const pr = app.params.proposals
  const tx = useTx()
  const remainingMs = new Date(p.eta).getTime() - new Date(clock).getTime()
  const remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000))
  const ready = remainingMs <= 0
  const fmt = (v: number) => formatPct(v, locale)

  const execute = async () => {
    const ok = await tx.run({ title: t(pr.executeSummary, { n: p.number }), movesValue: false }, (hash) => executeProposal(p.id, hash))
    if (ok) toast.success(t(pr.doneExecute, { n: p.number }))
  }

  return (
    <li className="px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold tnum">
          #{p.number} · {t(pr.row, { name: app.params.names[p.param], asset: p.asset as CollateralSymbol | DebtSymbol, from: fmt(p.from), to: fmt(p.to) })}
        </p>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold",
            p.status === "executed" ? "border-success/40 bg-success/10 text-success" : "border-warning/50 bg-warning/10 text-warning"
          )}
        >
          {p.status === "executed" ? pr.executed : pr.queued}
        </span>
      </div>
      {p.status === "executed" ? (
        <p className="mt-1 text-xs text-muted-foreground">{t(pr.executedAt, { date: formatDateTime(p.executedAt ?? p.eta, locale) })}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground tnum">
            {t(pr.eta, { date: formatDateTime(p.eta, locale) })} · {ready ? pr.ready : t(pr.remaining, { hours: remainingHours })}
          </p>
          {/* Timelock progress */}
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.round(100 - (remainingHours / TIMELOCK_HOURS) * 100)}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {!ready ? (
              <Button size="sm" variant="outline" onClick={() => advanceTime(remainingHours)} title={pr.fastForwardHint} disabled={tx.busy}>
                <FastForwardIcon aria-hidden="true" />
                {t(pr.fastForward, { hours: remainingHours })}
              </Button>
            ) : null}
            <Button size="sm" onClick={() => void execute()} disabled={!ready || tx.busy}>
              {tx.busy ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <GavelIcon aria-hidden="true" />}
              {pr.execute}
            </Button>
          </div>
          {!ready ? <p className="text-xs text-muted-foreground">{pr.fastForwardHint}</p> : null}
          <TxFeedback state={tx.state} onRetry={() => void execute()} onDismiss={tx.reset} />
        </div>
      )}
    </li>
  )
}
