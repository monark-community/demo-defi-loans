// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3134   (in another terminal)
//        pnpm screenshots [filter]         (BASE_URL defaults to http://localhost:3134)
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3134"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.argv[2] ?? process.env.ONLY // optional filter on the variant tag, e.g. "en-390"
const KEY = "vaultlend-demo-v1"

const sizes = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
// French: home page and one key flow, both widths, light.
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const L = {
  en: { connect: "Connect demo wallet", confirm: "Confirm", reject: "Reject", console: "Risk console", crash: "Flash crash tETH −25%", repay: "Repay tUSDC", amount: "Amount" },
  fr: { connect: "Connecter le portefeuille de démo", confirm: "Confirmer", reject: "Refuser", console: "Console de risque", crash: "Krach éclair tETH −25 %", repay: "Rembourser en tUSDC", amount: "Montant" },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: sizes[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "no-preference",
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  page.on("pageerror", (e) => console.error("  page error:", e.message))
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`, fullPage })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`, overflow > 0 ? `(horizontal overflow ${overflow}px!)` : "")
}

const go = (page, v, path) => page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
const dialog = (page) => page.getByRole("dialog")
const confirm = async (page, v) => {
  await dialog(page).waitFor()
  await dialog(page).getByRole("button", { name: L[v.locale].confirm, exact: true }).click()
}

async function connect(page, v, capture) {
  await go(page, v, "/app")
  const btn = page.getByRole("main").getByRole("button", { name: L[v.locale].connect })
  await btn.waitFor()
  if (capture) await shot(page, v, "flow1-01-gate", true)
  await btn.click()
  await dialog(page).waitFor()
  if (capture) await shot(page, v, "flow1-02-sign-in-prompt")
  await confirm(page, v)
  await page.getByRole("heading", { level: 1, name: L[v.locale].console, exact: true }).waitFor({ timeout: 10000 })
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await go(page, v, path)
    await page.waitForTimeout(400)
    await shot(page, v, `page-${name}`, true)
  }
  // Signature moment 1 on the home page: the flash crash.
  await go(page, v, "")
  await page.getByRole("button", { name: "Flash crash −25%" }).click()
  await page.waitForTimeout(500)
  await page.getByRole("figure").scrollIntoViewIfNeeded()
  await shot(page, v, "page-home-crash")
  if (v.w < 768) {
    await page.getByRole("button", { name: "Open menu" }).click()
    await dialog(page).waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function appFlows(page, v) {
  // Flow 1: connect, then the rejected case
  await connect(page, v, true)
  await shot(page, v, "app-01-console", true)
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key))
    s.wallet.status = "disconnected"
    localStorage.setItem(key, JSON.stringify(s))
  }, KEY)
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await dialog(page).getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request").waitFor()
  await shot(page, v, "flow1-03-rejected")
  await page.getByRole("main").getByRole("button", { name: "Connect demo wallet" }).click()
  await confirm(page, v)
  await page.getByRole("heading", { level: 1, name: "Risk console", exact: true }).waitFor({ timeout: 10000 })

  // Flow 2: open a vault with the simulator (blank, errors, filled, failed, retried)
  await go(page, v, "/app/open")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow2-01-open-blank", true)
  await page.getByLabel("tETH amount").fill("9")
  await page.getByLabel("Amount to borrow").fill("50000")
  await page.getByRole("button", { name: "Open vault" }).click()
  await shot(page, v, "flow2-02-open-errors", true)
  await page.getByLabel("tETH amount").fill("2")
  await page.getByLabel("tLINK amount").fill("300")
  await page.getByLabel("Amount to borrow").fill("4000")
  await page.getByRole("button", { name: "tDAI" }).click()
  await shot(page, v, "flow2-03-open-filled", true)
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByLabel("Fail the next transaction").click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Open vault" }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-04-prompt")
  await confirm(page, v)
  await page.getByText("Waiting for the network…").first().waitFor()
  await page.getByRole("button", { name: "Open vault" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-05-pending")
  await page.getByText("The network reverted the transaction").waitFor({ timeout: 10000 })
  await shot(page, v, "flow2-06-failed")
  await page.getByRole("button", { name: "Try again" }).click()
  await confirm(page, v)
  await page.waitForURL(/\/app\/vaults\/v1036/, { timeout: 15000 })
  await page.getByRole("heading", { level: 1, name: "Vault #1036" }).waitFor()
  await shot(page, v, "flow2-07-opened", true)

  // Flow 4: liquidate #1028 at reference prices, then the empty queue
  await go(page, v, "/app/liquidations")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow4-01-queue", true)
  await go(page, v, "/app/vaults/v1028")
  await page.getByLabel("Repay (tUSDC)").fill("6600")
  await page.getByRole("button", { name: "tLINK · +10.0%" }).click()
  await shot(page, v, "flow4-02-liquidate-form", true)
  await page.getByRole("button", { name: "Liquidate vault #1028" }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow4-03-prompt")
  await confirm(page, v)
  await page.getByText("Liquidation receipt").first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow4-04-receipt")
  await go(page, v, "/app/liquidations")
  await page.getByText("Nothing to liquidate right now.").waitFor()
  await shot(page, v, "flow4-05-empty", true)

  // Flow 3: stress test, then rescue your vault
  await go(page, v, "/app")
  await page.getByRole("button", { name: L.en.crash }).click()
  await page.waitForTimeout(600)
  await page.locator("#risk-map").scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-01-crash-map")
  await shot(page, v, "flow3-02-crash-console", true)
  await go(page, v, "/app/vaults/v1024")
  await page.getByLabel("Amount", { exact: true }).fill("3000")
  await shot(page, v, "flow3-03-repay-preview", true)
  await page.getByRole("button", { name: "Repay tUSDC" }).click()
  await confirm(page, v)
  await page.getByText("Waiting for the network…").first().waitFor()
  await shot(page, v, "flow3-04-repay-pending")
  await page.getByText(/Repaid 3,000 tUSDC on vault #1024/).first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(400)
  await shot(page, v, "flow3-05-repaid")

  // Flow 5: governance: preview, queue, fast-forward, execute
  await go(page, v, "/app/parameters")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.getByLabel("New value (%)").fill("78")
  await page.waitForTimeout(400)
  await shot(page, v, "flow5-01-impact-preview", true)
  await page.getByRole("button", { name: "Queue proposal" }).click()
  await confirm(page, v)
  await page.getByText("Queued", { exact: true }).first().waitFor({ timeout: 10000 })
  await page.getByRole("heading", { name: "Proposals" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-02-queued")
  await page.getByRole("button", { name: /Fast-forward/ }).click()
  await page.getByRole("button", { name: "Execute" }).click()
  await confirm(page, v)
  await page.getByText(/Proposal #9 executed/).first().waitFor({ timeout: 10000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-03-executed", true)

  // Demo controls
  await page.getByRole("button", { name: "Demo controls" }).click()
  await dialog(page).waitFor()
  await shot(page, v, "app-02-demo-controls")
  await page.keyboard.press("Escape")
}

async function frenchFlow(page, v) {
  await go(page, v, "")
  await page.waitForTimeout(400)
  await shot(page, v, "page-home", true)
  // Flow 3 in French: connect, crash, rescue your vault
  await connect(page, v, true)
  await page.getByRole("button", { name: L.fr.crash }).click()
  await page.waitForTimeout(600)
  await shot(page, v, "flow3-01-crash-console", true)
  await go(page, v, "/app/vaults/v1024")
  await page.getByLabel(L.fr.amount, { exact: true }).fill("3000")
  await shot(page, v, "flow3-03-repay-preview", true)
  await page.getByRole("button", { name: L.fr.repay }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow3-04-prompt")
  await confirm(page, v)
  await page.getByText(/remboursés sur le coffre n° 1024/).first().waitFor({ timeout: 10000 })
  await shot(page, v, "flow3-05-repaid")
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
