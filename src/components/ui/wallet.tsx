"use client"

import * as React from "react"
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function truncateAddress(address: string, start = 6, end = 4) {
  if (address.length <= start + end + 1) return address
  return `${address.slice(0, start)}…${address.slice(-end)}`
}

const avatarPx = { sm: 24, md: 32, lg: 40 } as const
const nameText = { sm: "text-xs", md: "text-sm", lg: "text-base" } as const

type WalletSize = keyof typeof avatarPx

function Wallet({
  address,
  name,
  size = "md",
  showCopy = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  address: string
  name?: string
  size?: WalletSize
  showCopy?: boolean
}) {
  return (
    <div
      data-slot="wallet"
      className={cn(
        "inline-flex items-center gap-3 rounded-lg border bg-card p-2 pr-3 text-card-foreground shadow-xs",
        className
      )}
      {...props}
    >
      <WalletAvatar address={address} size={avatarPx[size]} />
      <div className="flex min-w-0 flex-col leading-tight">
        {name && (
          <span className={cn("truncate font-medium", nameText[size])}>
            {name}
          </span>
        )}
        <WalletAddress
          address={address}
          className={cn(
            "text-muted-foreground",
            name ? "text-xs" : nameText[size]
          )}
        />
      </div>
      {showCopy && <WalletCopyButton address={address} />}
    </div>
  )
}

function WalletAvatar({
  address,
  size = 32,
  className,
  style,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  address: string
  size?: number
}) {
  return (
    <div
      data-slot="wallet-avatar"
      aria-hidden="true"
      className={cn("shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <Jazzicon diameter={size} seed={jsNumberForAddress(address)} />
    </div>
  )
}

function WalletAddress({
  address,
  start = 6,
  end = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  address: string
  start?: number
  end?: number
}) {
  return (
    <span
      data-slot="wallet-address"
      className={cn("font-mono tabular-nums", className)}
      title={address}
      {...props}
    >
      {truncateAddress(address, start, end)}
    </span>
  )
}

function WalletCopyButton({
  address,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "onClick"> & {
  address: string
}) {
  const [copied, setCopied] = React.useState(false)

  const onCopy = React.useCallback(() => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      const id = window.setTimeout(() => setCopied(false), 1500)
      return () => window.clearTimeout(id)
    })
  }, [address])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onCopy}
      aria-label={copied ? "Address copied" : "Copy address"}
      className={cn("size-7", className)}
      {...props}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </Button>
  )
}

export { Wallet, WalletAvatar, WalletAddress, WalletCopyButton }
