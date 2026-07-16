/**
 * End-to-end walkthrough against a running server (default http://localhost:3100).
 * Uses the system Chrome via Playwright. Saves screenshots to tests/shots/.
 *
 *   node tests/e2e.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = new URL("./shots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const shot = (name, fullPage = true) =>
  page.screenshot({ path: `${SHOTS}${name}.png`, fullPage });

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};
const ok = (msg) => console.log(`✓ ${msg}`);

// ---------- marketing ----------
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await shot("01-landing");
ok("landing rendered");

await page.goto(`${BASE}/pricing`);
await page.waitForLoadState("networkidle");
await shot("02-pricing");

// ---------- signup ----------
const email = `e2e+${Date.now()}@example.com`;
await page.goto(`${BASE}/signup`);
await page.fill("#fullName", "Bilal Ahmed");
await page.fill("#email", email);
await page.fill("#password", "test-password-1");
await shot("03-signup", false);
await page.click("button[type=submit]");
await page.waitForURL("**/dashboard");
ok("signup → dashboard");

// ---------- create will ----------
await page.getByRole("button", { name: /begin my will/i }).click();
await page.waitForURL("**/edit");
ok("will created, wizard open");

// step: about you
await page.getByLabel(/full legal name/i).fill("Bilal Ahmed");
await page.getByLabel(/home address/i).fill("12 Example Road, Birmingham, B1 2AB");
await page.getByLabel(/date of birth/i).fill("1984-03-11");
await page.getByRole("button", { name: "Continue" }).click();

// step: marriage (married by default) — wife's name
await page.getByLabel(/wife's full name/i).fill("Maryam Ahmed");
await page.getByRole("button", { name: "Continue" }).click();

// step: children — 2 sons, 1 daughter, minors yes
await page.getByRole("button", { name: "increase Sons living" }).click();
await page.getByRole("button", { name: "increase Sons living" }).click();
await page.getByRole("button", { name: "increase Daughters living" }).click();
await page.getByPlaceholder("Name 1").first().fill("Yusuf Ahmed");
await page.getByRole("button", { name: "Yes", exact: true }).click(); // children under 18
await shot("04-wizard-children");
await page.getByRole("button", { name: "Continue" }).click();

// step: parents — father no (default), mother yes
await page.getByRole("button", { name: "Yes", exact: true }).nth(1).click();
await page.getByLabel(/mother's full name/i).fill("Khadija Begum");
await page.getByRole("button", { name: "Continue" }).click();

// step: grandparents (father deceased) — both default No
await page.getByRole("button", { name: "Continue" }).click();

// step: executors
await page.getByRole("button", { name: /add an executor/i }).click();
await page.getByLabel("Full name").fill("Imran Khan");
await page.getByLabel(/relationship to you/i).fill("brother-in-law");
await page.getByLabel("Address").fill("3 Sample Street, Birmingham, B2 3CD");
await page.getByRole("button", { name: "Continue" }).click();

// step: guardians
await page.getByRole("button", { name: /add a guardian/i }).click();
await page.getByLabel("Full name").fill("Fatima Khan");
await page.getByLabel(/relationship to you/i).fill("sister");
await page.getByRole("button", { name: "Continue" }).click();

// step: funeral — defaults + charity
await page.getByLabel(/charity of last resort/i).fill("Islamic Relief UK");
await page.getByRole("button", { name: "Continue" }).click();

// premium-locked steps on free plan
for (const step of ["bequests", "debts", "wishes"]) {
  const lock = await page.getByText(/Complete Will Pack/i).first().isVisible();
  if (!lock) fail(`${step}: premium lock not shown on free plan`);
  await page.getByRole("button", { name: "Continue" }).click();
}
ok("premium steps locked on free plan");

// step: estate — home owned jointly (should raise the severance flag)
await page.getByRole("button", { name: "Yes — jointly" }).click();
await page.getByRole("button", { name: "Continue" }).click();

// review
await page.waitForTimeout(300);
const reviewText = await page.textContent("main");
if (!reviewText.includes("joint tenants"))
  fail("review: joint-tenancy solicitor flag missing");
if (!reviewText.includes("1/8")) fail("review: wife's 1/8 share missing");
else ok("review shows shares and solicitor flags");
await shot("05-review");

// generate
await page.getByRole("button", { name: /generate my will/i }).click();
await page.waitForURL("**/document");
await page.waitForLoadState("networkidle");
const docText = await page.textContent("main");
let docOk = true;
for (const expected of [
  "Last Will and Testament",
  "BILAL AHMED",
  "17/60", // each son
  "17/120", // daughter
  "1/8", // wife
  "1/6", // mother
  "Wills Act 1837",
  "must NOT be a beneficiary",
]) {
  if (!docText.includes(expected)) {
    fail(`document: missing "${expected}"`);
    docOk = false;
  }
}
if (docOk) ok("document contains all expected clauses and exact fractions");
await shot("06-document-free");

// free plan: second will should be refused
const willsRes = await page.request.post(`${BASE}/api/wills`);
if (willsRes.status() !== 402) fail(`free plan second will: expected 402, got ${willsRes.status()}`);
else ok("free plan limited to one will (402)");

console.log(`\nE2E user: ${email}`);
await browser.close();
process.exit(process.exitCode ?? 0);
