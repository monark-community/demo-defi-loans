import type { CollateralSymbol, DebtSymbol, RiskParams, Token, TokenSymbol } from "./types"

/** Testnet tokens and reference prices shared with the Monark DeFi demos. */
export const TOKENS: Record<TokenSymbol, Token> = {
  tETH: { symbol: "tETH", decimals: 18, usd: 3200 },
  tWBTC: { symbol: "tWBTC", decimals: 8, usd: 64000 },
  tLINK: { symbol: "tLINK", decimals: 18, usd: 14.5 },
  tUSDC: { symbol: "tUSDC", decimals: 6, usd: 1 },
  tDAI: { symbol: "tDAI", decimals: 18, usd: 1 },
}

export const COLLATERAL: CollateralSymbol[] = ["tETH", "tWBTC", "tLINK"]
export const DEBT: DebtSymbol[] = ["tUSDC", "tDAI"]

export const NETWORK_NAME = "Sepolia testnet"

/** Status bands (family convention). */
export const HF_LIQUIDATION = 1
export const HF_AT_RISK = 1.25

/** Protocol risk parameters at launch; governance proposals change them. */
export const DEFAULT_PARAMS: RiskParams = {
  collateral: {
    tETH: { maxLtv: 0.75, liqThreshold: 0.83, liqBonus: 0.05 },
    tWBTC: { maxLtv: 0.7, liqThreshold: 0.78, liqBonus: 0.065 },
    tLINK: { maxLtv: 0.6, liqThreshold: 0.7, liqBonus: 0.1 },
  },
  debt: {
    tUSDC: { apr: 0.054 },
    tDAI: { apr: 0.0485 },
  },
  closeFactor: 0.5,
}

/** Timelock between queueing and executing a parameter change. */
export const TIMELOCK_HOURS = 48

/** Whole tokens to a base-unit string for <TokenAmount>. */
export function toBase(amount: number, symbol: TokenSymbol): string {
  const { decimals } = TOKENS[symbol]
  const negative = amount < 0
  const fixed = Math.abs(amount).toFixed(Math.min(decimals, 8))
  const [w = "0", f = ""] = fixed.split(".")
  const v = BigInt(w) * 10n ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals) || "0")
  return (negative ? -v : v).toString()
}

/** Display precision per token: stablecoins 2, tLINK 2, tETH 4, tWBTC 5. */
export const DISPLAY_DIGITS: Record<TokenSymbol, number> = { tETH: 4, tWBTC: 5, tLINK: 2, tUSDC: 2, tDAI: 2 }

/** Parse a user-typed decimal ("1 250,5", "1250.50"). Returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s  _]/g, "").replace(",", ".")
  if (!cleaned) return null
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Round down to the token's display precision (for "Max" buttons). */
export function floorTo(amount: number, symbol: TokenSymbol): number {
  const d = DISPLAY_DIGITS[symbol]
  const f = 10 ** d
  return Math.floor(amount * f + 1e-9) / f
}
