"use client"

import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { toast, Toaster } from "sonner"

import type { Dictionary } from "@/i18n"
import { href, type Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { initDemo, useDemo } from "@/lib/demo/store"
import { formatHf } from "@/lib/format"

import { WalletPrompt } from "./wallet-prompt"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  seed: Dictionary["seed"]
  status: Dictionary["common"]["status"]
  disclaimer: string
  demoBadge: string
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
      // The console lists every alert in its own live panel; a toast there would sit on top of it.
      if (pathname === href(locale, "/app")) continue
      const message = t(app.console.alerts.toast[a.kind], { n: a.vaultNumber, hf: formatHf(a.hf, locale) })
      const action = { label: app.console.alerts.toastAction, onClick: () => router.push(href(locale, `/app/vaults/${a.vaultId}`)) }
      if (a.kind === "recovered") toast.success(message, { action })
      else toast.warning(message, { action, duration: 7000 })
    }
  }, [demo, app, locale, router, pathname])

  return null
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    initDemo({ walletName: value.seed.walletName })
  }, [value.seed.walletName])

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletPrompt />
      <AlertWatcher />
      <Toaster
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        // Top-right, just under the sticky 64px header and the app bar: page
        // titles are left-aligned, so that corner never hides the risk map,
        // the stress-test sliders or a form while a transaction settles. On
        // phones sonner goes full width, so it drops below the header there too.
        position="top-right"
        offset={{ top: 80, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-md",
            description: "!text-muted-foreground",
            actionButton: "!rounded-full !bg-primary !font-bold !text-primary-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}
