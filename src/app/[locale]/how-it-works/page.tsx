import { ArrowRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { ReceiptBar } from "@/components/diagrams/receipt-bar"
import { TimelockTimeline } from "@/components/diagrams/timelock"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { COLLATERAL, DEFAULT_PARAMS } from "@/lib/demo/tokens"
import { formatPct, formatUsd } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

import whiteboardImg from "../../../../public/images/whiteboard.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

function Formula({ children }: { children: ReactNode }) {
  return <p className="mt-5 rounded-2xl border-l-4 border-primary bg-card px-5 py-4 font-mono text-sm leading-relaxed sm:text-base">{children}</p>
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="text-2xl font-bold tracking-display sm:text-[2rem]">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const toc = [
    { id: "health-factor", label: h.hf.title },
    { id: "liquidation-price", label: h.liqPrice.title },
    { id: "interest", label: h.interest.title },
    { id: "liquidations", label: h.liquidation.title },
    { id: "parameters", label: h.params.title },
    { id: "governance", label: h.governance.title },
    { id: "glossary", label: h.glossary.title },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-display sm:text-5xl">{h.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{h.intro}</p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label={h.toc} className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-muted-foreground">{h.toc}</p>
          <ol className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {toc.map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold hover:bg-muted lg:border-0 lg:px-2">
                  <span className="text-xs text-muted-foreground tnum">{i + 1}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex max-w-3xl flex-col gap-16">
          <Block id="health-factor" title={h.hf.title}>
            <p className="mt-3 text-muted-foreground">{h.hf.body}</p>
            <Formula>{h.hf.formula}</Formula>
            <div className="mt-6 grid gap-5 rounded-3xl border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-6">
              <div>
                <h3 className="font-bold">{h.hf.exampleTitle}</h3>
                <dl className="mt-3 flex flex-col divide-y text-sm">
                  {h.hf.example.map((row) => (
                    <div key={row.label} className="flex flex-wrap justify-between gap-x-4 py-2">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-semibold tnum">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {/* Balance diagram: threshold-weighted collateral vs debt */}
              <figure aria-hidden="true" className="flex flex-col justify-end gap-3">
                <div className="flex items-end gap-4" style={{ height: 180 }}>
                  <div className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full overflow-hidden rounded-t-2xl border-2 border-primary" style={{ height: 176 }}>
                      <div className="absolute inset-x-0 top-0 border-b-2 border-dashed border-primary/60" style={{ height: `${(1 - 0.83) * 100}%` }} />
                      <div className="absolute inset-x-0 bottom-0 bg-primary/15" style={{ height: "83%" }} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-2xl border-2 border-foreground/70 bg-muted" style={{ height: Math.round((176 * 9800) / 19200) }} />
                  </div>
                </div>
                <div className="flex gap-4 text-center text-xs font-semibold">
                  <span className="flex-1">{h.hf.diagram.collateral}</span>
                  <span className="flex-1">{h.hf.diagram.debt}</span>
                </div>
                <p className="text-center text-sm font-extrabold text-success tnum">{h.hf.diagram.ratio}</p>
              </figure>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{h.hf.bands}</p>
          </Block>

          <Block id="liquidation-price" title={h.liqPrice.title}>
            <p className="mt-3 text-muted-foreground">{h.liqPrice.body}</p>
            <Formula>{h.liqPrice.formula}</Formula>
            <p className="mt-4 font-semibold tnum">{h.liqPrice.example}</p>
            <p className="mt-2 text-sm text-muted-foreground">{h.liqPrice.note}</p>
          </Block>

          <Block id="interest" title={h.interest.title}>
            <p className="mt-3 text-muted-foreground">{h.interest.body}</p>
            <Formula>{h.interest.formula}</Formula>
            <p className="mt-4 font-semibold tnum">{h.interest.example}</p>
          </Block>

          <Block id="liquidations" title={h.liquidation.title}>
            <p className="mt-3 text-muted-foreground">{h.liquidation.body}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {h.liquidation.rules.map((r) => (
                <div key={r.label} className="rounded-2xl border bg-card p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">{r.label}</dt>
                  <dd className="mt-1 font-bold">{r.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 rounded-3xl border bg-card p-5 sm:p-6">
              <h3 className="font-bold">{h.liquidation.receiptTitle}</h3>
              <dl className="mt-3 flex flex-col divide-y text-sm">
                {h.liquidation.receipt.map((row) => (
                  <div key={row.label} className="flex flex-wrap justify-between gap-x-4 py-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-semibold tnum">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <ReceiptBar
                className="mt-4"
                coversLabel={dict.app.liquidate.receipt.covers}
                bonusLabel={dict.app.liquidate.receipt.bonus}
                coversValue={formatUsd(6600, locale)}
                bonusValue={formatUsd(660, locale)}
                bonusShare={660 / 7260}
                animate={false}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{h.liquidation.note}</p>
          </Block>

          <SectionDivider className="px-0 sm:px-0" />

          <Block id="parameters" title={h.params.title}>
            <p className="mt-3 text-muted-foreground">{h.params.body}</p>
            <div className="mt-5 overflow-x-auto rounded-3xl border bg-card">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-semibold">{h.params.cols.asset}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{h.params.cols.maxLtv}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{h.params.cols.threshold}</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">{h.params.cols.bonus}</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {COLLATERAL.map((c) => (
                    <tr key={c} className="border-t">
                      <th scope="row" className="px-5 py-3 text-left font-bold">{c}</th>
                      <td className="px-3 py-3 text-right">{formatPct(DEFAULT_PARAMS.collateral[c].maxLtv, locale)}</td>
                      <td className="px-3 py-3 text-right">{formatPct(DEFAULT_PARAMS.collateral[c].liqThreshold, locale)}</td>
                      <td className="px-5 py-3 text-right">{formatPct(DEFAULT_PARAMS.collateral[c].liqBonus, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{h.params.maxLtvNote}</p>
            <p className="mt-2 text-sm text-muted-foreground">{h.params.rates}</p>
          </Block>

          <Block id="governance" title={h.governance.title}>
            <p className="mt-3 text-muted-foreground">{h.governance.body}</p>
            <div className="mt-6 rounded-3xl border bg-card p-5 sm:p-6">
              <TimelockTimeline steps={h.governance.steps} active={1} />
            </div>
          </Block>

          <Block id="glossary" title={h.glossary.title}>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {h.glossary.items.map((g) => (
                <div key={g.term} className="rounded-2xl border bg-card p-4">
                  <dt className="font-bold">{g.term}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{g.def}</dd>
                </div>
              ))}
            </dl>
          </Block>
        </div>
      </div>

      <section aria-labelledby="teach-title" className="mt-20 grid gap-8 rounded-3xl border bg-card p-5 sm:p-8 lg:grid-cols-2 lg:items-center">
        <div className="overflow-hidden rounded-2xl">
          <Image src={whiteboardImg} alt={h.teach.photoAlt} sizes="(min-width: 1024px) 520px, 100vw" placeholder="blur" className="aspect-[3/2] h-auto w-full object-cover" />
        </div>
        <div>
          <h2 id="teach-title" className="text-2xl font-bold tracking-display sm:text-[2rem]">
            {h.teach.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{h.teach.body}</p>
          <Button asChild size="lg" className="mt-6">
            <Link href={href(locale, "/app")}>
              {h.teach.cta}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
