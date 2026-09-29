import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export const alt = "VaultLend by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// A miniature risk map: dots on a health-factor ruler, three of them past the liquidation line.
const DOTS = [
  { x: 70, r: 16, c: "#c81e0b" },
  { x: 150, r: 12, c: "#8a5a00" },
  { x: 205, r: 20, c: "#8a5a00" },
  { x: 300, r: 14, c: "#2f7a4a" },
  { x: 345, r: 18, c: "#2f7a4a" },
  { x: 400, r: 11, c: "#2f7a4a" },
]

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>VaultLend</span>
              <span style={{ fontSize: 22, color: "#625952", marginTop: 6 }}>{d.common.byMonark}</span>
            </div>
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.5 }}>{d.meta.ogTagline}</div>
          <div style={{ fontSize: 22, color: "#625952" }}>{d.common.demoBadge}</div>
        </div>
        <svg width="460" height="486" viewBox="0 0 460 486" style={{ marginLeft: 20 }}>
          <rect x="0" y="200" width="110" height="90" rx="12" fill="#c81e0b" fillOpacity="0.08" />
          <rect x="110" y="200" width="130" height="90" rx="0" fill="#8a5a00" fillOpacity="0.08" />
          <rect x="240" y="200" width="220" height="90" rx="12" fill="#2f7a4a" fillOpacity="0.08" />
          <line x1="110" y1="170" x2="110" y2="320" stroke="#F88D10" strokeWidth="4" strokeLinecap="round" />
          <line x1="0" y1="245" x2="460" y2="245" stroke="#E9DFD7" strokeWidth="3" />
          {DOTS.map((dot) => (
            <circle key={dot.x} cx={dot.x} cy="245" r={dot.r} fill="#FFFEFC" stroke={dot.c} strokeWidth="5" />
          ))}
          <circle cx="205" cy="245" r="30" fill="none" stroke="#F88D10" strokeWidth="4" />
        </svg>
      </div>
    ),
    size
  )
}
