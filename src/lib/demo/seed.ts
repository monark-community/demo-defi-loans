import { seededAddress, seededHash } from "./ids"
import { healthFactor, pricesFrom, statusOf } from "./risk"
import { DEFAULT_PARAMS } from "./tokens"
import type { AlertEvent, CollateralBag, DebtSymbol, DemoState, Proposal, Vault, VaultEvent } from "./types"

/** The demo wallet the visitor connects as. */
export const YOUR_ADDRESS = seededAddress("vaultlend-visitor")
/** The protocol clock starts here (the demo only moves time when asked). */
export const SEED_CLOCK = "2026-09-28T14:00:00.000Z"

export interface SeedCopy {
  walletName: string
}

interface SeedVault {
  n: number
  owner: string
  collateral: CollateralBag
  debtToken: DebtSymbol
  debt: number
  opened: string
  /** What the vault opened with, when it differs from today (after a liquidation). */
  openedWith?: { collateral: CollateralBag; debt: number }
}

/**
 * Twelve believable vaults at the reference prices: most safe, two at risk
 * (#1026, #1027) and one already liquidatable (#1028, mostly tLINK).
 * Health factors: 1024 1.63 · 1025 1.82 · 1026 1.19 · 1027 1.21 · 1028 0.97 ·
 * 1029 2.66 · 1030 1.46 · 1031 1.34 · 1032 3.05 · 1033 1.41 · 1034 1.30 · 1035 1.63
 */
const VAULTS: SeedVault[] = [
  { n: 1024, owner: YOUR_ADDRESS, collateral: { tETH: 6 }, debtToken: "tUSDC", debt: 9800, opened: "2026-08-19T16:12:00.000Z" },
  { n: 1025, owner: seededAddress("owner-1025"), collateral: { tWBTC: 0.8 }, debtToken: "tDAI", debt: 22000, opened: "2026-08-21T09:40:00.000Z" },
  { n: 1026, owner: seededAddress("owner-1026"), collateral: { tLINK: 2400 }, debtToken: "tUSDC", debt: 20500, opened: "2026-08-24T13:05:00.000Z" },
  { n: 1027, owner: seededAddress("owner-1027"), collateral: { tETH: 3.2 }, debtToken: "tDAI", debt: 7050, opened: "2026-08-26T18:22:00.000Z", openedWith: { collateral: { tETH: 4.8154 }, debt: 11050 } },
  { n: 1028, owner: seededAddress("owner-1028"), collateral: { tETH: 1.4, tLINK: 900 }, debtToken: "tUSDC", debt: 13200, opened: "2026-08-30T11:48:00.000Z" },
  { n: 1029, owner: seededAddress("owner-1029"), collateral: { tETH: 12 }, debtToken: "tUSDC", debt: 12000, opened: "2026-09-02T08:15:00.000Z" },
  { n: 1030, owner: seededAddress("owner-1030"), collateral: { tWBTC: 0.35, tETH: 2 }, debtToken: "tDAI", debt: 15600, opened: "2026-09-04T15:31:00.000Z" },
  { n: 1031, owner: seededAddress("owner-1031"), collateral: { tETH: 5 }, debtToken: "tUSDC", debt: 9900, opened: "2026-09-07T10:02:00.000Z" },
  { n: 1032, owner: seededAddress("owner-1032"), collateral: { tLINK: 1200 }, debtToken: "tDAI", debt: 4000, opened: "2026-09-10T19:47:00.000Z" },
  { n: 1033, owner: seededAddress("owner-1033"), collateral: { tWBTC: 0.15 }, debtToken: "tUSDC", debt: 5300, opened: "2026-09-14T07:26:00.000Z" },
  { n: 1034, owner: seededAddress("owner-1034"), collateral: { tETH: 8.5 }, debtToken: "tDAI", debt: 17400, opened: "2026-09-18T12:58:00.000Z" },
  { n: 1035, owner: seededAddress("owner-1035"), collateral: { tWBTC: 0.5, tLINK: 600 }, debtToken: "tUSDC", debt: 19000, opened: "2026-09-22T17:09:00.000Z" },
]

export const SEED_VAULT_IDS = VAULTS.map((v) => `v${v.n}`)

const LIQUIDATOR = seededAddress("keeper-anika")

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

function openingHistory(v: SeedVault): VaultEvent[] {
  const events: VaultEvent[] = []
  let i = 0
  for (const [token, amount] of Object.entries(v.openedWith?.collateral ?? v.collateral)) {
    events.push({
      id: `e-${v.n}-${i}`,
      at: addMinutes(v.opened, i),
      kind: i === 0 ? "opened" : "deposit",
      actor: v.owner,
      token: token as keyof CollateralBag,
      amount,
      hash: seededHash(`${v.n}-dep-${i}`),
    })
    i++
  }
  events.push({
    id: `e-${v.n}-b`,
    at: addMinutes(v.opened, i + 1),
    kind: "borrow",
    actor: v.owner,
    token: v.debtToken,
    amount: v.openedWith?.debt ?? v.debt,
    hash: seededHash(`${v.n}-borrow`),
  })
  return events
}

export function createSeed(copy: SeedCopy): DemoState {
  const params = structuredClone(DEFAULT_PARAMS)
  const shocks = { tETH: 1, tWBTC: 1, tLINK: 1 }
  const prices = pricesFrom(shocks)

  const vaults: Vault[] = VAULTS.map((v) => {
    const vault: Vault = {
      id: `v${v.n}`,
      number: v.n,
      owner: v.owner,
      collateral: { ...v.collateral },
      debtToken: v.debtToken,
      debt: v.debt,
      openedAt: v.opened,
      lastStatus: "safe",
      history: openingHistory(v),
    }
    vault.lastStatus = statusOf(healthFactor(vault, prices, params))
    return vault
  })

  // #1027 was partially liquidated a week ago, when tETH traded at $2,600
  // (it held 4.8154 tETH against 11,050 tDAI; the price has recovered since).
  const v1027 = vaults.find((v) => v.number === 1027)
  if (v1027) {
    v1027.history.push({
      id: "e-1027-liq",
      at: "2026-09-21T06:14:00.000Z",
      kind: "liquidated",
      actor: LIQUIDATOR,
      token: "tDAI",
      amount: 4000,
      hash: seededHash("1027-liq"),
      receipt: {
        repaid: 4000,
        debtToken: "tDAI",
        seized: 1.6154,
        seizedToken: "tETH",
        bonusUsd: 200,
        hfBefore: 0.94,
        hfAfter: 0.98,
        liquidator: LIQUIDATOR,
      },
    })
  }
  // You topped up your vault once.
  const v1024 = vaults.find((v) => v.number === 1024)
  if (v1024) {
    v1024.history[0] = { ...v1024.history[0]!, amount: 5 }
    v1024.history.splice(2, 0, {
      id: "e-1024-top",
      at: "2026-09-09T20:31:00.000Z",
      kind: "deposit",
      actor: YOUR_ADDRESS,
      token: "tETH",
      amount: 1,
      hash: seededHash("1024-top"),
    })
  }

  const proposals: Proposal[] = [
    {
      id: "p7",
      number: 7,
      asset: "tLINK",
      param: "liqBonus",
      from: 0.08,
      to: 0.1,
      status: "executed",
      createdAt: "2026-09-10T15:00:00.000Z",
      eta: "2026-09-12T15:00:00.000Z",
      executedAt: "2026-09-12T15:22:00.000Z",
      author: seededAddress("risk-steward"),
      hash: seededHash("p7"),
    },
    {
      id: "p8",
      number: 8,
      asset: "tUSDC",
      param: "apr",
      from: 0.049,
      to: 0.054,
      status: "executed",
      createdAt: "2026-09-19T13:30:00.000Z",
      eta: "2026-09-21T13:30:00.000Z",
      executedAt: "2026-09-21T14:05:00.000Z",
      author: seededAddress("risk-steward"),
      hash: seededHash("p8"),
    },
  ]

  const alerts: AlertEvent[] = [
    { id: "a1", at: "2026-09-26T22:18:00.000Z", vaultId: "v1026", vaultNumber: 1026, kind: "at_risk", hf: 1.19, yours: false },
    { id: "a2", at: "2026-09-27T09:51:00.000Z", vaultId: "v1027", vaultNumber: 1027, kind: "at_risk", hf: 1.21, yours: false },
    { id: "a3", at: "2026-09-28T13:40:00.000Z", vaultId: "v1028", vaultNumber: 1028, kind: "liquidatable", hf: 0.97, yours: false },
  ]

  return {
    version: 1,
    clock: SEED_CLOCK,
    wallet: { status: "disconnected", address: YOUR_ADDRESS, name: copy.walletName, lastError: null },
    balances: { tETH: 4.5, tWBTC: 0.12, tLINK: 350, tUSDC: 12400, tDAI: 8000 },
    shocks,
    params,
    vaults,
    proposals,
    alerts: alerts.reverse(),
    settings: { slow: false, failNext: false },
    nextVaultNumber: 1036,
  }
}
