import { cn } from "@/lib/utils"

/** Governance timeline: propose → queued (timelock) → execute → re-rated. Flat orange line art. */
export function TimelockTimeline({ steps, active = 1, className }: { steps: string[]; active?: number; className?: string }) {
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-4 sm:gap-0", className)}>
      {steps.map((step, i) => {
        const done = i < active
        const current = i === active
        return (
          <li key={step} className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 sm:pr-4">
            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 left-[0.6875rem] h-[calc(100%-0.5rem)] w-0.5 sm:top-[0.6875rem] sm:left-6 sm:h-0.5 sm:w-[calc(100%-1.5rem)]",
                  done ? "bg-primary" : "bg-border",
                  // The timelock segment is dashed: time has to pass.
                  i === 1 && "border-l-2 border-dashed border-primary bg-transparent sm:border-t-2 sm:border-l-0"
                )}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 size-6 shrink-0 rounded-full border-2",
                done ? "border-primary bg-primary" : current ? "border-primary bg-card" : "border-border bg-card"
              )}
            />
            <span className={cn("text-sm", current ? "font-bold" : "text-muted-foreground")}>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}
