import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:3000/build-program.html', { waitUntil: 'networkidle' });
// Postpartum + BLD + Medium + 7 day => $657, button "Continue to payment"
await page.click('[data-journey="postpartum"]');
await page.click('[data-comp="bld"]');
await page.click('[data-portion="medium"]');
await page.click('[data-dur="7"]');
await page.click('[data-hh="2"]');
console.log('Priced: total=', await page.textContent('#sum-total'), '| btn=', (await page.textContent('#checkout-btn')).trim(), '| for=', await page.textContent('#sum-journey'), '| hh=', await page.textContent('#sum-hh'));
// 2 month => custom quote
await page.click('[data-dur="60"]');
console.log('2-month: total=', await page.textContent('#sum-total'), '| btn=', (await page.textContent('#checkout-btn')).trim());
// Gift journey => recipient-journey + gift fields visible
await page.click('[data-journey="gift"]');
const recJ = await page.isVisible('#recipient-journey');
const giftF = await page.isVisible('#gift-fields');
const selfF = await page.isVisible('#self-fields');
await page.click('[data-recj="pregnancy"]');
await page.click('[data-dur="40"]');
console.log('Gift: recipient-journey visible=', recJ, '| gift fields=', giftF, '| self hidden=', !selfF, '| for=', await page.textContent('#sum-journey'), '| total=', await page.textContent('#sum-total'));
console.log('JS errors:', errs.length ? errs : 'none');
await page.screenshot({ path: './screenshots/build-program-v2.png', fullPage: true });
await browser.close();
