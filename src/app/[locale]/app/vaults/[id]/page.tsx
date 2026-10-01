import type { Metadata } from "next"

import { VaultView } from "@/components/demo/vault-view"
import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { SEED_VAULT_IDS } from "@/lib/demo/seed"
import { pageMetadata } from "@/lib/metadata"

// The seeded vaults are prerendered; vaults opened in the browser render on demand
// (the page is a client shell that reads the vault from local demo state).
export function generateStaticParams() {
  return locales.flatMap((locale) => SEED_VAULT_IDS.map((id) => ({ locale, id })))
}

export async function generateMetadata({ params }: PageProps<"/[locale]/app/vaults/[id]">): Promise<Metadata> {
  const { locale, id } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.vault
  const n = id.replace(/^v/, "")
  return { ...pageMetadata(locale, `/app/vaults/${id}`, `${m.title} #${n}`, m.description), robots: { index: false, follow: true } }
}

export default async function VaultPage({ params }: PageProps<"/[locale]/app/vaults/[id]">) {
  const { id } = await params
  return <VaultView id={id} />
}
