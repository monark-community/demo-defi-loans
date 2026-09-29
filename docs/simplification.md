# Simplification pass

Owner feedback on the rebuilt demo sites: *"Simplify, reduce text quantity, revise flows so that context is only given when necessary. Two top bars on homepage is too busy; demo banners only on demo/app pages."* This pass follows the TrustRate pilot (`address-review-system/docs/simplification.md` §4) and the binding rules in `monark-brand-guidelines.md` (§8 "Restraint", §10, §11). VaultLend was also brought to the current standard header and footer (§2, §10).

How the numbers are measured (both scripts are in `scripts/`, run against `pnpm start -p 3135`):

- `node scripts/wordcount.mjs`: words per page, English, at 1440px. *Visible* is the `innerText` of `<main>`; *total* also counts closed disclosures, FAQ answers and paged rows; *chrome* is everything outside `<main>` (header, app bar, footer). App pages include seeded data (vault numbers, amounts, addresses).
- `node scripts/dictcount.mjs`: words of UI copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main (incl. collapsed) | Chrome |
|-|-:|-:|-:|
| Home | 576 | 600 | 95 |
| How it works | 654 | 654 | 95 |
| Credits | 90 | 90 | 95 |
| 404 | 32 | 32 | 95 |
| App: connect gate | 71 | 71 | 97 |
| App: console | 383 | 547 | 100 |
| App: open a vault | 148 | 148 | 100 |
| App: your vault #1024 | 191 | 193 | 100 |
| App: other vault #1028 | 235 | 237 | 100 |
| App: liquidations | 131 | 131 | 100 |
| App: parameters | 176 | 183 | 100 |
| **Total** | **2,687** | **2,886** | **1,077** |

Dictionary copy: **EN 3,339 words** (meta 169 · common 173 · home 705 · how 621 · credits 77 · pricing 170 · app 1,420); **FR 3,969 words**.

What was loaded:

- **Shell:** "VaultLend · by Monark" pairing in the header, a dashed "Demo · simulated data" badge only inside the app, no Demo chip; links pushed right. Footer legal band repeated the testnet line on every page.
- **Home:** eyebrow + 30-word subline + testnet line in the hero; six sections (outcomes with an intro paragraph, anatomy with eyebrow, console vignettes with eyebrow, "together" with eyebrow and a 35-word body, a 5-question FAQ including a health-factor formula, closing with a body line). Outcomes restated the vignettes.
- **How it works:** eyebrow, 35-word intro, every formula followed by a visible worked example, a long note and a receipt table; 30–45-word section bodies; 15–20-word glossary definitions; teach band with a body paragraph.
- **App:** two bars (a strip with network, clock, testnet notice and demo controls, then the section nav); the testnet notice on every form (open, vault actions, liquidate, propose) as well as the wallet prompt; intro paragraphs on every page; card descriptions under every panel title; a 12-row vault table; permanent hints (collateral, fast-forward); a pending line repeated by the pending pill; the failed state repeated by a failed pill.

## 2. What changed

No feature or flow was removed.

### Shell (header and footer standard)
- **Brand:** butterfly mark 28px + "VaultLend" in Nunito Sans 800 18px on one line (`site/brand.tsx`); no "by Monark". Accessible label "VaultLend, by Monark: home". `pairing.tsx` and `app-demo-badge.tsx` removed.
- **Header:** links left after the brand; right side Demo chip (`site/demo-chip.tsx`, primary 8% light / 15% dark, primary-ink) → EN/FR pill → 36px theme toggle → "Open the console" (the wallet control inside the app). Below `lg`: brand + menu button only; the sheet holds links, Demo chip, EN/FR, theme and the action. Components mirror Splitflow's `src/components/site/`.
- **Footer:** Monark band opens with "VaultLend is built by Monark" / « VaultLend est conçu par Monark ». Legal band keeps "Demo · simulated data" only (testnet line removed). Product line 15 → 10 words. The DeFi family row stays (Fluidswap, Yieldmine, BorrowX) with one-word notes.
- **Marketing pages:** exactly one top bar.

### Home (hero + 6 sections → hero + 5)
- Hero: removed the eyebrow and the testnet line; subline 29 → 16 words; the live stress widget lost its hint line.
- **Removed "What you'll understand in ten minutes"** (intro paragraph + 3 outcomes): it restated the four console vignettes.
- Anatomy: no eyebrow; step lines 15–20 → 7–10 words.
- Console vignettes: no eyebrow; lines 15–20 → 9–12 words; each keeps its live fragment.
- "Built for study groups": no eyebrow, no body; audience lines 12–15 → 6–8 words.
- FAQ: 5 → 4 questions, answers 30–40 → 12–16 words. "How is the health factor calculated?" moved out: it is the first section of `/how-it-works`.
- Closing: heading + button.

### How it works (mechanics on demand)
- No eyebrow; intro 35 → 9 words.
- Each block: one-line body + the formula. **Every worked example sits behind a "Show the worked example" disclosure** (health factor with the balance diagram, liquidation price with the "Not reachable" note, interest); the liquidation receipt and its note sit behind "Show a worked receipt". New shared `src/components/ui/disclosure.tsx`.
- Rules, table notes and governance cut to one line each; glossary definitions to 5–8 words; teach band = heading + button.

### App (`/app/...`)
- **One bar instead of two:** section nav + one pill ("● Sepolia testnet" + sliders icon, icon-only on phones) that opens Demo controls, + "Open a vault" (hidden on phones; the console keeps its own button). The protocol clock lives in Demo controls.
- **Testnet notice once per transaction:** only in the wallet prompt; removed from the app strip, open-vault form, vault actions, liquidate panel and proposal form.
- Connect gate: removed the three feature bullets; body 25 → 8 words.
- Console: removed the intro; risk-map description → info icon (`ui/info-tip.tsx`, copied from the pilot); stress-test and alerts descriptions removed; alerts show 5 (was 7); the vault table shows the 6 riskiest vaults with "Show all 12 vaults".
- Open a vault: removed the intro; collateral hint → info icon; preview gets a "How is this calculated?" info icon linking to `/how-it-works`; suggested-max line shortened.
- Your vault: the left health panel is gone on your own vault (the actions panel already shows current → after health, ruler and liquidation prices); on phones the actions come first. Debt facts 6 → 3 (LTV and health factor were repeated). History rows lost the transaction hash (it is the row's tooltip).
- Someone else's vault: two sentences → one line + the stress-test button.
- Liquidate panel and liquidations page: explanations → info icons; watchlist description folded into its title "At risk (1.00 to 1.25)"; empty state = one line + "Open the stress test".
- Parameters: intro → info icon; impact note and close-factor line shortened; the fast-forward hint became the button's tooltip.
- **One message, once:** the pending line no longer repeats the pending pill; a failed transaction shows the reason once (no extra failed pill); confirmations and the "Clock moved forward" / "Demo reset" toasts are short.
- Errors shortened to one line (reverted, rejected, not liquidatable, unsafe, timelock); Demo controls hints ≤ 6 words.

French was rewritten to the same brevity; the FR app nav uses "Aperçu" so the three sections fit at 390px. Unused keys (outcomes, eyebrows, intros, clock, balances, hf, hfShort, open.done, healthyOther, watchDesc…) were removed from both dictionaries.

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 576 | 298 | −48% | 600 | 322 | 95 | 77 |
| How it works | 654 | 301 | −54% | 654 | 411 | 95 | 77 |
| Credits | 90 | 80 | −11% | 90 | 80 | 95 | 77 |
| 404 | 32 | 22 | −31% | 32 | 22 | 95 | 77 |
| App: connect gate | 71 | 18 | −75% | 71 | 18 | 97 | 76 |
| App: console | 383 | 236 | −38% | 547 | 329 | 100 | 79 |
| App: open a vault | 148 | 78 | −47% | 148 | 78 | 100 | 79 |
| App: your vault #1024 | 191 | 127 | −34% | 193 | 128 | 100 | 79 |
| App: other vault #1028 | 235 | 176 | −25% | 237 | 178 | 100 | 79 |
| App: liquidations | 131 | 77 | −41% | 131 | 77 | 100 | 79 |
| App: parameters | 176 | 113 | −36% | 183 | 120 | 100 | 79 |
| **Total** | **2,687** | **1,526** | **−43%** | **2,886** | **1,763** | **1,077** | **858** |

Marketing pages alone (home, how it works, credits, 404): 1,352 → 701 visible words (−48%).

Dictionary copy: **EN 3,339 → 2,374 (−29%)**, FR 3,969 → 2,806 (−29%). Per section (EN): meta 169 → 161 · common 173 → 152 · home 705 → 318 · how 621 → 370 · credits 77 → 67 · app 1,420 → 1,132 · pricing 170 (internal, unlinked page, left as is).

### Screenshots
- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-flow2-03-open-filled.png`.
- After: `docs/screenshots/en-1440-light-page-home.png`, `docs/screenshots/en-1440-light-flow2-03-open-filled.png` and the full set in `docs/screenshots/` (EN 390/1440 light/dark, FR 390/1440 light). File names are unchanged.
