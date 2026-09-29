"use client"

import { ClockIcon, FastForwardIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { t } from "@/i18n/t"
import { advanceTime } from "@/lib/demo/ops"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"
import { formatDateTime } from "@/lib/format"

import { useAppCopy } from "./app-provider"

/** Visible demo controls: protocol clock, network speed, forced failure, and "Reset demo". */
export function DemoControls() {
  const demo = useDemo()
  const { app, seed, locale } = useAppCopy()
  const c = app.controls
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  if (!demo) return null

  const forward = (days: number) => {
    advanceTime(days * 24)
    toast.success(t(c.advanced, { days: days === 1 ? c.days.one : t(c.days.other, { n: days }) }))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setConfirming(false)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontalIcon aria-hidden="true" />
          {c.open}
          {demo.settings.failNext || demo.settings.slow ? <span className="size-2 rounded-full bg-warning" aria-hidden="true" /> : null}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={app.close} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{c.title}</DialogTitle>
          <DialogDescription className="sr-only">{c.resetHint}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border p-4">
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

        <div className="flex flex-col divide-y rounded-2xl border">
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-slow" className="text-sm font-bold">
                {c.slow}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.slowHint}</p>
            </div>
            <Switch id="ctl-slow" checked={demo.settings.slow} onCheckedChange={(v) => setSettings({ slow: v })} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <Label htmlFor="ctl-fail" className="text-sm font-bold">
                {c.failNext}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{c.failNextHint}</p>
            </div>
            <Switch id="ctl-fail" checked={demo.settings.failNext} onCheckedChange={(v) => setSettings({ failNext: v })} />
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          {!confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{c.resetHint}</p>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} className="shrink-0">
                <RotateCcwIcon aria-hidden="true" />
                {c.reset}
              </Button>
            </div>
          ) : (
            <div role="alertdialog" aria-labelledby="reset-q" className="flex flex-col gap-3">
              <p id="reset-q" className="font-bold">
                {c.resetConfirm}
              </p>
              <p className="text-xs text-muted-foreground">{c.resetConfirmBody}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  autoFocus
                  onClick={() => {
                    resetDemo({ walletName: seed.walletName })
                    setConfirming(false)
                    setOpen(false)
                    toast.success(c.resetDone)
                  }}
                >
                  {c.resetDo}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {c.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
