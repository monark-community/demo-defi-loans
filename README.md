# VaultLend by Monark

**Crash the price. Watch the vaults react.**

VaultLend is the protocol and risk view of the Monark DeFi demos: a lending-protocol risk console on testnet. Lock multi-asset collateral, borrow a stablecoin, then move oracle prices and watch every vault's health factor, alerts and liquidations react. Run liquidations yourself as a liquidator, and change risk parameters through a simulated governance timelock.

It's built for students and study groups learning DeFi lending, and for builders who want a realistic reference before writing their own vault and liquidation contracts.

- Project page: https://www.monark.io/en/project/defi-loans
- Siblings: [Fluidswap](https://fluidswap.monark.io/) (swaps and liquidity), [Yieldmine](https://yieldmine.monark.io/) (supplying for yield), [BorrowX](https://borrowx.monark.io/) (a guided first loan)

> Testnet demo · not financial advice · no real funds. Everything runs in your browser with simulated data.

## Run it locally

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

| Script | What it does |
|-|-|
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `pnpm typecheck` | Generates route types, then `tsc --noEmit` (strict) |
| `pnpm screenshots [filter]` | Playwright screenshots of every page and key flow into `docs/screenshots/` (needs `pnpm start -p 3135` running; `BASE_URL` overrides the address) |

No environment variables are required. `NEXT_PUBLIC_SITE_URL` optionally sets the canonical URL used in metadata, the sitemap and Open Graph (default `https://vaultlend.monark.io`).

## How the demo simulation works

There is no chain, wallet extension or backend. `src/lib/demo/` is a small typed layer that plays the protocol:

- **State** (`store.ts`): one external store (vaults, balances, oracle shocks, risk parameters, proposals, alerts, protocol clock) persisted to `localStorage` under `vaultlend-demo-v1`, with every access in `try/catch`. If storage is blocked the demo still works and says it will reset.
- **Maths** (`risk.ts`): health factor = Σ(collateral × liquidation threshold) ÷ debt, liquidation price per asset, borrow limit (max LTV), liquidation quotes (close factor 50%, per-asset bonus), daily-compounded interest, protocol stats.
- **Actions** (`ops.ts`): open vault, deposit, withdraw, borrow, repay, liquidate, move oracle prices, advance time, queue and execute proposals. Each action re-checks the protocol rules at execution time, so a liquidation can revert if prices recovered while it was pending.
- **Chain and wallet** (`chain.ts`, `wallet.ts`): every transaction goes through a wallet prompt (confirm or reject), then pending with a hash for 1.2–2.4 s (3–6 s with "Slow network"), then confirmed or failed. "Fail the next transaction" forces a network revert.
- **Alerts**: whenever a vault changes status band (safe ≥ 1.25, at risk 1.00–1.25, liquidatable < 1.00) an alert is recorded; alerts about your own vaults also toast on pages where they aren't already visible.
- **Seed** (`seed.ts`): twelve believable vaults (one of them yours, #1024 with 6 tETH), shared reference prices (tETH $3,200, tWBTC $64,000, tLINK $14.50, tUSDC and tDAI $1.00), two executed proposals and a past liquidation.

The **Demo controls** (the "Sepolia testnet" pill in the app bar) fast-forward the protocol clock (+1 or +30 days), slow the network, force a failure and **Reset demo**.

Swapping to a real protocol means replacing `src/lib/demo/` with wagmi/viem reads and writes behind the same functions; components only use its hooks and actions.

## Project structure

```
src/
  app/
    [locale]/               EN/FR routes (`/` redirects by Accept-Language in src/proxy.ts)
      page.tsx              Home
      how-it-works/         The maths behind every number
      app/                  Risk console: overview, open, vaults/[id], liquidations, parameters
      credits/              Photo credits
      pricing/              Internal review only: unlinked, noindex, not in the sitemap
      opengraph-image.tsx   Per-locale OG image
    sitemap.ts, robots.ts, icon.svg
  components/
    site/                   Standard Monark header (brand, Demo chip), footer, locale and theme switches
    demo/                   Console, open-vault simulator, vault view, liquidation panel, governance
    risk/                   Health ruler (risk map) and status chips
    diagrams/, home/        Line-art diagrams and the home-page stress widget
    ui/                     @monark/ui registry components (shadcn), restyled for the 2026 look
  i18n/                     Typed EN/FR dictionaries
  lib/demo/                 Simulated protocol, oracle, chain and wallet
docs/
  site-plan.md              Product brief, flows, copy and design decisions (kept in sync)
  assets.md                 Image sources and credits
  screenshots/              Playwright screenshots (390 px and 1440 px, light and dark, EN and FR)
```

Stack: Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind CSS 4, shadcn/ui on the [Monark UI registry](https://ui.monark.io), `lucide-react`, `next-themes`, `sonner`. Brand: Monark 2026 cream and espresso tokens, flat orange, Nunito Sans.

## Deploy to Vercel

Import the repository in Vercel and deploy with the framework defaults (Next.js, `pnpm install`, `pnpm build`). No `vercel.json` and no environment variables are needed; the Node version is pinned in `package.json` (`engines.node: 22.x`). Every route prerenders at build time except vault pages created in the browser, which render on demand.
