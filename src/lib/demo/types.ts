/**
 * Domain types for the VaultLend demo. The UI only talks to these shapes and
 * to the actions in ops.ts, so the simulated protocol in this folder could be
 * replaced by wagmi/viem reads and writes without touching components.
 *
 * Token amounts are plain numbers in whole tokens (e.g. 2.5 tETH). The demo
 * never needs more precision than 6 decimals; the UI converts to base units
 * for the @monark/ui token-amount component.
 */

export type CollateralSymbol = "tETH" | "tWBTC" | "tLINK"
export type DebtSymbol = "tUSDC" | "tDAI"
export type TokenSymbol = CollateralSymbol | DebtSymbol

export interface Token {
  symbol: TokenSymbol
  decimals: number
  /** Reference price in USD shared by the Monark DeFi demos. */
  usd: number
}

export interface CollateralParams {
  /** Max loan-to-value when borrowing or withdrawing (0.75 = 75%). */
  maxLtv: number
  /** Share of collateral value that counts toward solvency (health factor). */
  liqThreshold: number
  /** Discount a liquidator receives on seized collateral (0.05 = 5%). */
  liqBonus: number
}

export interface DebtParams {
  /** Borrow APR, compounded daily (0.054 = 5.40%). */
  apr: number
}

export interface RiskParams {
  collateral: Record<CollateralSymbol, CollateralParams>
  debt: Record<DebtSymbol, DebtParams>
  /** Max share of a vault's debt one liquidation can repay. */
  closeFactor: number
}

export type CollateralBag = Partial<Record<CollateralSymbol, number>>

export type VaultStatus = "safe" | "at_risk" | "liquidatable"

export type VaultEventKind = "opened" | "deposit" | "withdraw" | "borrow" | "repay" | "liquidated" | "interest"

export interface LiquidationReceipt {
  repaid: number
  debtToken: DebtSymbol
  seized: number
  seizedToken: CollateralSymbol
  /** USD value of the seized collateral above the debt repaid. */
  bonusUsd: number
  hfBefore: number
  hfAfter: number
  liquidator: string
}

export interface VaultEvent {
  id: string
  at: string
  kind: VaultEventKind
  /** Address that sent the transaction. */
  actor: string
  token?: TokenSymbol
  amount?: number
  hash: string
  receipt?: LiquidationReceipt
}

export interface Vault {
  id: string
  /** Human-facing vault number, e.g. 1024. */
  number: number
  owner: string
  collateral: CollateralBag
  debtToken: DebtSymbol
  /** Current debt including accrued interest. */
  debt: number
  openedAt: string
  /** Last status seen, used to raise alerts on transitions. */
  lastStatus: VaultStatus
  history: VaultEvent[]
}

export type AlertKind = "at_risk" | "liquidatable" | "recovered" | "liquidated"

export interface AlertEvent {
  id: string
  at: string
  vaultId: string
  vaultNumber: number
  kind: AlertKind
  hf: number
  yours: boolean
}

export type ParamKey = "maxLtv" | "liqThreshold" | "liqBonus" | "apr"

export interface Proposal {
  id: string
  number: number
  asset: TokenSymbol
  param: ParamKey
  from: number
  to: number
  status: "queued" | "executed"
  createdAt: string
  /** When the timelock ends and the proposal can be executed. */
  eta: string
  executedAt?: string
  author: string
  hash: string
}

export type WalletStatus = "disconnected" | "connecting" | "connected"

export interface WalletState {
  status: WalletStatus
  address: string
  name: string
  lastError: "rejected" | null
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
}

export interface DemoState {
  version: 1
  /** Simulated protocol time (ISO). Only moves when the visitor fast-forwards. */
  clock: string
  wallet: WalletState
  balances: Record<TokenSymbol, number>
  /** Oracle price multipliers against the reference price (1 = reference). */
  shocks: Record<CollateralSymbol, number>
  params: RiskParams
  vaults: Vault[]
  proposals: Proposal[]
  alerts: AlertEvent[]
  settings: DemoSettings
  nextVaultNumber: number
}

/** Lifecycle of one simulated transaction, as the UI sees it. */
export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"
/** rejected: wallet; reverted: network; a protocol-rule string: checked at execution. */
export type TxError = "rejected" | "reverted" | "not_liquidatable" | "unsafe" | "timelock"

export interface TxState {
  phase: TxPhase
  hash?: string
  error?: TxError
}

export interface TxSummary {
  title: string
  rows?: { label: string; value: string }[]
  movesValue: boolean
  noFee?: boolean
}
