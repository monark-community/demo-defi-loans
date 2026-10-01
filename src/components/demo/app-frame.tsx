"use client"

import { Loader2Icon, PlusIcon, WalletIcon, XCircleIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { healthFactor, statePrices } from "@/lib/demo/risk"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import { connectWallet } from "@/lib/demo/wallet"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"

/**
 * App chrome under the site header: one compact bar (section nav, a network pill
 * that opens the demo controls, "Open a vault"); gates on wallet connection.
 * The testnet notice lives in the wallet prompt only (brand guidelines §11).
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app } = useAppCopy()
  const connected = demo?.wallet.status === "connected"

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-secondary/40">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          {connected ? <AppNav /> : null}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {demo ? <DemoControls /> : null}
            {connected ? <OpenVaultLink /> : null}
          </div>
        </div>
      </div>
      {!storageOk ? (
        <p role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 text-sm text-warning sm:px-6">
          {app.storageError}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-8">
        {!demo ? <AppLoading label={app.loading} /> : !connected ? <ConnectGate /> : children}
      </div>
    </div>
  )
}

function OpenVaultLink() {
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  const openHref = href(locale, "/app/open")
  const active = pathname === openHref
  return (
    <Button asChild size="sm" variant={active ? "outline" : "default"} className="hidden sm:inline-flex">
      <Link href={openHref} aria-current={active ? "page" : undefined}>
        <PlusIcon aria-hidden="true" />
        {app.nav.open}
      </Link>
    </Button>
  )
}

function AppNav() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  if (!demo) return null
  const prices = statePrices(demo)
  const liquidatable = demo.vaults.filter((v) => healthFactor(v, prices, demo.params) < 1).length
  const items = [
    { href: href(locale, "/app"), label: app.nav.console, exact: true },
    { href: href(locale, "/app/liquidations"), label: app.nav.liquidations, count: liquidatable },
    { href: href(locale, "/app/parameters"), label: app.nav.parameters },
  ]

  return (
    <nav aria-label={app.nav.label} className="min-w-0">
      <ul className="flex max-w-full gap-0.5 overflow-x-auto rounded-full border bg-card p-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href || pathname.startsWith(`${item.href}/vaults`) : pathname.startsWith(item.href)
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors duration-150",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
                {item.count ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[0.6875rem] font-extrabold text-white tnum dark:text-background">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      <div className="h-10 w-72 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-3xl bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
    </div>
  )
}

function ConnectGate() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const g = app.gate
  const connecting = demo?.wallet.status === "connecting"
  const rejected = demo?.wallet.lastError === "rejected"

  return (
    <section aria-labelledby="gate-title" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-8 text-center">
      <Image src="/brand/monark-mark.svg" alt="" width={56} height={56} unoptimized className="size-14" />
      <h1 id="gate-title" className="mt-6 text-3xl font-extrabold tracking-display">
        {g.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{g.body}</p>
      <Button
        size="lg"
        className="mt-8 w-full sm:w-auto"
        disabled={connecting}
        onClick={() =>
          void connectWallet({
            title: app.summaries.signIn,
            rows: [{ label: app.summaries.signInRow, value: app.summaries.signInValue }],
            movesValue: false,
            noFee: true,
          })
        }
      >
        {connecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <WalletIcon aria-hidden="true" />}
        {connecting ? app.wallet.connecting : g.connect}
      </Button>
      <div aria-live="polite" className="mt-4 min-h-6">
        {rejected ? (
          <p role="alert" className="flex items-start gap-2 text-left text-sm text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {g.rejected}
          </p>
        ) : null}
      </div>
    </section>
  )
}
