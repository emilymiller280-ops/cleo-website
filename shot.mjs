import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000/meal-delivery.html';
const label = process.argv[3] || 'shot';
const out = `./screenshots/${label}.png`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('Saved', out);
