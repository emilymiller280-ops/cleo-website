import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 620, height: 700 } });
await page.goto('file:///private/tmp/claude-501/-Users-emilymiller/649e4863-9037-4107-aca0-33f839ad4d06/scratchpad/confirm-preview.html', { waitUntil: 'networkidle' });
await page.screenshot({ path: './screenshots/confirm-preview.png', fullPage: true });
await browser.close();
console.log('done');
