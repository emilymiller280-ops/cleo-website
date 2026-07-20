import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/meal-delivery.html', { waitUntil: 'networkidle' });
const el = await page.locator('text=A look at the plate.').first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
// screenshot just the sample menu section area
const section = page.locator('section', { hasText: 'A look at the plate.' }).first();
await section.screenshot({ path: './screenshots/sample-menu.png' });
console.log('done');
await browser.close();
