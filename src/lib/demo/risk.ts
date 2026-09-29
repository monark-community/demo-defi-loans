import { COLLATERAL, HF_AT_RISK, HF_LIQUIDATION, TOKENS } from "./tokens"
import type {
  CollateralBag,
  CollateralSymbol,
  DebtSymbol,
  DemoState,
  RiskParams,
  Vault,
  VaultStatus,
} from "./types"

/**
 * Pure risk maths, shared by the console, the home-page widget and the
 * governance preview. Nothing here touches state.
 *
 *   health factor = Σ(collateral value × liquidation threshold) ÷ debt value
 */

export type Prices = Record<CollateralSymbol, number>

export function pricesFrom(shocks: Record<CollateralSymbol, number>): Prices {
  return {
    tETH: TOKENS.tETH.usd * shocks.tETH,
    tWBTC: TOKENS.tWBTC.usd * shocks.tWBTC,
    tLINK: TOKENS.tLINK.usd * shocks.tLINK,
  }
}

export function statePrices(s: Pick<DemoState, "shocks">): Prices {
  return pricesFrom(s.shocks)
}

export interface Position {
  collateral: CollateralBag
  debtToken: DebtSymbol
  debt: number
}

export function collateralUsd(p: Pick<Position, "collateral">, prices: Prices): number {
  return COLLATERAL.reduce((sum, c) => sum + (p.collateral[c] ?? 0) * prices[c], 0)
}

/** Collateral value weighted by liquidation thresholds. */
export function thresholdUsd(p: Pick<Position, "collateral">, prices: Prices, params: RiskParams): number {
  return COLLATERAL.reduce((sum, c) => sum + (p.collateral[c] ?? 0) * prices[c] * params.collateral[c].liqThreshold, 0)
}

/** Collateral value weighted by max LTV: the most this collateral can borrow. */
export function borrowLimitUsd(p: Pick<Position, "collateral">, prices: Prices, params: RiskParams): number {
  return COLLATERAL.reduce((sum, c) => sum + (p.collateral[c] ?? 0) * prices[c] * params.collateral[c].maxLtv, 0)
}

export function debtUsd(p: Pick<Position, "debt" | "debtToken">): number {
  return p.debt * TOKENS[p.debtToken].usd
}

export function healthFactor(p: Position, prices: Prices, params: RiskParams): number {
  const d = debtUsd(p)
  if (d <= 1e-9) return Infinity
  return thresholdUsd(p, prices, params) / d
}

export function statusOf(hf: number): VaultStatus {
  if (hf < HF_LIQUIDATION) return "liquidatable"
  if (hf < HF_AT_RISK) return "at_risk"
  return "safe"
}

/** Current loan-to-value (debt ÷ collateral), 0 with no collateral. */
export function ltv(p: Position, prices: Prices): number {
  const c = collateralUsd(p, prices)
  return c > 0 ? debtUsd(p) / c : 0
}

/**
 * Oracle price of one collateral asset at which HF = 1.00, other assets
 * unchanged. null when the vault has none of it, no debt, or when the other
 * collateral alone covers the debt (no price of this asset can liquidate it).
 */
export function liquidationPrice(p: Position, asset: CollateralSymbol, prices: Prices, params: RiskParams): number | null {
  const amount = p.collateral[asset] ?? 0
  const d = debtUsd(p)
  if (amount <= 0 || d <= 1e-9) return null
  const others = COLLATERAL.filter((c) => c !== asset).reduce(
    (sum, c) => sum + (p.collateral[c] ?? 0) * prices[c] * params.collateral[c].liqThreshold,
    0
  )
  const needed = d - others
  if (needed <= 0) return null
  return needed / (amount * params.collateral[asset].liqThreshold)
}

/** How much more debt (in debt tokens) the vault can take within max LTV. */
export function availableToBorrow(p: Position, prices: Prices, params: RiskParams): number {
  return Math.max(0, (borrowLimitUsd(p, prices, params) - debtUsd(p)) / TOKENS[p.debtToken].usd)
}

/** How much of one collateral asset can be withdrawn while staying within max LTV. */
export function availableToWithdraw(p: Position, asset: CollateralSymbol, prices: Prices, params: RiskParams): number {
  const amount = p.collateral[asset] ?? 0
  if (debtUsd(p) <= 1e-9) return amount
  const spare = borrowLimitUsd(p, prices, params) - debtUsd(p)
  if (spare <= 0) return 0
  return Math.min(amount, spare / (prices[asset] * params.collateral[asset].maxLtv))
}

/** Borrowing within max LTV (the rule a new borrow or withdrawal must pass). */
export function withinLtv(p: Position, prices: Prices, params: RiskParams): boolean {
  return debtUsd(p) <= borrowLimitUsd(p, prices, params) + 1e-6
}

/** The biggest collateral holding by value (the natural asset to seize). */
export function largestCollateral(p: Pick<Position, "collateral">, prices: Prices): CollateralSymbol {
  let best: CollateralSymbol = "tETH"
  let bestValue = -1
  for (const c of COLLATERAL) {
    const v = (p.collateral[c] ?? 0) * prices[c]
    if (v > bestValue) {
      best = c
      bestValue = v
    }
  }
  return best
}

export interface LiquidationQuote {
  repay: number
  seized: number
  seizedUsd: number
  bonusUsd: number
  maxRepay: number
  hfBefore: number
  hfAfter: number
  capped: boolean
}

/** Max debt one liquidation can repay (close factor). */
export function maxLiquidation(p: Position, params: RiskParams): number {
  return p.debt * params.closeFactor
}

/**
 * Quote a liquidation: the liquidator repays `repay` debt tokens and receives
 * collateral worth repay × (1 + bonus). If the vault holds less of that asset,
 * the repay amount is reduced to match what can be seized.
 */
export function quoteLiquidation(
  p: Position,
  repayInput: number,
  asset: CollateralSymbol,
  prices: Prices,
  params: RiskParams
): LiquidationQuote {
  const maxRepay = maxLiquidation(p, params)
  let repay = Math.max(0, Math.min(repayInput, maxRepay))
  const bonus = params.collateral[asset].liqBonus
  const available = p.collateral[asset] ?? 0
  const debtPrice = TOKENS[p.debtToken].usd
  let seized = (repay * debtPrice * (1 + bonus)) / prices[asset]
  let capped = false
  if (seized > available) {
    seized = available
    repay = (seized * prices[asset]) / (1 + bonus) / debtPrice
    capped = true
  }
  const after: Position = {
    ...p,
    debt: Math.max(0, p.debt - repay),
    collateral: { ...p.collateral, [asset]: Math.max(0, available - seized) },
  }
  const seizedUsd = seized * prices[asset]
  return {
    repay,
    seized,
    seizedUsd,
    bonusUsd: seizedUsd - repay * debtPrice,
    maxRepay,
    hfBefore: healthFactor(p, prices, params),
    hfAfter: healthFactor(after, prices, params),
    capped,
  }
}

/** Daily-compounded interest over a number of days. */
export function accrue(debt: number, apr: number, days: number): number {
  return debt * Math.pow(1 + apr / 365, days)
}

export interface ProtocolStats {
  collateralUsd: number
  debtUsd: number
  atRiskDebtUsd: number
  liquidatable: number
  atRisk: number
  safe: number
  vaults: number
  /** Total collateral ÷ total debt. */
  collateralRatio: number
}

export function vaultHf(v: Vault, prices: Prices, params: RiskParams): number {
  return healthFactor(v, prices, params)
}

export function protocolStats(vaults: Vault[], prices: Prices, params: RiskParams): ProtocolStats {
  const s: ProtocolStats = {
    collateralUsd: 0,
    debtUsd: 0,
    atRiskDebtUsd: 0,
    liquidatable: 0,
    atRisk: 0,
    safe: 0,
    vaults: vaults.length,
    collateralRatio: 0,
  }
  for (const v of vaults) {
    const c = collateralUsd(v, prices)
    const d = debtUsd(v)
    s.collateralUsd += c
    s.debtUsd += d
    const st = statusOf(healthFactor(v, prices, params))
    if (st === "liquidatable") {
      s.liquidatable++
      s.atRiskDebtUsd += d
    } else if (st === "at_risk") {
      s.atRisk++
      s.atRiskDebtUsd += d
    } else s.safe++
  }
  s.collateralRatio = s.debtUsd > 0 ? s.collateralUsd / s.debtUsd : 0
  return s
}

/**
 * Position on the health ruler (0–1). Piecewise-linear so the interesting
 * range gets the room: 0.70–1.00 → 0–18%, 1.00–1.25 → 18–36%,
 * 1.25–2.00 → 36–75%, 2.00–3.00+ → 75–100%.
 */
const STOPS: [number, number][] = [
  [0.7, 0],
  [1, 0.18],
  [1.25, 0.36],
  [2, 0.75],
  [3, 1],
]
export const RULER_MIN = 0.7
export const RULER_MAX = 3
export function rulerPosition(hf: number): number {
  const v = Math.max(RULER_MIN, Math.min(RULER_MAX, Number.isFinite(hf) ? hf : RULER_MAX))
  for (let i = 1; i < STOPS.length; i++) {
    const [x1, y1] = STOPS[i]!
    const [x0, y0] = STOPS[i - 1]!
    if (v <= x1) return y0 + ((v - x0) / (x1 - x0)) * (y1 - y0)
  }
  return 1
}
