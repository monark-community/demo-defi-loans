import type { Metadata } from "next"

import { Parameters } from "@/components/demo/parameters"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/parameters">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.parameters
  return pageMetadata(locale, "/app/parameters", m.title, m.description)
}

export default function ParametersPage() {
  return <Parameters />
}
