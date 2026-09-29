import { intlLocale, type Locale } from "@/i18n/config"
import { DISPLAY_DIGITS } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"

/** Locale-aware formatting. Every visible number goes through here (or <TokenAmount>). */

export function formatToken(amount: number, symbol: TokenSymbol, locale: Locale, digits = DISPLAY_DIGITS[symbol]): string {
  const n = new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(amount)
  return `${n} ${symbol}`
}

export function formatUsd(amount: number, locale: Locale, compact = false): string {
  if (compact && Math.abs(amount) >= 10_000) {
    return new Intl.NumberFormat(intlLocale[locale], {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Prices: 2 decimals under $10,000, whole dollars above. */
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: amount >= 10_000 ? 0 : 2,
    maximumFractionDigits: amount >= 10_000 ? 0 : 2,
  }).format(amount)
}

/** Percentages always with 2 decimals (family convention for rates). */
export function formatPct(fraction: number, locale: Locale, digits = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction)
}

/** Signed percentage change, e.g. "−25.00 %". */
export function formatChange(fraction: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    signDisplay: "exceptZero",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fraction)
}

/** Health factor with 2 decimals; ∞ when there is no debt. */
export function formatHf(hf: number, locale: Locale): string {
  if (!Number.isFinite(hf) || hf > 99) return "∞"
  return new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(hf)
}

export function formatNumber(n: number, locale: Locale, digits = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(n)
}

/** Value for an <input>: plain digits with the locale's decimal separator, no grouping. */
export function inputValue(n: number, locale: Locale, digits: number): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits, useGrouping: false }).format(n)
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
