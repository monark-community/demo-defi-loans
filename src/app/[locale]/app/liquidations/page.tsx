import type { Metadata } from "next"

import { Liquidations } from "@/components/demo/liquidations"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/liquidations">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.liquidations
  return pageMetadata(locale, "/app/liquidations", m.title, m.description)
}

export default function LiquidationsPage() {
  return <Liquidations />
}
