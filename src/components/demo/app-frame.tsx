"use client"

import { Loader2Icon, PlusIcon, WalletIcon, XCircleIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { AppLoading } from "@/components/ui/app-loading"
import { AppTabs } from "@/components/ui/app-tabs"
import { Button } from "@/components/ui/button"
import { MonarkMark } from "@/components/ui/site-brand"
import { href } from "@/i18n/config"
import { healthFactor, statePrices } from "@/lib/demo/risk"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import { connectWallet } from "@/lib/demo/wallet"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"

/**
 * App chrome under the site header: one compact bar (@monark/ui app-tabs: section
 * tabs, a network pill that opens the demo controls, "Open a vault"); gates on wallet connection.
 * The testnet notice lives in the wallet prompt only (brand guidelines §11).
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  const connected = demo?.wallet.status === "connected"
  const liquidatable = demo
    ? demo.vaults.filter((v) => healthFactor(v, statePrices(demo), demo.params) < 1).length
    : 0
  const consoleHref = href(locale, "/app")
  const tabs = [
    // The console owns the vault pages too.
    {
      href: consoleHref,
      label: app.nav.console,
      active: pathname === consoleHref || pathname.startsWith(`${consoleHref}/vaults`),
    },
    {
      href: href(locale, "/app/liquidations"),
      // Red count of liquidatable vaults: the registry's count badge is orange.
      label: (
        <>
          {app.nav.liquidations}
          {liquidatable ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[0.6875rem] font-extrabold text-white tnum dark:text-background">
              {liquidatable}
            </span>
          ) : null}
        </>
      ),
    },
    { href: href(locale, "/app/parameters"), label: app.nav.parameters },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <AppTabs
        tabs={connected ? tabs : []}
        pathname={pathname}
        LinkComponent={Link}
        label={app.nav.label}
        actions={
          <>
            {demo ? <DemoControls /> : null}
            {connected ? <OpenVaultLink /> : null}
          </>
        }
      />
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

function ConnectGate() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const g = app.gate
  const connecting = demo?.wallet.status === "connecting"
  const rejected = demo?.wallet.lastError === "rejected"

  return (
    <section aria-labelledby="gate-title" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-8 text-center">
      <MonarkMark className="size-14" />
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
