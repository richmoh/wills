/**
 * End-to-end walkthrough against a LOCAL development server
 * (default http://localhost:3100 — start it with `pnpm dev -p 3100`).
 * Uses the system Chrome via Playwright. Saves screenshots to tests/shots/.
 *
 *   node tests/e2e.mjs
 *
 * It signs up a throwaway account, exercises the whole product and deletes the
 * account at the end. It relies on the development-only conveniences (the
 * simulated upgrade and the password-reset link in the API response), so it
 * refuses to run against anything that is not localhost.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3100";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error(`Refusing to run against ${BASE} — this suite creates and deletes accounts. Use a local server.`);
  process.exit(2);
}
const SHOTS = new URL("./shots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();
const api = context.request;
const shot = (name, fullPage = true) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage });

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`✗ ${msg}`);
};
const ok = (msg) => console.log(`✓ ${msg}`);
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

// any browser-side error is a failure
const browserErrors = [];
page.on("pageerror", (e) => browserErrors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const text = m.text();
  // 4xx responses the test provokes on purpose are logged by the browser as console errors
  if (/Failed to load resource.*\b(400|401|402|403|404|413|429)\b/.test(text)) return;
  browserErrors.push(`console: ${text}`);
});

const yes = (question) => page.getByRole("group", { name: question }).getByRole("button", { name: "Yes", exact: true }).click();
const choose = (question, option) => page.getByRole("group", { name: question }).getByRole("button", { name: option, exact: true }).click();
const more = (label, times = 1) => {
  const b = page.getByRole("button", { name: `increase ${label}`, exact: true });
  return (async () => { for (let i = 0; i < times; i++) await b.click(); })();
};
const fewer = (label, times = 1) => {
  const b = page.getByRole("button", { name: `decrease ${label}`, exact: true });
  return (async () => { for (let i = 0; i < times; i++) await b.click(); })();
};
const next = () => page.getByRole("button", { name: "Continue", exact: true }).click();
// Next.js adds its own hidden role=alert element for route announcements
const alertText = () => page.locator("[role=alert]:not(#__next-route-announcer__)").first().textContent();
const expectStep = async (title) => {
  await page.locator("main h1", { hasText: title }).first().waitFor({ timeout: 10000 });
};
const saved = () => page.getByText("Saved ✓").waitFor({ timeout: 10000 });
const put = (id, data, status) =>
  api.put(`${BASE}/api/wills/${id}`, { data: status ? { data, status } : { data } });

// ============================ marketing + headers ============================
for (const path of ["/", "/pricing", "/faq", "/legal/privacy", "/legal/terms", "/login", "/signup", "/forgot-password"]) {
  const res = await page.goto(`${BASE}${path}`);
  if (res.status() !== 200) fail(`${path}: HTTP ${res.status()}`);
  const text = await page.textContent("body");
  if (/professionally drafted|genuinely valid/i.test(text)) fail(`${path}: still makes an unreviewed claim`);
}
ok("marketing, legal and auth pages render without overclaiming");
await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await shot("01-landing");
await page.goto(`${BASE}/pricing`);
await shot("02-pricing");
await page.goto(`${BASE}/faq`);
await shot("02b-faq");

{
  const h = (await api.get(`${BASE}/`)).headers();
  check(
    h["x-content-type-options"] === "nosniff" && h["x-frame-options"] === "DENY" && !!h["strict-transport-security"] && !h["x-powered-by"],
    "security headers present, X-Powered-By removed"
  );
}

// logged-out visitors are sent to sign in
await page.goto(`${BASE}/dashboard`);
check(page.url().includes("/login"), "dashboard requires sign-in");

// ================================== signup ==================================
const email = `e2e+${Date.now()}@example.com`;
const password = "test-password-1";
await page.goto(`${BASE}/signup`);
await page.fill("#fullName", "Bilal Ahmed");
await page.fill("#email", email);
await page.fill("#password", password);
await shot("03-signup", false);
{
  const res = await api.post(`${BASE}/api/auth/signup`, { data: { fullName: "No Consent", email: `nc+${Date.now()}@example.com`, password } });
  check(res.status() === 400, "signup without consent is refused");
}
await page.check("#consent");
await page.click("button[type=submit]");
await page.waitForURL("**/dashboard");
ok("signup with consent → dashboard");
await shot("03b-dashboard-empty");

// ================================ the interview ================================
await page.getByRole("button", { name: /begin my will/i }).click();
await page.waitForURL("**/edit");
const willId = page.url().match(/will\/([0-9a-f-]+)\/edit/)[1];

await expectStep("About you");
await next();
check((await alertText()).includes("full legal name"), "a step cannot be left with its required answers missing");
await page.getByLabel(/full legal name/i).fill("Bilal Ahmed");
await page.getByLabel(/home address/i).fill("12 Example Road, Birmingham, B1 2AB");
await page.getByLabel(/date of birth/i).fill("1984-03-11");
await shot("04-wizard-about");
await next();

await expectStep("Your marriage");
await page.getByLabel(/wife's full name/i).fill("Maryam Ahmed");
await next();

await expectStep("Your children");
await more("Sons living", 2);
await more("Daughters living", 1);
await page.getByPlaceholder("Name 1").first().fill("Yusuf Ahmed");
await yes("Are any of your children under 18?");
await shot("05-wizard-children");
await next();

await expectStep("Your parents"); // a living son means grandchildren are never asked about
await yes("Is your mother living?");
await page.getByLabel(/mother's full name/i).fill("Khadija Begum");
await next();

await expectStep("Your grandparents");
await next();

await expectStep("Your executors"); // a son excludes siblings, so that step is skipped
await page.getByRole("button", { name: /add an executor/i }).click();
await page.getByLabel("Full name").fill("Imran Khan");
await page.getByLabel(/relationship to you/i).fill("brother-in-law");
await page.getByLabel("Address").fill("3 Sample Street, Birmingham, B2 3CD");
await next();

await expectStep("Guardians");
await page.getByRole("button", { name: /add a guardian/i }).click();
await page.getByLabel("Full name").fill("Fatima Khan");
await page.getByLabel(/relationship to you/i).fill("sister");
await next();

await expectStep("Funeral");
await page.getByLabel(/charity of last resort/i).fill("Islamic Relief UK");
await next();

for (const step of ["bequests", "Religious debts", "Letter of wishes"]) {
  if (!(await page.getByText(/Part of the Complete Will Pack/i).first().isVisible())) fail(`${step}: premium lock not shown on free plan`);
  await next();
}
ok("premium steps locked on the free plan");

await expectStep("About your estate");
await choose("Do you own your home?", "Yes — as joint tenants");
await next();

await expectStep("Review");
let text = await page.textContent("main");
check(text.includes("joint tenants"), "review raises the joint-tenancy flag");
check(text.includes("1/8") && text.includes("17/60 each"), "review shows the exact shares");
await shot("06-review");

await page.getByRole("button", { name: /generate my will/i }).click();
await page.waitForURL("**/document");
text = await page.textContent("main");
{
  const missing = ["Last Will and Testament", "BILAL AHMED", "17/60", "17/120", "1/8", "1/6", "Yusuf Ahmed", "Wills Act 1837", "must NOT be a beneficiary", "reference"].filter((t) => !text.includes(t));
  check(missing.length === 0, `document has every clause and exact fraction${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`);
  check(!/Executor guidance|Letter of wishes/.test(text), "free document leaves out the paid pack");
}
await shot("07-document-free");

check((await api.post(`${BASE}/api/wills`)).status() === 402, "free plan is limited to one will");
check((await api.post(`${BASE}/api/wills`, { data: { mirrorOf: willId } })).status() === 402, "mirror will needs the paid pack");

// ================= the family that used to get the wrong shares =================
// no children, both parents living, two brothers: the brothers inherit nothing,
// but they take the mother from a third to a sixth
await page.getByRole("link", { name: /edit answers/i }).click();
await page.waitForURL("**/edit");
await expectStep("Review"); // resumes where the user left off
await page.getByRole("button", { name: "Edit Your children" }).click();
await expectStep("Your children");
await fewer("Sons living", 2);
await fewer("Daughters living", 1);
await next();
await expectStep("Grandchildren");
await next();
await expectStep("Your parents");
await yes("Is your father living?");
await page.getByLabel(/father's full name/i).fill("Ahmed Senior");
await next();
await expectStep("Your brothers and sisters");
check((await page.textContent("main")).includes("will not inherit while your father"), "siblings are asked about even though the father excludes them");
await more("Full brothers", 2);
await page.waitForTimeout(200);
text = await page.textContent("main");
check(text.includes("7/12") && text.includes("1/6") && text.includes("1/4"), "wife 1/4, mother 1/6, father 7/12 with two brothers");
check(!text.includes("1/2"), "the father is not given a half (the old wrong answer)");
check(text.includes("does not inherit"), "the excluded brothers are shown with the reason");
await shot("08-siblings-reduce-mother");
await fewer("Full brothers", 1);
await page.waitForTimeout(200);
text = await page.textContent("main");
check(text.includes("1/2") && !text.includes("7/12"), "with one brother the mother keeps a third of the remainder");
await more("Full brothers", 1);
await saved();

// ============================ API robustness ============================
check((await put(willId, null)).status() === 400, "null answers are refused");
check((await api.get(`${BASE}/api/wills/not-a-uuid`)).status() === 404, "a malformed id is a 404, not a server error");
check((await put(willId, { fullName: "X Y", address: "1 Road, Town" }, "complete")).status() === 400, "a will cannot be generated without an executor");
check((await put(willId, { executors: "nobody", census: { sons: "three" }, bequests: 7 })).status() === 200, "malformed answers are normalised, not stored raw");
await page.goto(`${BASE}/will/${willId}/document`);
check(page.url().endsWith("/edit"), "an ungenerated will cannot be opened as a document");
check((await page.goto(`${BASE}/will/not-a-uuid/edit`)).status() === 404, "unknown will page is a 404");

// ====================== more families, checked on paper ======================
const person = { fullName: "Aisha Rahman", address: "5 Test Lane, Leeds, LS1 1AA", executors: [{ name: "Imran Khan" }], islamicBurial: true };
const families = [
  {
    name: "husband, two daughters, both parents ('awl to 15)",
    data: { ...person, sex: "female", spouseName: "Omar Rahman", census: { spouseCount: 1, daughters: 2, father: true, mother: true } },
    expect: ["1/5", "8/15", "2/15"],
  },
  {
    name: "widow with a daughter and a full sister",
    data: { ...person, sex: "female", maritalStatus: "widowed", census: { daughters: 1, fullSisters: 1 }, heirNames: { fullSisters: ["Zaynab Rahman"] } },
    expect: ["1/2", "Zaynab Rahman"],
  },
  {
    name: "single, mother and paternal uncle",
    data: { ...person, sex: "male", maritalStatus: "single", census: { mother: true, hasOtherAgnates: true }, agnateKind: "full-uncle", agnateNames: "Tariq Rahman" },
    expect: ["1/3", "2/3", "my father's full brother", "Tariq Rahman"],
  },
  {
    name: "wife only, with a daughter's children (distant kindred)",
    data: { ...person, sex: "male", spouseName: "Maryam Rahman", census: { spouseCount: 1, hasDistantKindred: true }, distantKindredNames: "Sara Malik (my daughter's daughter)" },
    expect: ["1/4", "3/4", "dhawu al-arham", "Sara Malik"],
  },
  {
    name: "no heirs at all",
    data: { ...person, sex: "male", maritalStatus: "single", census: {}, fallbackCharity: "Islamic Relief UK" },
    expect: ["no fara'id heir survives me", "Islamic Relief UK"],
  },
];
for (const f of families) {
  const res = await put(willId, f.data, "complete");
  if (res.status() !== 200) { fail(`${f.name}: could not save (${res.status()})`); continue; }
  await page.goto(`${BASE}/will/${willId}/document`);
  const doc = await page.textContent("main");
  const missing = f.expect.filter((t) => !doc.includes(t));
  check(missing.length === 0, `${f.name}${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`);
}

// a stale, hidden answer must not reach the will: brothers entered, then a son added
await put(willId, { ...person, sex: "male", maritalStatus: "single", census: { sons: 1, fullBrothers: 3, hasOtherAgnates: true } }, "complete");
await page.goto(`${BASE}/will/${willId}/document`);
text = await page.textContent("main");
check(!/brother|male-line/i.test(text.split("Attestation")[0].split("Residuary estate")[1] ?? ""), "answers to questions no longer asked do not appear in the will");

// ================================ the paid pack ================================
{
  const res = await api.post(`${BASE}/api/stripe/checkout`);
  const body = await res.json();
  check(res.ok() && String(body.url).includes("upgraded"), "development upgrade is simulated when Stripe is not configured");
}
const premiumData = {
  ...person,
  fullName: "Bilal Ahmed",
  sex: "male",
  spouseName: "Maryam Ahmed",
  census: { spouseCount: 1, sons: 1, daughters: 1 },
  sonNames: ["Yusuf Ahmed"],
  daughterNames: ["Hana Ahmed"],
  hasMinorChildren: true,
  guardians: [{ name: "Fatima Khan" }],
  bequests: [
    { beneficiary: "Islamic Relief UK", beneficiaryType: "charity", kind: "percentage", value: "20" },
    { beneficiary: "Green Lane Masjid", beneficiaryType: "charity", kind: "percentage", value: "20" },
  ],
  religiousDebts: { unpaidZakat: true, notes: "about £400 from 2023" },
  letterOfWishes: "Assalamu alaykum to my family.\n\nForgive me my shortcomings.",
};
check((await put(willId, premiumData, "complete")).status() === 400, "bequests over one-third are refused");
premiumData.bequests[1].value = "10";
check((await put(willId, premiumData, "complete")).status() === 200, "bequests within one-third are accepted");
await page.goto(`${BASE}/will/${willId}/document`);
text = await page.textContent("main");
{
  const missing = ["Bequests (wasiyya)", "20 per cent", "Green Lane Masjid", "zakat unpaid", "Letter of wishes", "Forgive me my shortcomings", "Executor guidance", "action checklist"].filter((t) => !text.includes(t));
  check(missing.length === 0, `paid pack adds bequests, debts, letter and guides${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`);
}
await shot("09-document-premium");

await page.goto(`${BASE}/dashboard`);
await page.getByRole("button", { name: /mirror will for Maryam Ahmed/i }).click();
await page.waitForURL(/will\/[0-9a-f-]+\/edit/);
check(!page.url().includes(willId), "mirror will is a separate will");
check((await page.getByLabel(/full legal name/i).inputValue()) === "Maryam Ahmed", "mirror will starts in the spouse's name");
check((await page.getByRole("group", { name: /male or female/i }).getByRole("button", { name: "Female" }).getAttribute("aria-pressed")) === "true", "mirror will swaps the sex");
await next();
check((await page.getByLabel(/husband's full name/i).inputValue()) === "Bilal Ahmed", "mirror will names the other spouse");
await next();
await expectStep("Your children");
check((await page.textContent("main")).includes("1/4"), "mirror will recalculates the shares for a wife's estate (husband 1/4)");
await page.goto(`${BASE}/dashboard`);
await shot("10-dashboard-premium");

// ============================== password reset ==============================
await page.getByRole("button", { name: /sign out/i }).click();
await page.waitForURL(`${BASE}/`);
await page.goto(`${BASE}/login`);
await page.getByRole("link", { name: /forgot/i }).click();
await page.waitForURL("**/forgot-password");
await shot("11-forgot", false);
const forgot = await (await api.post(`${BASE}/api/auth/forgot`, { data: { email } })).json();
const unknown = await api.post(`${BASE}/api/auth/forgot`, { data: { email: `nobody+${Date.now()}@example.com` } });
check(!!forgot.devResetUrl, "a reset link is issued (shown in development only)");
check(unknown.ok() && !(await unknown.json()).devResetUrl, "an unknown email gets the same answer and no link");
const newPassword = "a-brand-new-password-2";
if (forgot.devResetUrl) {
  await page.goto(forgot.devResetUrl.replace(/^https?:\/\/[^/]+/, BASE));
  await page.fill("#password", newPassword);
  await shot("12-reset", false);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard");
  ok("password reset signs the user back in");
  const reuse = await api.post(`${BASE}/api/auth/reset`, { data: { token: new URL(forgot.devResetUrl).searchParams.get("token"), password: "another-password-3" } });
  check(reuse.status() >= 400, "a reset link works only once");
  check((await api.post(`${BASE}/api/auth/login`, { data: { email, password } })).status() === 401, "the old password no longer works");
  check((await api.post(`${BASE}/api/auth/login`, { data: { email, password: newPassword } })).ok(), "the new password works");
}

// ============================ account: export + delete ============================
await page.goto(`${BASE}/dashboard`);
await page.getByRole("link", { name: /account/i }).first().click();
await page.waitForURL("**/account");
await shot("13-account");
{
  const res = await api.get(`${BASE}/api/account/export`);
  const dump = await res.text();
  check(res.ok() && dump.includes(email) && dump.includes("Maryam Ahmed") && !/password_hash/.test(dump), "data export holds the user's data and no password hash");
}
check((await api.delete(`${BASE}/api/account`, { data: { password: "wrong-password" } })).status() >= 400, "account deletion needs the right password");
await page.click("#delete-account-start");
await page.fill("#delete-password", "wrong-password");
await page.getByRole("button", { name: "Delete my account permanently" }).click();
check((await alertText()).includes("incorrect"), "a wrong password is explained on the page");
await page.fill("#delete-password", newPassword);
await page.getByRole("button", { name: "Delete my account permanently" }).click();
await page.waitForURL(`${BASE}/`);
check((await api.post(`${BASE}/api/auth/login`, { data: { email, password: newPassword } })).status() === 401, "a deleted account cannot sign in");
check((await api.get(`${BASE}/api/wills/${willId}`)).status() === 401, "the session ended with the account");

// ================================== result ==================================
if (browserErrors.length) {
  fail(`browser errors:\n  ${[...new Set(browserErrors)].join("\n  ")}`);
} else ok("no browser console errors or exceptions");

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
