"use client"

import { useSyncExternalStore } from "react"

import { randomId } from "./ids"
import { healthFactor, statePrices, statusOf } from "./risk"
import { createSeed, type SeedCopy } from "./seed"
import type { AlertEvent, DemoSettings, DemoState, TxSummary, VaultStatus, WalletState } from "./types"

/**
 * The demo's single source of truth: a tiny external store persisted to
 * localStorage (every access in try/catch). Swapping to a real chain means
 * replacing this folder; components only use the hooks and the actions in ops.ts.
 */

const STORAGE_KEY = "vaultlend-demo-v1"
const MAX_ALERTS = 40

let state: DemoState | null = null
let storageOk = true
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  if (!state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.version !== 1 || !Array.isArray(parsed.vaults) || !parsed.params) return null
    // A reload never resumes a half-finished connection.
    if (parsed.wallet.status === "connecting") parsed.wallet.status = "disconnected"
    return parsed
  } catch {
    storageOk = false
    return null
  }
}

/** Load saved state, or seed the protocol. Idempotent. */
export function initDemo(copy: SeedCopy) {
  if (state) return
  state = load() ?? createSeed(copy)
  // The wallet label follows the visitor's language.
  state = { ...state, wallet: { ...state.wallet, name: copy.walletName } }
  persist()
  emit()
}

export function resetDemo(copy: SeedCopy) {
  const connected = state?.wallet.status === "connected"
  state = createSeed(copy)
  if (connected) state.wallet.status = "connected"
  persist()
  emit()
}

/**
 * Raise alerts when a vault changes status band. Getting worse always alerts;
 * getting better alerts only when it is back to safe.
 */
function reconcile(s: DemoState): DemoState {
  const prices = statePrices(s)
  const rank: Record<VaultStatus, number> = { safe: 0, at_risk: 1, liquidatable: 2 }
  const fresh: AlertEvent[] = []
  const vaults = s.vaults.map((v) => {
    const hf = healthFactor(v, prices, s.params)
    const now = statusOf(hf)
    if (now === v.lastStatus) return v
    const worse = rank[now] > rank[v.lastStatus]
    if (worse || now === "safe") {
      fresh.push({
        id: randomId("a"),
        at: s.clock,
        vaultId: v.id,
        vaultNumber: v.number,
        kind: worse ? (now as "at_risk" | "liquidatable") : "recovered",
        hf: Number.isFinite(hf) ? hf : 99,
        yours: v.owner === s.wallet.address,
      })
    }
    return { ...v, lastStatus: now }
  })
  if (!fresh.length && vaults.every((v, i) => v === s.vaults[i])) return s
  return { ...s, vaults, alerts: [...fresh.reverse(), ...s.alerts].slice(0, MAX_ALERTS) }
}

export function update(fn: (s: DemoState) => DemoState) {
  if (!state) return
  state = reconcile(fn(state))
  persist()
  emit()
}

export function setWallet(patch: Partial<WalletState>) {
  update((s) => ({ ...s, wallet: { ...s.wallet, ...patch } }))
}

export function setSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function getDemo() {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current demo state, or null until it has loaded on the client. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function useStorageOk(): boolean {
  return useSyncExternalStore(subscribe, () => storageOk, () => true)
}

/* ---------------------------------------------------------------------------
 * Simulated wallet prompt: a promise resolved by the WalletPrompt dialog.
 * ------------------------------------------------------------------------ */

export interface PromptRequest {
  summary: TxSummary
  resolve: (approved: boolean) => void
}

let prompt: PromptRequest | null = null
const promptListeners = new Set<() => void>()

export function requestSignature(summary: TxSummary): Promise<boolean> {
  return new Promise((resolve) => {
    prompt?.resolve(false)
    prompt = {
      summary,
      resolve: (ok) => {
        prompt = null
        for (const l of promptListeners) l()
        resolve(ok)
      },
    }
    for (const l of promptListeners) l()
  })
}

export function usePrompt(): PromptRequest | null {
  return useSyncExternalStore(
    (l) => {
      promptListeners.add(l)
      return () => promptListeners.delete(l)
    },
    () => prompt,
    () => null
  )
}
