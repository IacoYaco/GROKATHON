/**
 * Record a ~60s 1920×1080 Chromium walkthrough of CEID Co-Pilot.
 *
 * Prerequisites: app serving at http://localhost:3000 (override with DEMO_BASE_URL).
 * Usage: node scripts/record-demo.mjs
 */
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.DEMO_BASE_URL || "http://localhost:3000";
const OUT_DIR = resolve("demo-video");
const VIEWPORT = { width: 1920, height: 1080 };

mkdirSync(OUT_DIR, { recursive: true });

async function sleep(page, ms) {
  await page.waitForTimeout(ms);
}

async function smoothMove(page, x, y, steps = 24) {
  await page.mouse.move(x, y, { steps });
}

async function moveToLocator(page, locator, steps = 22) {
  const box = await locator.boundingBox();
  if (!box) return null;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await smoothMove(page, x, y, steps);
  return { x, y, box };
}

async function clickSmooth(page, locator, steps = 22) {
  await locator.waitFor({ state: "visible", timeout: 20_000 });
  await locator.scrollIntoViewIfNeeded();
  const pos = await moveToLocator(page, locator, steps);
  await sleep(page, 220);
  await locator.click({ delay: 40 });
  return pos;
}

async function waitForApi(page, pathFragment, timeout = 25_000) {
  try {
    await page.waitForResponse(
      (res) =>
        res.url().includes(pathFragment) &&
        (res.status() === 200 || res.status() === 401 || res.status() >= 500),
      { timeout }
    );
  } catch {
    // Continue even if fallback/mocks resolve without a matching network event.
  }
}

async function nav(page, label) {
  const btn = page.getByRole("button", { name: label, exact: true });
  await clickSmooth(page, btn);
  await sleep(page, 650);
}

function listWebms(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}

async function main() {
  const before = new Set(listWebms(OUT_DIR));

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: OUT_DIR,
      size: VIEWPORT,
    },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(25_000);

  const t0 = Date.now();
  console.log(`Recording CEID Co-Pilot demo from ${BASE}`);

  // —— 1. Login showcase scroll + Student Builder ——
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(page, 900);

  // Smooth scroll through motion-scroll sections
  for (const y of [420, 900, 1400, 1900, 2400]) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y);
    await sleep(page, 700);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(page, 800);

  await clickSmooth(
    page,
    page.getByRole("button", { name: "Enter as Student Builder" })
  );
  await page.getByRole("button", { name: "Command Home" }).waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await sleep(page, 900);

  // —— 2. Floor Pulse · Snap-to-Diagnose ——
  await nav(page, "Floor Pulse");
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Load Sample Failed Print Photo" })
  );
  await waitForApi(page, "/api/diagnose");
  await page
    .getByText(/Verified via Grok Vision|Root Cause|Failure Mode|Diagnosis failed/i)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  await sleep(page, 1200);

  // —— 3. DFM Router ——
  await nav(page, "DFM Router");
  await clickSmooth(
    page,
    page.getByRole("button", {
      name: "Load Sample Project: Autonomous Drone Frame",
    })
  );
  await sleep(page, 500);
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Generate DFM Plan" })
  );
  await waitForApi(page, "/api/dfm");
  await page
    .getByText(/Recommended Fabrication Sequence|DFM Trap Detector|Routing/i)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  await sleep(page, 1100);

  // —— 4. Materials (TouchNet) ——
  await nav(page, "Materials (TouchNet)");
  await page
    .getByText(/Synced from TouchNet Store #239/i)
    .first()
    .waitFor({ state: "visible", timeout: 20_000 })
    .catch(() => {});
  await sleep(page, 700);
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Refresh TouchNet" })
  );
  await waitForApi(page, "/api/materials/touchnet");
  await sleep(page, 900);
  const acrylic = page.getByRole("button", { name: "Acrylic", exact: true });
  if (await acrylic.count()) {
    await clickSmooth(page, acrylic);
    await sleep(page, 600);
  }

  // —— 5. AI CAD Studio ——
  await nav(page, "AI CAD Studio");
  await clickSmooth(
    page,
    page.getByRole("button", { name: /FTC\/Drone Motor Mount Plate/i })
  );
  await sleep(page, 500);
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Generate modified CAD" })
  );
  await waitForApi(page, "/api/cad-modify");
  await page
    .getByText(/Mesh ready|Onshape|Download \.STL|No generated mesh/i)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  await sleep(page, 700);

  // Orbit the Three.js viewport with a smooth drag
  const canvas = page.locator("canvas").first();
  if (await canvas.count()) {
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width * 0.55;
      const cy = box.y + box.height * 0.45;
      await smoothMove(page, cx, cy, 18);
      await page.mouse.down();
      await smoothMove(page, cx + 160, cy + 40, 36);
      await smoothMove(page, cx + 40, cy + 120, 28);
      await page.mouse.up();
      await sleep(page, 500);
    }
  }

  // —— 6. Tool Sandbox ——
  await nav(page, "Tool Sandbox");
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Load Sample Sandbox" })
  );
  await waitForApi(page, "/api/tool-sandbox");
  await page
    .getByText(/Target|Laser|Power|Within target|Spin up/i)
    .first()
    .waitFor({ state: "visible", timeout: 25_000 })
    .catch(() => {});
  await sleep(page, 600);

  const sliders = page.locator('input[type="range"]');
  const sliderCount = await sliders.count();
  for (let i = 0; i < Math.min(sliderCount, 3); i++) {
    const slider = sliders.nth(i);
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    if (!box) continue;
    // Sweep into a mid/safe band (coral → amber → mint track)
    const midX = box.x + box.width * 0.62;
    const y = box.y + box.height / 2;
    await smoothMove(page, box.x + box.width * 0.25, y, 14);
    await page.mouse.down();
    await smoothMove(page, midX, y, 30);
    await page.mouse.up();
    await sleep(page, 350);
  }
  await sleep(page, 700);

  // —— 7. Cert Sniper / Newsletter ——
  await nav(page, "Cert Sniper");
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Paste Sample CEID Weekly Email" })
  );
  await sleep(page, 450);
  await clickSmooth(
    page,
    page.getByRole("button", { name: "Parse with Grok" })
  );
  await waitForApi(page, "/api/parse-newsletter");
  await page
    .getByText(/Extracted Training Cards|Claim Spot|Parse failed/i)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  await sleep(page, 1000);

  // —— 8. Faculty Console (sign out → faculty demo) ——
  await clickSmooth(page, page.getByRole("button", { name: "Sign out" }));
  await sleep(page, 700);
  const facultyBtn = page.getByRole("button", {
    name: "Enter as Faculty / Fellow",
  });
  if (await facultyBtn.count()) {
    await clickSmooth(page, facultyBtn);
    await page
      .getByRole("button", { name: "Faculty Console" })
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});
    await sleep(page, 500);
    await nav(page, "Faculty Console");
    await page
      .getByText(/Workshop RSVP roster|Faculty Console|No RSVPs/i)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await sleep(page, 1400);
  } else {
    // Faculty demo unavailable — hold on certs view
    await sleep(page, 1400);
  }

  // Pad / trim toward ~60s wall clock
  const elapsed = Date.now() - t0;
  if (elapsed < 58_000) {
    await sleep(page, 58_000 - elapsed);
  }

  const video = page.video();
  await context.close();
  await browser.close();

  let saved = null;
  if (video) {
    saved = await video.path();
  }
  // Prefer newest .webm written during this run
  const after = listWebms(OUT_DIR).filter((p) => !before.has(p));
  if (after[0]) saved = after[0];
  else if (!saved) saved = listWebms(OUT_DIR)[0] || null;

  console.log(`Saved demo video: ${saved}`);
  console.log(`Elapsed wall time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
