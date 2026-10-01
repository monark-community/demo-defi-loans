/**
 * "Anatomy of a liquidation": four line-art panels in flat orange strokes
 * (brand guidelines §6), drawn in JSX. Decorative; the text carries the meaning.
 */

const stroke = {
  fill: "none",
  stroke: "var(--primary)",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}
const muted = { ...stroke, stroke: "var(--border)" }

function PriceFalls() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full" aria-hidden="true">
      <path d="M8 70 H112" {...muted} />
      <path d="M10 18 L32 24 L46 20 L60 34 L74 30 L90 56 L108 62" {...stroke} />
      <path d="M100 52 L108 62 L96 64" {...stroke} />
      <circle cx="10" cy="18" r="3" {...stroke} fill="var(--card)" />
    </svg>
  )
}

function HealthDrops() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full" aria-hidden="true">
      <path d="M20 64 A40 40 0 0 1 100 64" {...muted} />
      <path d="M20 64 A40 40 0 0 1 36 32" {...stroke} strokeWidth={4} />
      <path d="M60 64 L32 42" {...stroke} />
      <circle cx="60" cy="64" r="4" fill="var(--primary)" />
      <path d="M36 26 L40 36" {...stroke} strokeDasharray="2 4" />
    </svg>
  )
}

function LiquidatorRepays() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full" aria-hidden="true">
      <rect x="10" y="24" width="34" height="34" rx="8" {...stroke} />
      <rect x="76" y="18" width="34" height="46" rx="8" {...muted} />
      <rect x="76" y="41" width="34" height="23" rx="0" fill="var(--primary)" fillOpacity={0.14} stroke="none" />
      <path d="M50 41 H70" {...stroke} />
      <path d="M64 35 L70 41 L64 47" {...stroke} />
      <path d="M20 41 H34 M27 34 V48" {...stroke} />
    </svg>
  )
}

function CollateralMoves() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full" aria-hidden="true">
      <rect x="10" y="20" width="36" height="40" rx="8" {...muted} />
      <circle cx="28" cy="40" r="9" {...stroke} />
      <path d="M52 40 C66 40 66 26 80 26" {...stroke} />
      <path d="M52 40 C66 40 66 54 80 54" {...stroke} strokeDasharray="3 4" />
      <circle cx="90" cy="26" r="9" {...stroke} />
      <circle cx="90" cy="54" r="5" fill="var(--primary)" stroke="none" />
      <path d="M100 54 H110" {...stroke} />
    </svg>
  )
}

const PANELS = [PriceFalls, HealthDrops, LiquidatorRepays, CollateralMoves]

export function AnatomyStrip({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => {
        const Panel = PANELS[i] ?? PriceFalls
        return (
          <li key={step.title} className="relative flex flex-col rounded-3xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-extrabold tnum">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold">{step.title}</h3>
            </div>
            <div className="mt-4 rounded-2xl bg-muted/50 px-4 py-2">
              <Panel />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{step.body}</p>
          </li>
        )
      })}
    </ol>
  )
}
