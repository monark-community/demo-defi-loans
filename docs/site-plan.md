# VaultLend by Monark: site plan

VaultLend is the **protocol and risk view** of the Monark DeFi demo family. Its siblings cover swapping (Fluidswap), supplying for yield (Yieldmine) and a guided single-loan borrower experience (BorrowX). VaultLend looks at the whole lending protocol at once: every vault's health, what happens when prices move, how liquidations work, and how risk parameters are set.

This plan was written before building and is kept in sync with what shipped (see section 12).

Sources: the Lovable app on `main` (`src/`), https://vaultlend.monark.io/, and the authoritative project page https://www.monark.io/en/project/defi-loans ("A lending platform where users deposit collateral and borrow tokens. Smart contracts manage interest, health ratios, and liquidations. Useful to simulate MakerDAO-style loans on testnet. Can include dashboards, alerts, and repayment logic. Emphasizes DeFi risk management and user experience." Its modules: web interface, wallet authentication, collateral vault contract, borrowing logic with a pre-trade simulation tool, interest accrual, liquidation engine and health monitoring, transaction history and vault analytics, multi-asset collateral and governance-based parameter adjustments).

---

## 1. Product brief

**Target users**

- **Students and study groups** learning DeFi lending in a Monark course, workshop or hackathon. They need to *see* overcollateralization, health factors and liquidations happen, not just read the formulas.
- **Power users and builders** (developers prototyping a lending protocol, ambassadors running a workshop) who want a realistic console to reason about protocol risk: which vaults break first, how much debt is at risk, what a parameter change does.

**Core job to be done:** "Show me how a collateralized lending protocol stays solvent, and let me break it safely so I understand why."

**Domain concepts** (each explained in plain language the first time it appears on the site)

| Concept | Meaning in VaultLend |
|-|-|
| Vault | One position: collateral locked by one owner, plus the debt borrowed against it (MakerDAO-style). |
| Collateral | Tokens locked to secure a loan. Multi-asset: tETH, tWBTC, tLINK. |
| Debt | Stablecoin borrowed against a vault: tUSDC or tDAI. It grows with interest. |
| Oracle price | The price the protocol uses to value collateral. In the demo you can move it. |
| Max LTV | Loan-to-value limit: the most you can borrow per dollar of collateral (tETH 75%, tWBTC 70%, tLINK 60%). |
| Liquidation threshold | The collateral share that counts when checking solvency (tETH 83%, tWBTC 78%, tLINK 70%). Always above max LTV, which creates a safety buffer. |
| Health factor (HF) | Σ(collateral value × liquidation threshold) ÷ debt. Above 1.00 the vault is solvent; below 1.00 anyone can liquidate it. |
| Liquidation price | The oracle price of one collateral asset at which HF reaches 1.00, other assets unchanged. |
| Liquidation bonus | The discount a liquidator receives on seized collateral (tETH 5%, tWBTC 6.5%, tLINK 10%). |
| Close factor | The share of a vault's debt a liquidator can repay in one go (50%). |
| Borrow APR | Interest rate on debt, compounded daily (tUSDC 5.40%, tDAI 4.85%). |
| Risk parameters and timelock | Governance changes the parameters through proposals that wait 48 hours before they can be executed. |

**Status bands** (family convention: colour plus text label, always):

- **Safe** (green): HF ≥ 1.25
- **At risk** (amber): 1.00 ≤ HF < 1.25
- **Liquidatable** (red): HF < 1.00

**What the Lovable version got wrong or left out**

- It was a borrower's form (supply and borrow) with a decorative dashboard: the same job as BorrowX, so the family overlapped.
- Nothing moved: prices were fixed, so the health factor never changed and liquidations were only described ("Instant Liquidation" card), never shown.
- The health-factor maths was wrong (it divided max borrow by debt, ignoring the liquidation threshold), and there was no liquidation price, close factor or bonus.
- No liquidator side, no alerts, no interest accrual over time, no governance parameters, no multi-asset vaults, although the project page lists all of them.
- The Repay and Add collateral buttons did nothing; there were no pending, confirmed or failed transaction states.
- Real mainnet names (ETH, BTC, USDT), stale prices, purple-blue gradients and glass cards; no French, no disclaimers, no accessibility work.

## 2. Value proposition

**For students and builders learning DeFi lending, VaultLend turns a whole lending protocol into a live risk console you can stress-test: move prices, watch every vault's health react and run the liquidations yourself, on testnet, instead of learning from static diagrams or with real money.**

Supporting benefits (outcomes):

1. **Know exactly how far a price can fall before a position breaks.** Every vault shows its health factor and a liquidation price per collateral asset, before and after each action.
2. **Understand liquidations from both sides.** Push a vault under 1.00, then repay its debt as a liquidator and see the collateral and bonus you receive.
3. **See a rule change ripple through the protocol before it ships.** Preview how a new liquidation threshold or rate would move every vault, then queue it through a timelock.

## 3. Hero

- **Headline (EN):** Crash the price. Watch the vaults react.
- **Headline (FR):** Faites chuter le prix. Regardez les coffres réagir.
- **Subheadline (EN):** VaultLend is Monark's open lending sandbox on testnet. Lock collateral, borrow, then stress-test every vault on the protocol to see exactly when, why and how liquidations happen.
- **Subheadline (FR):** VaultLend est le bac à sable de prêt ouvert de Monark, sur testnet. Déposez une garantie, empruntez, puis mettez chaque coffre du protocole sous pression pour voir quand, pourquoi et comment surviennent les liquidations.
- **Primary CTA:** "Open the risk console" / « Ouvrir la console de risque » → `/[locale]/app`.
- **Secondary CTA:** "How liquidations work" / « Comprendre les liquidations » → `/[locale]/how-it-works`.
- **Hero visual:** the product itself, built in code: a live **mini risk map** (a horizontal health-factor ruler with nine vault dots) and a tETH price slider with a "−25% flash crash" chip. Dragging the slider slides the dots left across the amber band and the 1.00 liquidation line, and a counter shows how many vaults become liquidatable. It proves the headline in one gesture, which no photo can do. The mesh butterfly sits large and cropped behind it (see §8).

## 4. Page map

All routes live under `/en/…` and `/fr/…`; `/` redirects to the preferred language.

| Route | Purpose | Sections (in order) |
|-|-|-|
| `/` (home) | Explain the product in one screen and send people to the console | Hero with live mini risk map → Three outcomes → Anatomy of a liquidation (4-step line-art diagram) → Inside the console (four product vignettes, each linking into the app) → Learn it together (photo + audiences) → FAQ → Closing CTA |
| `/how-it-works` | The mechanics reference for students: the formulas behind every number in the console | Intro → Health factor (formula + worked example) → Liquidation price → Interest over time → Liquidations (close factor, bonus, worked receipt) → Risk parameters table → Governance and timelock → Glossary → CTA. **Justified** because the audience is explicitly students learning the mechanics (project page), and putting the formulas on the home page would bury the product. |
| `/app` | Risk console (dashboard) | App bar (network, disclaimer, protocol clock, demo controls) → app sub-nav → protocol stats → risk map → oracle stress test + alerts → vault table with filters |
| `/app/open` | Open a vault with the pre-trade simulator | Collateral inputs (multi-asset) → debt asset and amount → live preview (HF, liquidation prices, borrow capacity) → submit |
| `/app/vaults/[id]` | One vault: health, history, actions | Header with status → health gauge → collateral table with liquidation prices → debt and interest → actions (yours: deposit, withdraw, borrow, repay; others: liquidate when HF < 1) → history |
| `/app/liquidations` | The liquidator's desk | Liquidatable vaults with max repay and bonus → near-liquidation watchlist → recent liquidations |
| `/app/parameters` | Risk parameters and governance simulation | Current parameters table → propose a change with impact preview → proposals (queued, executable, executed) |
| `/credits` | Photo credits and brand asset sources | Photos with photographer links → built-in-code note |
| `/pricing` | **Internal strategy review only**: never linked, noindex, not in sitemap | Plan, costs, partners, reasoning |
| 404 | Localized not-found | Vertical Monark logo, message, home and console links |

**Header:** "VaultLend by Monark" pairing · links: Overview, How it works, Risk console · EN/FR switch · theme toggle · primary pill "Open the console" (inside the app it becomes the `connect-wallet` control) · "Demo · simulated data" badge inside the app.

**Footer:** standard three bands. Product band: one-line description + Overview, How it works, Risk console, Credits. A "Part of the Monark DeFi demos" row linking Fluidswap, Yieldmine and BorrowX (`*.monark.io`). Monark band: horizontal logo, tagline, project page, GitHub repo, socials. Legal line: © year Monark · Open source, "Demo · simulated data", testnet disclaimer, photo credits link.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proving flow |
|-|-|-|-|
| **Risk map** (health ruler of every vault) | See the whole protocol's solvency at a glance and which vaults break first | Home hero (mini), `/app` | Flow 3 |
| **Oracle stress test** | Learn cause and effect: a price move becomes health-factor moves, alerts and liquidations | Home hero, `/app` | Flow 3 |
| **Pre-trade simulator** | Know your health factor and liquidation price *before* signing anything | `/app/open`, vault actions | Flows 2 and 3 |
| **Liquidation desk** | Understand liquidations from the liquidator's side: repay, seize, earn the bonus | Home "Anatomy of a liquidation", `/app/liquidations`, vault page | Flow 4 |
| **Alerts and interest over time** | Notice risk building up (prices or interest) before it's too late | `/app` alerts panel, toasts, demo clock | Flows 3 and 5 |
| **Governance sandbox** | See how one parameter change moves every vault, and why timelocks exist | `/app/parameters` | Flow 5 |

## 6. Key flows

Every transaction follows the same simulated lifecycle: wallet prompt (confirm or reject) → **pending** with a transaction hash for a realistic 1.2–2.4 s (3–6 s with "Slow network") → **confirmed**, or **failed** (rejected in wallet, or reverted by the network with "Fail the next transaction", or reverted by a protocol rule checked at execution time). A failed transaction changes nothing and offers "Try again".

1. **Connect the demo wallet.** Open `/app` → gate explains what you can do → "Connect demo wallet" → wallet prompt shows a sign-in message (no fee) → confirm → console loads with your seeded vault #1024. *Failed:* reject → "You declined the sign-in request. Nothing was shared." with retry.
2. **Open a multi-asset vault with the simulator.** "Open a vault" → enter 2 tETH and 300 tLINK as collateral → pick tDAI and 4,000 → preview updates live (HF, liquidation price per asset, borrow capacity used) → "Open vault" → prompt lists collateral and debt → pending → confirmed → redirected to the new vault. *Blocked states:* more than your balance, or debt above max LTV ("This would borrow above the max LTV. Add collateral or borrow less."). *Failed:* reverted → "The network reverted the transaction. Your tokens were not moved."
3. **Stress test, get alerted, rescue your vault.** On `/app`, apply "tETH −25%" → dots slide left, stats update, alerts appear in the live alerts panel ("Vault #1024 is at risk", marked "Your vault"; on other pages the same alert also arrives as a toast) → open vault #1024 → Repay 3,000 tUSDC (preview shows HF back to safe) → confirm → pending → confirmed, alert "recovered". *Failed:* reject or revert; the vault stays at risk.
4. **Liquidate a vault.** `/app/liquidations` lists #1028 (HF 0.97) → "Liquidate" → choose repay amount (max 50% of debt) and collateral to seize → receipt preview: repaid, seized, bonus, HF after → confirm → pending → confirmed, a receipt animates the seized collateral into "covers the debt" and "your bonus". *Failed:* if prices recovered meanwhile, execution reverts with "Vault is healthy again (HF ≥ 1.00), so it can no longer be liquidated." *Empty state:* "Nothing to liquidate right now" with a link to the stress test.
5. **Change a risk parameter through governance.** `/app/parameters` → "Propose a change" → tETH liquidation threshold 83% → 78% → impact preview highlights vaults that would change status (at reference prices, #1034 drops from 1.30 to 1.22 and becomes at risk) → "Queue proposal" → pending → confirmed, proposal queued with a 48 h timelock → "Fast-forward 48 h" (demo clock: interest accrues on every vault) → "Execute" → pending → confirmed, parameters and all vaults update, alerts fire. *Blocked:* threshold not above max LTV. *Failed:* executing before the timelock ends is impossible (button disabled with the remaining time); a revert leaves the proposal queued.

## 7. Content (EN / FR)

The full copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts`; this is the draft it was built from. Voice: Monark's (open, practical, optimistic, never hype); Web3 terms explained the first time; French written natively (coffre, garantie, facteur de santé, liquidation, dette).

### Home

| Section | EN | FR |
|-|-|-|
| Eyebrow | Lending protocol sandbox · testnet | Bac à sable de protocole de prêt · testnet |
| Headline | Crash the price. Watch the vaults react. | Faites chuter le prix. Regardez les coffres réagir. |
| Sub | (see §3) | (see §3) |
| CTAs | Open the risk console · How liquidations work | Ouvrir la console de risque · Comprendre les liquidations |
| Hero widget | tETH oracle price · Flash crash −25% · Reset · "{n} of 9 vaults liquidatable" | Prix oracle du tETH · Krach éclair −25 % · Réinitialiser · « {n} coffres sur 9 liquidables » |
| Outcomes title | What you'll understand in ten minutes | Ce que vous aurez compris en dix minutes |
| Outcome 1 | **How far a price can fall.** Every vault shows its health factor and a liquidation price per asset, before and after each action. | **Jusqu'où un prix peut tomber.** Chaque coffre affiche son facteur de santé et un prix de liquidation par actif, avant et après chaque action. |
| Outcome 2 | **Liquidations from both sides.** Push a vault under 1.00, then repay its debt as a liquidator and collect the bonus. | **La liquidation des deux côtés.** Faites passer un coffre sous 1,00, puis remboursez sa dette en tant que liquidateur et encaissez le bonus. |
| Outcome 3 | **What a rule change really does.** Preview a new threshold on every vault, then queue it behind a timelock. | **L'effet réel d'une règle.** Prévisualisez un nouveau seuil sur tous les coffres, puis soumettez-le à un délai de grâce. |
| Anatomy title | Anatomy of a liquidation | Anatomie d'une liquidation |
| Steps | 1 The price falls: the oracle marks the collateral down. 2 Health drops below 1.00: the collateral no longer covers the debt with its safety margin. 3 A liquidator repays: up to half of the debt, in the debt token. 4 Collateral changes hands: the liquidator receives the same value in collateral plus a bonus, and the vault is healthier. | 1 Le prix baisse : l'oracle revoit la garantie à la baisse. 2 La santé passe sous 1,00 : la garantie ne couvre plus la dette avec sa marge de sécurité. 3 Un liquidateur rembourse : jusqu'à la moitié de la dette, dans le jeton emprunté. 4 La garantie change de mains : le liquidateur reçoit la même valeur en garantie, plus un bonus, et le coffre se rétablit. |
| Console title | Inside the risk console | Dans la console de risque |
| Vignettes | Risk map · Pre-trade simulator · Liquidation desk · Governance sandbox (one line each, see dictionaries) | Carte des risques · Simulateur avant transaction · Bureau des liquidations · Bac à sable de gouvernance |
| Together title | Built for study groups and workshops | Pensé pour les groupes d'étude et les ateliers |
| Together body | Run it on a projector, give every student a vault, then crash tETH together and discuss who got liquidated and why. Everything resets in one click. | Projetez-la en classe, donnez un coffre à chaque étudiant, puis faites chuter le tETH ensemble et discutez de qui a été liquidé, et pourquoi. Tout se réinitialise en un clic. |
| FAQ | 5 entries: Is any of this real money? · How is the health factor calculated? · Why would anyone liquidate a vault? · How is VaultLend different from BorrowX? · Can I build on it? | 5 entrées équivalentes |
| Closing CTA | Break a protocol before lunch. · Open the risk console | Faites tomber un protocole avant midi. · Ouvrir la console de risque |

### App: key strings (full set in dictionaries)

| Key | EN | FR |
|-|-|-|
| Console title | Risk console | Console de risque |
| Stats | Total collateral · Total debt · Debt at risk · Liquidatable vaults | Garanties totales · Dette totale · Dette à risque · Coffres liquidables |
| Stress test | Oracle stress test · Move a price and watch every vault respond. · Flash crash tETH −25% · Broad sell-off −15% · Reset prices | Test de résistance des oracles · Faites bouger un prix et observez la réaction de chaque coffre. · Krach éclair tETH −25 % · Repli général −15 % · Réinitialiser les prix |
| Alerts empty | All quiet. No vault has changed status yet. | Tout est calme. Aucun coffre n'a changé de statut pour l'instant. |
| Liquidations empty | Nothing to liquidate right now. Every vault is above 1.00. Try a price shock in the stress test. | Rien à liquider pour le moment. Tous les coffres sont au-dessus de 1,00. Essayez un choc de prix dans le test de résistance. |
| Vault table empty (filter) | No vault matches this filter. | Aucun coffre ne correspond à ce filtre. |
| Tx pending / confirmed / failed | Waiting for the network… / Confirmed / Transaction failed | En attente du réseau… / Confirmée / Échec de la transaction |
| Rejected | You rejected the request in your wallet. Nothing was sent. | Vous avez refusé la demande dans votre portefeuille. Rien n'a été envoyé. |
| Reverted | The network reverted the transaction. Your tokens were not moved. | Le réseau a annulé la transaction. Vos jetons n'ont pas bougé. |
| Not liquidatable | Vault is healthy again (HF ≥ 1.00), so it can no longer be liquidated. | Le coffre est redevenu sain (FS ≥ 1,00) : il ne peut plus être liquidé. |
| Vault not found | We can't find this vault. It may have been created in another browser, or the demo was reset. | Nous ne trouvons pas ce coffre. Il a peut-être été créé dans un autre navigateur, ou la démo a été réinitialisée. |
| Storage error | Your browser is blocking local storage, so the demo will reset when you leave. | Votre navigateur bloque le stockage local : la démo sera réinitialisée à votre départ. |
| Disclaimer | Testnet demo · not financial advice · no real funds | Démo sur testnet · pas un conseil financier · aucun fonds réel |

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by `monark-brand-guidelines.md` (cream and espresso tokens pasted from §3, flat orange, Nunito Sans, pills, borders not shadows). What this site decides:

- **Layouts and rhythm.** Home: a two-column hero (copy left, live risk widget right, stacked on mobile), then alternating dense and airy bands: outcomes (three columns), a full-width diagram band, a 2×2 grid of product vignettes, a photo band, FAQ, a short closing CTA. The console is a dense, instrument-like layout on a 6xl grid: stat tiles, the full-width risk map, then a two-column stress test and alerts, then the vault table. Monospace only for addresses and hashes; numbers use tabular figures.
- **Hero visual:** the live mini risk map (see §3), in a card with the ruler's three bands tinted very lightly in the status colours, plus labels.
- **Monark illustrations:** the mesh butterfly **once**, on the home hero, large, cropped at the top right at low opacity behind the widget, with no gradient. The branded section divider (orange line with end circles) once on the home page and once on `/how-it-works`.
- **New line-art diagrams** (flat orange 2px strokes, rounded caps, drawn in JSX): "Anatomy of a liquidation" four-step strip; health-factor balance diagram (collateral × threshold vs debt) on `/how-it-works`; the liquidation receipt bar (debt covered vs bonus); the timelock timeline.
- **Photography direction:** warm, natural-light study scenes: one study group laughing around laptops in a library (home), one whiteboard session (how it works). No crypto clichés; photos always sit next to copy.
- **Butterfly:** yes, on the home hero only, as above. No gradients anywhere except inside the logo.
- **Signature moments:**
  1. **The price drop:** move the tETH slider and every vault dot glides along the health ruler (250 ms ease-out), crossing into amber and red, while the counters settle. Reduced motion jumps straight to the result.
  2. **The liquidation receipt:** after a liquidation, a bar splits the seized collateral into "covers the debt" and "your bonus", with the vault's health factor jumping from red back to green.
  3. **The governance ripple:** while you edit a parameter, the vaults it would move light up on a mini ruler (ghost dot → new position) before you queue anything.

## 9. Assets

| Image | Purpose and placement |
|-|-|
| `public/images/study-group.jpg` (Priscilla Du Preez, Unsplash) | Home "Built for study groups and workshops" band |
| `public/images/whiteboard.jpg` (Kaleidico, Unsplash) | `/how-it-works` "Teach it" closing band |
| `public/brand/*` | Monark mark (pairing, favicon, wallet prompt), horizontal logos (footer), vertical logos (404), mesh butterfly (home hero), socials (footer) |
| Open Graph image | Generated per locale with `next/og`: pairing, headline, a ruler with dots |

Icons: Lucide (Gauge, ShieldCheck, TriangleAlert, Siren, Landmark, Clock, Gavel, Wallet…). Diagrams built in code: risk map, health gauge, anatomy strip, balance diagram, receipt bar, timelock timeline. Credits in `docs/assets.md` and on `/credits`.

## 10. Pricing strategy

**Free, part of the Monark bundle.** VaultLend is an educational reference implementation on testnet; charging learners would work against Monark's education mission, and it moves no real funds, so there is no fee to take. The sustainable path is **partners**: universities and student associations that run Monark DeFi workshops get facilitation kits, custom scenarios (for example a preset "March 2020 crash" exercise) and support as part of a Monark partnership, not a per-seat price. The `/pricing` page shows "Free, part of Monark" with this reasoning; it exists for internal review only, is never linked, is excluded from the sitemap and is `noindex, nofollow`. No price is mentioned anywhere else.

## 11. Out of scope

- No real chain, wallet signing, oracle or backend: prices, wallets and transactions are simulated in the browser, and state lives in `localStorage`.
- No supply side or interest earned (that's Yieldmine), no swaps (Fluidswap), no guided single-loan onboarding (BorrowX).
- No liquidation bots or competition between liquidators; time only advances when you fast-forward the demo clock.
- No token voting on proposals: governance is simulated as "queue → timelock → execute" to teach parameter risk, not voting (the Monark governance module covers voting).
- No flash loans, partial-collateral auctions, stability pools or debt ceilings.

## 12. Implementation notes (as shipped)

Decisions taken while building, unattended:

- **Routes shipped** exactly as in §4: `/`, `/how-it-works`, `/app`, `/app/open`, `/app/vaults/[id]`, `/app/liquidations`, `/app/parameters`, `/credits`, `/pricing` (unlinked, noindex, not in the sitemap) and a localized 404. Seeded vault pages prerender; vaults opened in the browser render on demand.
- **Amounts** are plain numbers in whole tokens inside `src/lib/demo/` (the demo never needs more than 6–8 decimals) and are converted to base units only for `<TokenAmount>`. A real integration would switch to bigint base units in the same module.
- **Health ruler scale** is piecewise-linear (0.70–1.00 → 18%, 1.00–1.25 → 36%, 1.25–2.00 → 75%, 2.00–3.00+ → 100%) so the interesting range gets the room. Below `md` the ruler recomputes its lanes for a phone-width track instead of scrolling sideways.
- **Toast placement.** Toasts sit top-right under the header (full-width under the header on phones). To never cover what they report on: transaction confirmations stay inline next to the button that sent them (no toast); the liquidation receipt appears at the top of the vault's left column; opening a vault redirects to the new vault; alert toasts about your own vaults are skipped on the console (the alerts panel is live) and on that vault's own page. Toasts remain for alerts on other pages, clock fast-forward and "Reset demo".
- **Status colours**: safe `--success`, at risk `--warning`, liquidatable `--danger` (= `destructive`), always with an icon and a text label.
- **Liquidation is only offered on other people's vaults**; your own liquidatable vault shows a warning instead.
- **Registry components**: button, dialog, sheet, tabs, dropdown, input, label, switch, accordion, tooltip, sonner, wallet, connect-wallet, token-amount, network-badge and tx-status come from `@monark/ui`, restyled to the 2026 pill look (and with localizable labels); the slider was re-themed; select was not needed (pill toggles instead).
- **Brand kit note**: the vertical logo files are named for the background they are *not* meant for (`-light` has white lettering), so the 404 swaps them.
- **Dependencies beyond the brief's list**: `radix-ui` and `class-variance-authority` (registry primitives), `next-themes` (theme toggle), `sonner` (toasts), `react-jazzicon` (wallet avatars from the registry `wallet` component), `tw-animate-css` and `shadcn` (registry theme CSS). No charting library was needed: the risk map is plain HTML/CSS.
