import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Context on demand (brand guidelines §8, "Restraint"): a native <details>
 * with a pill summary, used for worked examples and other secondary detail.
 */
export function Disclosure({ summary, children, className }: { summary: string; children: ReactNode; className?: string }) {
  return (
    <details className={cn("group", className)}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDownIcon className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}
