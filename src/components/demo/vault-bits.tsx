"use client"

import { WalletAddress } from "@/components/ui/wallet"
import type { Locale } from "@/i18n/config"
import { COLLATERAL } from "@/lib/demo/tokens"
import type { CollateralBag, TokenSymbol } from "@/lib/demo/types"
import { formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

/** A tiny token glyph: flat, monochrome ring with the symbol's letter (no brand logos for test tokens). */
export function TokenGlyph({ symbol, className }: { symbol: TokenSymbol; className?: string }) {
  const letter = symbol.slice(1, 2)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[0.625rem] font-extrabold",
        symbol === "tUSDC" || symbol === "tDAI" ? "border-muted-foreground text-muted-foreground" : "border-primary text-primary-ink",
        className
      )}
    >
      {letter}
    </span>
  )
}

export function CollateralList({ collateral, locale, className }: { collateral: CollateralBag; locale: Locale; className?: string }) {
  const items = COLLATERAL.filter((c) => (collateral[c] ?? 0) > 0)
  return (
    <span className={cn("flex flex-col gap-0.5", className)}>
      {items.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 whitespace-nowrap tnum">
          <TokenGlyph symbol={c} className="size-4 text-[0.5625rem]" />
          {formatToken(collateral[c] ?? 0, c, locale)}
        </span>
      ))}
    </span>
  )
}

export function Owner({ address, yours, youLabel }: { address: string; yours: boolean; youLabel: string }) {
  return yours ? (
    <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-foreground">{youLabel}</span>
  ) : (
    <WalletAddress address={address} className="text-xs text-muted-foreground" />
  )
}
