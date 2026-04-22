import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

const pages = [
  { name: 'welcome', url: BASE + '/' },
  { name: 'pothole (shape-A)', url: BASE + '/?classificationId=61341' },
  { name: 'fire-code (dates + selects)', url: BASE + '/?classificationId=61712' },
  { name: 'neighborhood-services-cora (19 checkboxes)', url: BASE + '/?classificationId=61752' },
  { name: 'accessibility-ada', url: BASE + '/?classificationId=61723' },
];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

let total = 0;
for (const p of pages) {
  await page.goto(p.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600); // give map + react-hook-form time to settle
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  console.log(`\n=== ${p.name} (${p.url}) ===`);
  console.log(`violations: ${results.violations.length}`);
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id} — ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`    target: ${n.target.join(', ')}`);
      if (n.failureSummary) console.log(`    ${n.failureSummary.split('\n').join(' ')}`);
    }
  }
  total += results.violations.length;
}

await browser.close();
console.log(`\nTOTAL violations across ${pages.length} pages: ${total}`);
process.exit(total > 0 ? 1 : 0);
