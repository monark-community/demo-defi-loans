"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react"
import { toast } from "sonner"

import { MonarkMark } from "@/components/ui/site-brand"
import { Toaster } from "@/components/ui/sonner"
import { WalletPrompt } from "@/components/ui/wallet-prompt"
import type { Dictionary } from "@/i18n"
import { href, intlLocale, type Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { estimateFee } from "@/lib/demo/chain"
import { initDemo, useDemo, usePrompt } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import type { TxState } from "@/lib/demo/types"
import { formatHf } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  seed: Dictionary["seed"]
  status: Dictionary["common"]["status"]
  disclaimer: string
}

const AppContext = createContext<AppCopy | null>(null)

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

/** Toast new alerts about the visitor's own vaults (all alerts stay listed on the console). */
function AlertWatcher() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const router = useRouter()
  const pathname = usePathname()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!demo) return
    if (seen.current === null) {
      // Alerts that existed before this page loaded are not re-announced.
      seen.current = new Set(demo.alerts.map((a) => a.id))
      return
    }
    for (const a of demo.alerts) {
      if (seen.current.has(a.id)) continue
      seen.current.add(a.id)
      if (!a.yours || demo.wallet.status !== "connected") continue
      // The console lists every alert in its own live panel, and the vault's own page shows its
      // status in place: a toast there would sit on top of the very thing it reports.
      if (pathname === href(locale, "/app") || pathname === href(locale, `/app/vaults/${a.vaultId}`)) continue
      const message = t(app.console.alerts.toast[a.kind], { n: a.vaultNumber, hf: formatHf(a.hf, locale) })
      const action = { label: app.console.alerts.toastAction, onClick: () => router.push(href(locale, `/app/vaults/${a.vaultId}`)) }
      if (a.kind === "recovered") toast.success(message, { action })
      else toast.warning(message, { action, duration: 7000 })
    }
  }, [demo, app, locale, router, pathname])

  return null
}

/** The simulated wallet's confirmation sheet (@monark/ui wallet-prompt), bound to the store. Closing it counts as a rejection. */
function PromptHost() {
  const prompt = usePrompt()
  const demo = useDemo()
  const { app, disclaimer, locale } = useAppCopy()
  const p = app.prompt
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : ""), [prompt])
  const movesValue = !!prompt?.summary.movesValue

  return (
    <WalletPrompt
      open={!!prompt}
      onConfirm={() => prompt?.resolve(true)}
      onReject={() => prompt?.resolve(false)}
      site={
        <>
          <MonarkMark />
          {p.site}
        </>
      }
      title={prompt?.summary.title ?? p.title}
      description={p.title}
      account={demo ? { name: demo.wallet.name, address: demo.wallet.address } : undefined}
      rows={prompt?.summary.rows}
      network={NETWORK_NAME}
      fee={!prompt?.summary.noFee && fee ? `${Number(fee).toLocaleString(intlLocale[locale], { maximumFractionDigits: 5 })} tETH` : undefined}
      disclaimer={movesValue ? disclaimer : p.simulated}
      warning={movesValue}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      networkLabel={p.network}
      feeLabel={p.fee}
      closeLabel={app.close}
    />
  )
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  useEffect(() => {
    initDemo({ walletName: value.seed.walletName })
  }, [value.seed.walletName])

  return (
    <AppContext.Provider value={value}>
      {children}
      <PromptHost />
      <AlertWatcher />
      <Toaster
        // Top-right, just under the sticky 64px header and the app bar: page
        // titles are left-aligned, so that corner never hides the risk map,
        // the stress-test sliders or a form while a transaction settles. On
        // phones sonner goes full width, so it drops below the header there too.
        position="top-right"
        offset={{ top: 80, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
        toastOptions={{
          classNames: {
            toast: "cn-toast !rounded-2xl !shadow-md",
            actionButton: "!rounded-full !bg-primary !font-bold !text-primary-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}

/**
 * Props for @monark/ui's TxFeedback from a transaction's state, in the page's
 * language. The pending and confirmed pills carry the hash; a failed
 * transaction shows its reason once, without a second "failed" pill.
 */
export function txFeedbackProps(
  tx: Dictionary["app"]["tx"],
  state: TxState,
  { confirmedLabel, className }: { confirmedLabel?: string; className?: string } = {}
) {
  return {
    phase: state.phase,
    hash: state.phase === "failed" ? undefined : state.hash,
    error: state.error,
    signingLabel: tx.signing,
    pendingLabel: tx.pending,
    pendingStatusLabel: tx.pendingStatus,
    confirmedLabel: confirmedLabel ?? tx.confirmed,
    failedLabel: tx.failed,
    reasons: tx.errors,
    retryLabel: tx.retry,
    dismissLabel: tx.dismiss,
    className: cn(state.phase === "confirmed" && "vl-stamp", className),
  }
}
