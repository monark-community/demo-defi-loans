# Assets

## Photography

Both photos are from Unsplash under the free [Unsplash License](https://unsplash.com/license) (neither is Unsplash+). They were downloaded from `images.unsplash.com`, resized to 2,000 px on the long edge, compressed, and are served from `public/images/` with `next/image` (no remote image configuration). Photographers are credited on `/credits`, linked from the footer.

| File | Unsplash page | Photographer | Profile | Used on |
|-|-|-|-|-|
| `public/images/study-group.jpg` | https://unsplash.com/photos/XkKCui44iM0 | Priscilla Du Preez | https://unsplash.com/@priscilladupreez | Home, "Built for study groups and workshops"; `/credits` |
| `public/images/whiteboard.jpg` | https://unsplash.com/photos/26MJGnCM0Wc | Kaleidico | https://unsplash.com/@kaleidico | `/how-it-works`, "Teaching with VaultLend"; `/credits` |

## Monark brand assets

From `lovable-migration/brand-refs/` and the [monark-community/website](https://github.com/monark-community/website) repo, used per `monark-brand-guidelines.md`:

| File | Source | Used for |
|-|-|-|
| `public/brand/monark-mark.svg`, `src/app/icon.svg` | brand-refs `logos/svg/standalone/logo-branded-standalone.svg` | Header brand, favicon, wallet prompt, connect gate, Open Graph image |
| `public/brand/monark-horizontal-{light,dark}.svg` | website `public/vectors/brand/horizontal/` | Footer Monark band |
| `public/brand/monark-vertical-{light,dark}.svg` | brand-refs `logos/svg/vertical/` | 404 page. Note: in the kit, the vertical `-light` file has white lettering (for dark backgrounds), so the 404 shows `-dark` on cream and `-light` on espresso. |
| `public/brand/monark-mesh.svg` | website `public/vectors/decorative/monark-mesh.svg` | Home hero only (once per site), cropped, low opacity |
| `public/brand/socials/*.svg` | website `public/vectors/socials/` | Footer social links (recoloured to `foreground` through a CSS mask for contrast) |

## Built in code

- **Health ruler / risk map** (`src/components/risk/health-ruler.tsx`): every vault as a dot on a health-factor axis with the liquidatable, at-risk and safe bands and the 1.00 liquidation line. Used in the home hero widget, the console, the pre-trade simulator, vault pages and the governance impact preview.
- **Anatomy of a liquidation** (`src/components/diagrams/anatomy.tsx`): four flat-orange line-art panels.
- **Liquidation receipt bar** (`src/components/diagrams/receipt-bar.tsx`): seized collateral split into "covers the debt" and "liquidator bonus".
- **Timelock timeline** (`src/components/diagrams/timelock.tsx`) and the **health-factor balance diagram** on `/how-it-works`.
- **Token glyphs**: monochrome rings with the token's letter (no brand logos for test tokens).
- **Open Graph image**: generated per locale with `next/og` (`src/app/[locale]/opengraph-image.tsx`).
- Icons: [Lucide](https://lucide.dev). Type: Nunito Sans via `next/font/google`.
