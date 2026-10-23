// Records one real playthrough of case 1 as a video: ../docs/media/raw/play.webm
//   BASE_URL=http://localhost:5200 node scripts/record.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const RAW = '../docs/media/raw/';
const VIEW = { width: 1100, height: 720 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(RAW, { recursive: true });
rmSync(RAW + 'tmp', { recursive: true, force: true });

// Playwright videos have no cursor, so draw one
const CURSOR = `(() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;z-index:99999;width:16px;height:16px;margin:6px 0 0 8px;border-radius:50%;background:#f6e94a;border:3px solid #0a0d18;pointer-events:none;left:-50px;top:-50px';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(d));
  addEventListener('mousemove', (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true);
})();`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEW, recordVideo: { dir: RAW + 'tmp', size: VIEW }, deviceScaleFactor: 1 });
await ctx.addInitScript(CURSOR);
const page = await ctx.newPage();

async function click(loc, hold = 700) {
  const el = loc.first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 });
  await pause(180);
  await el.click();
  await pause(hold);
}

await page.goto(BASE); await page.locator('.case-card').first().waitFor(); await pause(2200);
await click(page.locator('.case-card').first(), 900);
await click(page.getByRole('button', { name: 'Start investigating' }), 600);
await click(page.getByRole('button', { name: /^Telemetry, analytics\.js/ }), 1200);
await click(page.getByRole('button', { name: /Ask: Do you ever leave the ship/ }), 1500);
await click(page.getByRole('button', { name: 'Present a clue' }), 1100);
await click(page.locator('.card', { hasText: 'network module' }).getByRole('button', { name: 'Show this clue' }), 2200);
await click(page.getByRole('button', { name: /Ask: What is your job/ }), 1400);
await click(page.getByRole('button', { name: 'Present a clue' }), 1100);
await click(page.locator('.card', { hasText: 'Reads "userInfo"' }).getByRole('button', { name: 'Show this clue' }), 2200);
await click(page.getByRole('button', { name: 'Call the vote' }), 1000);
await click(page.locator('.pick', { hasText: 'Telemetry' }), 700);
await click(page.getByRole('button', { name: 'Confirm vote' }), 3600);
await pause(2600);
await page.mouse.wheel(0, 520); await pause(2200);

await ctx.close();
await browser.close();
const f = readdirSync(RAW + 'tmp').filter((x) => x.endsWith('.webm')).pop();
renameSync(RAW + 'tmp/' + f, RAW + 'play.webm');
rmSync(RAW + 'tmp', { recursive: true, force: true });
console.log('recorded', RAW + 'play.webm');
