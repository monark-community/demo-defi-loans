import { ArrowRightIcon, GaugeIcon, GavelIcon, LandmarkIcon, MapIcon, ScaleIcon, ShieldCheckIcon, SirenIcon, SlidersHorizontalIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AnatomyStrip } from "@/components/diagrams/anatomy"
import { ReceiptBar } from "@/components/diagrams/receipt-bar"
import { TimelockTimeline } from "@/components/diagrams/timelock"
import { StressWidget } from "@/components/home/stress-widget"
import { ResponsiveRuler } from "@/components/risk/health-ruler"
import { StatusChip } from "@/components/risk/status-chip"
import { SectionDivider } from "@/components/site/section-divider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { href, isLocale, type Locale } from "@/i18n/config"
import { getDictionary, type Dictionary } from "@/i18n"
import { formatHf, formatPct, formatPrice, formatUsd } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

import studyGroupImg from "../../../public/images/study-group.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, "/", null, getDictionary(locale).meta.description)
}

const OUTCOME_ICONS = [GaugeIcon, SirenIcon, ScaleIcon]
const AUDIENCE_ICONS = [LandmarkIcon, SlidersHorizontalIcon, ShieldCheckIcon]

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const c = dict.common
  const m = dict.app.console.map

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={569}
          height={571}
          unoptimized
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-44 w-[34rem] max-w-none opacity-[0.09] select-none sm:-right-24 lg:-top-24 lg:-right-16 lg:w-[48rem] dark:opacity-[0.15]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 text-[2.25rem] leading-[1.06] font-extrabold tracking-display sm:text-5xl lg:text-[3.75rem]">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{c.disclaimer}</p>
          </div>
          <StressWidget
            locale={locale}
            copy={h.widget}
            zones={m.zones}
            statusLabels={{ safe: c.status.safe, at_risk: c.status.at_risk, liquidatable: c.status.liquidatable }}
            lineLabel={m.line}
            youLabel={m.you}
          />
        </div>
      </section>

      {/* Outcomes */}
      <section className="border-t bg-secondary/40" aria-labelledby="outcomes-title">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <h2 id="outcomes-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.outcomes.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.outcomes.intro}</p>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {h.outcomes.items.map((item, i) => {
              const Icon = OUTCOME_ICONS[i] ?? GaugeIcon
              return (
                <li key={item.title} className="rounded-3xl border bg-card p-6">
                  <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Anatomy of a liquidation */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="anatomy-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-primary-ink">{h.anatomy.eyebrow}</p>
            <h2 id="anatomy-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.anatomy.title}
            </h2>
          </div>
          <Button asChild variant="link" className="self-start sm:self-auto">
            <Link href={href(locale, "/how-it-works#liquidations")}>
              {h.anatomy.cta}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-10">
          <AnatomyStrip steps={h.anatomy.steps} />
        </div>
      </section>

      <SectionDivider />

      {/* Inside the console */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="console-title">
        <p className="eyebrow text-primary-ink">{h.console.eyebrow}</p>
        <h2 id="console-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.console.title}
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {h.console.items.map((item) => (
            <li key={item.key} className="flex flex-col rounded-3xl border bg-card p-6">
              <div className="flex items-center gap-2.5">
                <VignetteIcon k={item.key} />
                <h3 className="text-xl font-bold">{item.title}</h3>
              </div>
              <p className="mt-2 text-muted-foreground">{item.body}</p>
              <div className="mt-5 flex-1 rounded-2xl border bg-background/60 p-4">
                <Vignette k={item.key} locale={locale} dict={dict} />
              </div>
              <Button asChild variant="link" className="mt-4 self-start">
                <Link href={href(locale, VIGNETTE_HREF[item.key] ?? "/app")}>
                  {item.cta}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Learn it together */}
      <section className="border-y bg-secondary/40" aria-labelledby="together-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="overflow-hidden rounded-3xl border">
            <Image
              src={studyGroupImg}
              alt={h.together.photoAlt}
              sizes="(min-width: 1024px) 560px, 100vw"
              placeholder="blur"
              className="aspect-[4/3] h-auto w-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow text-primary-ink">{h.together.eyebrow}</p>
            <h2 id="together-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.together.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.together.body}</p>
            <ul className="mt-8 flex flex-col gap-5">
              {h.together.audiences.map((a, i) => {
                const Icon = AUDIENCE_ICONS[i] ?? LandmarkIcon
                return (
                  <li key={a.title} className="flex gap-4">
                    <Icon className="mt-0.5 size-6 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    <div>
                      <h3 className="font-bold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.faq.title}
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {h.faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`}>
              <AccordionTrigger className="text-left text-base font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="closing-title">
        <div className="flex flex-col items-start gap-6 rounded-3xl border bg-card p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="closing-title" className="text-3xl font-extrabold tracking-display">
              {h.closing.title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{h.closing.body}</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={href(locale, "/app")}>
              {h.closing.cta}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}

const VIGNETTE_HREF: Record<string, string> = {
  map: "/app",
  sim: "/app/open",
  liq: "/app/liquidations",
  gov: "/app/parameters",
}

function VignetteIcon({ k }: { k: string }) {
  const Icon = k === "map" ? MapIcon : k === "sim" ? GaugeIcon : k === "liq" ? SirenIcon : GavelIcon
  return <Icon className="size-6 text-primary" strokeWidth={1.75} aria-hidden="true" />
}

/** Small, static renders of each console instrument (the real ones live in /app). */
function Vignette({ k, locale, dict }: { k: string; locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const m = dict.app.console.map
  if (k === "map") {
    const sample = [0.97, 1.19, 1.21, 1.3, 1.46, 1.63, 1.82, 2.66, 3.05]
    return (
      <ResponsiveRuler
        narrowWidth={260}
        dots={sample.map((hf, i) => ({ id: `s${i}`, hf, size: [22, 26, 16, 28, 24, 20, 30, 18, 14][i] ?? 18, yours: hf === 1.63, label: formatHf(hf, locale) }))}
        zones={m.zones}
        lineLabel={m.line}
        youLabel={m.you}
        formatTick={(v) => formatHf(v, locale)}
        assumedWidth={440}
      />
    )
  }
  if (k === "sim") {
    const o = dict.app.open.preview
    return (
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
          <dt className="font-semibold">{o.hf}</dt>
          <dd className="flex items-center gap-2 tnum">
            <span className="text-muted-foreground line-through">{formatHf(1.63, locale)}</span>
            <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-lg font-extrabold text-warning">{formatHf(1.22, locale)}</span>
            <StatusChip status="at_risk" label={c.status.at_risk} />
          </dd>
        </div>
        <div className="rounded-xl border px-3 py-2">
          <dt className="text-xs text-muted-foreground">{o.liqPrice.replace("{asset}", "tETH")}</dt>
          <dd className="font-bold tnum">{formatPrice(2630.52, locale)}</dd>
        </div>
        <div className="rounded-xl border px-3 py-2">
          <dt className="text-xs text-muted-foreground">{o.limit}</dt>
          <dd className="font-bold tnum">{formatPct(0.91, locale, 0)}</dd>
        </div>
      </dl>
    )
  }
  if (k === "liq") {
    const r = dict.app.liquidate.receipt
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">{r.title}</span>
          <span className="flex items-center gap-1.5 tnum">
            <span className="font-bold text-danger">{formatHf(0.95, locale)}</span>
            <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-bold text-warning">{formatHf(1.12, locale)}</span>
          </span>
        </div>
        <ReceiptBar
          coversLabel={r.covers}
          bonusLabel={r.bonus}
          coversValue={formatUsd(6600, locale)}
          bonusValue={formatUsd(660, locale)}
          bonusShare={660 / 7260}
          animate={false}
        />
      </div>
    )
  }
  return <TimelockTimeline steps={dict.how.governance.steps} active={1} />
}
