"use client"

import { randomId } from "./ids"
import { accrue, healthFactor, quoteLiquidation, statePrices, withinLtv, type Position } from "./risk"
import { getDemo, update } from "./store"
import { TIMELOCK_HOURS } from "./tokens"
import type {
  CollateralBag,
  CollateralSymbol,
  DebtSymbol,
  DemoState,
  ParamKey,
  TokenSymbol,
  TxError,
  Vault,
  VaultEvent,
} from "./types"

/**
 * Protocol actions. Each one is what a contract call would do once mined:
 * it re-checks the protocol rules against the *current* state (prices may
 * have moved while the transaction was pending) and returns an error to
 * revert, or applies the change and returns null.
 */

const EPS = 1e-9

function addHours(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString()
}

function event(s: DemoState, kind: VaultEvent["kind"], hash: string, token?: TokenSymbol, amount?: number): VaultEvent {
  return { id: randomId("e"), at: s.clock, kind, actor: s.wallet.address, token, amount, hash }
}

function patchVault(s: DemoState, id: string, fn: (v: Vault) => Vault): DemoState {
  return { ...s, vaults: s.vaults.map((v) => (v.id === id ? fn(v) : v)) }
}

function findVault(id: string): Vault | undefined {
  return getDemo()?.vaults.find((v) => v.id === id)
}

function hasBalance(s: DemoState, token: TokenSymbol, amount: number) {
  return s.balances[token] + EPS >= amount
}

/* --------------------------------- Vaults -------------------------------- */

export interface OpenVaultInput {
  collateral: CollateralBag
  debtToken: DebtSymbol
  debt: number
}

/** Open a vault: lock collateral and borrow in one transaction. Returns the new vault id through `onId`. */
export function openVault(input: OpenVaultInput, hash: string, onId: (id: string) => void): TxError | null {
  const s = getDemo()
  if (!s) return "reverted"
  const prices = statePrices(s)
  const position: Position = { collateral: input.collateral, debtToken: input.debtToken, debt: input.debt }
  if (!withinLtv(position, prices, s.params)) return "unsafe"
  for (const [token, amount] of Object.entries(input.collateral)) {
    if (!hasBalance(s, token as TokenSymbol, amount ?? 0)) return "reverted"
  }
  const number = s.nextVaultNumber
  const id = `v${number}`
  update((st) => {
    const balances = { ...st.balances }
    const history: VaultEvent[] = []
    let first = true
    for (const [token, amount] of Object.entries(input.collateral) as [CollateralSymbol, number][]) {
      if (!amount) continue
      balances[token] -= amount
      history.push(event(st, first ? "opened" : "deposit", hash, token, amount))
      first = false
    }
    if (input.debt > 0) {
      balances[input.debtToken] += input.debt
      history.push(event(st, "borrow", hash, input.debtToken, input.debt))
    }
    const vault: Vault = {
      id,
      number,
      owner: st.wallet.address,
      collateral: { ...input.collateral },
      debtToken: input.debtToken,
      debt: input.debt,
      openedAt: st.clock,
      lastStatus: "safe",
      history,
    }
    return { ...st, balances, vaults: [...st.vaults, vault], nextVaultNumber: number + 1 }
  })
  onId(id)
  return null
}

export function deposit(vaultId: string, token: CollateralSymbol, amount: number, hash: string): TxError | null {
  const s = getDemo()
  if (!s || !findVault(vaultId) || !hasBalance(s, token, amount)) return "reverted"
  update((st) => {
    const next = patchVault(st, vaultId, (v) => ({
      ...v,
      collateral: { ...v.collateral, [token]: (v.collateral[token] ?? 0) + amount },
      history: [...v.history, event(st, "deposit", hash, token, amount)],
    }))
    return { ...next, balances: { ...st.balances, [token]: st.balances[token] - amount } }
  })
  return null
}

export function withdraw(vaultId: string, token: CollateralSymbol, amount: number, hash: string): TxError | null {
  const s = getDemo()
  const v = findVault(vaultId)
  if (!s || !v) return "reverted"
  const left = (v.collateral[token] ?? 0) - amount
  if (left < -EPS) return "reverted"
  const after = { ...v, collateral: { ...v.collateral, [token]: Math.max(0, left) } }
  if (!withinLtv(after, statePrices(s), s.params)) return "unsafe"
  update((st) => {
    const next = patchVault(st, vaultId, (x) => ({
      ...x,
      collateral: { ...x.collateral, [token]: Math.max(0, (x.collateral[token] ?? 0) - amount) },
      history: [...x.history, event(st, "withdraw", hash, token, amount)],
    }))
    return { ...next, balances: { ...st.balances, [token]: st.balances[token] + amount } }
  })
  return null
}

export function borrow(vaultId: string, amount: number, hash: string): TxError | null {
  const s = getDemo()
  const v = findVault(vaultId)
  if (!s || !v) return "reverted"
  if (!withinLtv({ ...v, debt: v.debt + amount }, statePrices(s), s.params)) return "unsafe"
  update((st) => {
    const next = patchVault(st, vaultId, (x) => ({
      ...x,
      debt: x.debt + amount,
      history: [...x.history, event(st, "borrow", hash, x.debtToken, amount)],
    }))
    return { ...next, balances: { ...st.balances, [v.debtToken]: st.balances[v.debtToken] + amount } }
  })
  return null
}

export function repay(vaultId: string, amount: number, hash: string): TxError | null {
  const s = getDemo()
  const v = findVault(vaultId)
  if (!s || !v) return "reverted"
  const paid = Math.min(amount, v.debt)
  if (!hasBalance(s, v.debtToken, paid)) return "reverted"
  update((st) => {
    const next = patchVault(st, vaultId, (x) => ({
      ...x,
      // Snap tiny interest dust to zero when repaying everything.
      debt: x.debt - paid < 0.005 ? 0 : x.debt - paid,
      history: [...x.history, event(st, "repay", hash, x.debtToken, paid)],
    }))
    return { ...next, balances: { ...st.balances, [v.debtToken]: st.balances[v.debtToken] - paid } }
  })
  return null
}

/** Repay part of an unhealthy vault's debt and seize collateral plus the bonus. */
export function liquidate(vaultId: string, amount: number, asset: CollateralSymbol, hash: string): TxError | null {
  const s = getDemo()
  const v = findVault(vaultId)
  if (!s || !v) return "reverted"
  const prices = statePrices(s)
  if (healthFactor(v, prices, s.params) >= 1) return "not_liquidatable"
  const q = quoteLiquidation(v, amount, asset, prices, s.params)
  if (q.repay <= EPS || !hasBalance(s, v.debtToken, q.repay)) return "reverted"
  update((st) => {
    const ev: VaultEvent = {
      ...event(st, "liquidated", hash, v.debtToken, q.repay),
      receipt: {
        repaid: q.repay,
        debtToken: v.debtToken,
        seized: q.seized,
        seizedToken: asset,
        bonusUsd: q.bonusUsd,
        hfBefore: q.hfBefore,
        hfAfter: q.hfAfter,
        liquidator: st.wallet.address,
      },
    }
    const next = patchVault(st, vaultId, (x) => ({
      ...x,
      debt: Math.max(0, x.debt - q.repay),
      collateral: { ...x.collateral, [asset]: Math.max(0, (x.collateral[asset] ?? 0) - q.seized) },
      history: [...x.history, ev],
    }))
    return {
      ...next,
      balances: {
        ...st.balances,
        [v.debtToken]: st.balances[v.debtToken] - q.repay,
        [asset]: st.balances[asset] + q.seized,
      },
      alerts: [
        {
          id: randomId("a"),
          at: st.clock,
          vaultId,
          vaultNumber: v.number,
          kind: "liquidated" as const,
          hf: q.hfAfter,
          yours: v.owner === st.wallet.address,
        },
        ...st.alerts,
      ],
    }
  })
  return null
}

/* ------------------------------ Oracle & time ----------------------------- */

/** Oracle price multipliers (1 = reference price). Not a transaction: it's the demo's lever. */
export function setShocks(patch: Partial<Record<CollateralSymbol, number>>) {
  update((s) => ({ ...s, shocks: { ...s.shocks, ...patch } }))
}

/** Move the protocol clock forward; interest compounds daily on every vault. */
export function advanceTime(hours: number) {
  update((s) => {
    const days = hours / 24
    const vaults = s.vaults.map((v) => {
      if (v.debt <= 0) return v
      const next = accrue(v.debt, s.params.debt[v.debtToken].apr, days)
      const interest = next - v.debt
      return {
        ...v,
        debt: next,
        history: [
          ...v.history,
          { id: randomId("e"), at: addHours(s.clock, hours), kind: "interest" as const, actor: "", token: v.debtToken, amount: interest, hash: "" },
        ],
      }
    })
    return { ...s, vaults, clock: addHours(s.clock, hours) }
  })
}

/* ------------------------------- Governance ------------------------------- */

export function paramValue(s: DemoState, asset: TokenSymbol, param: ParamKey): number {
  if (param === "apr") return s.params.debt[asset as DebtSymbol].apr
  return s.params.collateral[asset as CollateralSymbol][param]
}

export function withParam(s: DemoState, asset: TokenSymbol, param: ParamKey, value: number): DemoState["params"] {
  if (param === "apr") {
    return { ...s.params, debt: { ...s.params.debt, [asset]: { apr: value } } }
  }
  const c = asset as CollateralSymbol
  return { ...s.params, collateral: { ...s.params.collateral, [c]: { ...s.params.collateral[c], [param]: value } } }
}

export function queueProposal(asset: TokenSymbol, param: ParamKey, to: number, hash: string, onId: (id: string) => void): TxError | null {
  const s = getDemo()
  if (!s) return "reverted"
  const number = Math.max(0, ...s.proposals.map((p) => p.number)) + 1
  const id = `p${number}`
  update((st) => ({
    ...st,
    proposals: [
      {
        id,
        number,
        asset,
        param,
        from: paramValue(st, asset, param),
        to,
        status: "queued",
        createdAt: st.clock,
        eta: addHours(st.clock, TIMELOCK_HOURS),
        author: st.wallet.address,
        hash,
      },
      ...st.proposals,
    ],
  }))
  onId(id)
  return null
}

export function executeProposal(id: string, hash: string): TxError | null {
  const s = getDemo()
  const p = s?.proposals.find((x) => x.id === id)
  if (!s || !p || p.status !== "queued") return "reverted"
  if (new Date(s.clock).getTime() < new Date(p.eta).getTime()) return "timelock"
  update((st) => ({
    ...st,
    params: withParam(st, p.asset, p.param, p.to),
    proposals: st.proposals.map((x) => (x.id === id ? { ...x, status: "executed", executedAt: st.clock, hash } : x)),
  }))
  return null
}
