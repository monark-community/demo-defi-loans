"use client"

import { Input } from "@/components/ui/input"
import type { TokenSymbol } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { TokenGlyph } from "./vault-bits"

/** A token amount input with its symbol, a hint line (balance / limit) and an optional Max button. */
export function AmountField({
  id,
  label,
  value,
  onChange,
  symbol,
  hint,
  error,
  onMax,
  maxLabel,
  maxAria,
  disabled,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  symbol: TokenSymbol
  hint?: string
  error?: string | null
  onMax?: () => void
  maxLabel?: string
  maxAria?: string
  disabled?: boolean
  className?: string
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {hint ? (
          <span id={`${id}-hint`} className="text-xs text-muted-foreground tnum">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-2xl border border-input bg-card pr-1.5 pl-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
          error && "border-destructive"
        )}
      >
        <TokenGlyph symbol={symbol} />
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-lg font-bold tnum shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <span className="text-sm font-semibold text-muted-foreground">{symbol}</span>
        {onMax ? (
          <button
            type="button"
            onClick={onMax}
            disabled={disabled}
            aria-label={maxAria}
            className="inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-primary-ink hover:bg-muted disabled:opacity-50"
          >
            {maxLabel}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
