import type { Metadata } from "next"

import { OpenVault } from "@/components/demo/open-vault"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/open">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.open
  return pageMetadata(locale, "/app/open", m.title, m.description)
}

export default function OpenVaultPage() {
  return <OpenVault />
}
