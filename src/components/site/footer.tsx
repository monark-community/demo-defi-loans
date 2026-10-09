import Link from "next/link"

import { MONARK_SOCIALS, SiteFooter as MonarkSiteFooter } from "@/components/ui/site-footer"
import { href, REPO_URL, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

/** VaultLend's wiring of the standard Monark three-band footer (@monark/ui site-footer). */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const f = c.footer

  return (
    <MonarkSiteFooter
      product={c.product}
      description={f.product}
      links={[
        { href: href(locale), label: c.nav.overview },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: href(locale, "/app"), label: c.nav.demo },
        { href: href(locale, "/credits"), label: c.nav.credits },
      ]}
      resources={[
        { href: `https://www.monark.io/${locale}/project/defi-loans`, label: f.projectPage },
        { href: REPO_URL, label: f.repo },
      ]}
      socials={MONARK_SOCIALS.map((s) => ({ ...s, label: f.social[s.key as keyof typeof f.social] }))}
      copyright={`© ${new Date().getFullYear()} ${f.legal}`}
      demoNotice={c.demoBadge}
      legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
      LinkComponent={Link}
      labels={{ productNav: f.productNav, builtBy: f.builtBy, monarkHome: f.monarkHome, tagline: f.tagline, socials: f.socialLabel }}
    >
      {/* Sibling demos: the Monark DeFi family */}
      <nav aria-label={f.family} className="flex flex-col gap-3 rounded-2xl border border-dashed px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5">
        <p className="eyebrow shrink-0 text-muted-foreground">{f.family}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {f.familyItems.map((item) => (
            <li key={item.name}>
              <a href={item.url} className="inline-flex min-h-11 items-baseline gap-1.5 text-sm md:min-h-0">
                <span className="font-bold text-primary-ink underline underline-offset-4">{item.name}</span>
                <span className="text-muted-foreground">{item.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MonarkSiteFooter>
  )
}
