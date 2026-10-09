"use client"

import { ClockIcon, FastForwardIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DemoControls as MonarkDemoControls } from "@/components/ui/demo-controls"
import { t } from "@/i18n/t"
import { advanceTime } from "@/lib/demo/ops"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"
import { formatDateTime } from "@/lib/format"

import { useAppCopy } from "./app-provider"

/** VaultLend's demo controls (@monark/ui demo-controls) plus its protocol clock. */
export function DemoControls() {
  const demo = useDemo()
  const { app, seed, locale } = useAppCopy()
  const c = app.controls
  if (!demo) return null

  const forward = (days: number) => {
    advanceTime(days * 24)
    toast.success(t(c.advanced, { days: days === 1 ? c.days.one : t(c.days.other, { n: days }) }))
  }

  return (
    <MonarkDemoControls
      networkName={NETWORK_NAME}
      slow={demo.settings.slow}
      onSlowChange={(v) => setSettings({ slow: v })}
      failNext={demo.settings.failNext}
      onFailNextChange={(v) => setSettings({ failNext: v })}
      onReset={() => {
        resetDemo({ walletName: seed.walletName })
        toast.success(c.resetDone)
      }}
      title={c.title}
      openLabel={c.open}
      slowLabel={c.slow}
      slowHint={c.slowHint}
      failNextLabel={c.failNext}
      failNextHint={c.failNextHint}
      resetLabel={c.reset}
      resetHint={c.resetHint}
      resetConfirmTitle={c.resetConfirm}
      resetConfirmBody={c.resetConfirmBody}
      resetConfirmLabel={c.resetDo}
      cancelLabel={c.cancel}
      closeLabel={app.close}
    >
      <div className="p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <ClockIcon className="size-4 text-primary" aria-hidden="true" />
          {c.time}
        </p>
        <p className="mt-1 font-mono text-sm tnum">{formatDateTime(demo.clock, locale)} UTC</p>
        <p className="mt-1 text-xs text-muted-foreground">{c.timeHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => forward(1)}>
            <FastForwardIcon aria-hidden="true" />
            {c.plus1}
          </Button>
          <Button size="sm" variant="outline" onClick={() => forward(30)}>
            <FastForwardIcon aria-hidden="true" />
            {c.plus30}
          </Button>
        </div>
      </div>
    </MonarkDemoControls>
  )
}
