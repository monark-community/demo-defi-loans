"use client"

import { useCallback, useRef, useState } from "react"

import { randomHash } from "./ids"
import { getDemo, requestSignature, setSettings } from "./store"
import type { TxError, TxState, TxSummary } from "./types"

/**
 * Simulated chain. A transaction is: wallet prompt (confirm or reject) ->
 * pending with a hash for a realistic block time -> confirmed or reverted.
 * "Fail the next transaction" in the demo controls forces one revert, and
 * protocol rules are re-checked at execution time (prices may have moved).
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function blockTime(): number {
  const slow = getDemo()?.settings.slow
  const [min, max] = slow ? [3000, 6000] : [1200, 2400]
  return Math.round(min + Math.random() * (max - min))
}

/** Estimated network fee shown in the wallet prompt (simulated, in tETH). */
export function estimateFee(): string {
  return (0.00042 + Math.random() * 0.00031).toFixed(5)
}

/**
 * `apply` runs once the block is mined. It performs the state change and
 * returns null, or returns a protocol error to revert the transaction.
 */
export type Apply = (hash: string) => TxError | null

export function useTx() {
  const [state, setState] = useState<TxState>({ phase: "idle" })
  const busy = useRef(false)

  const run = useCallback(async (summary: TxSummary, apply: Apply) => {
    if (busy.current) return false
    busy.current = true
    try {
      setState({ phase: "signing" })
      const ok = await requestSignature(summary)
      if (!ok) {
        setState({ phase: "failed", error: "rejected" })
        return false
      }
      const hash = randomHash()
      setState({ phase: "pending", hash })
      await sleep(blockTime())
      if (getDemo()?.settings.failNext) {
        setSettings({ failNext: false })
        setState({ phase: "failed", hash, error: "reverted" })
        return false
      }
      const error = apply(hash)
      if (error) {
        setState({ phase: "failed", hash, error })
        return false
      }
      setState({ phase: "confirmed", hash })
      return true
    } finally {
      busy.current = false
    }
  }, [])

  const reset = useCallback(() => setState({ phase: "idle" }), [])

  return { state, run, reset, busy: state.phase === "signing" || state.phase === "pending" }
}
