import { chromium } from 'playwright';
const LINK = 'https://app.cleocare.co/go?token=eyJ1aWQiOiIzZjBmMTVmNS04NzVmLTRlZGEtYTFiNi00N2ZkODM1MDg0OTciLCJyb2xlIjoiY2xpZW50IiwicHVycG9zZSI6ImFjY291bnQiLCJleHAiOjE3ODUyNjUwMDMyNTB9.8uo59gwTnsy5e9v5e_Jp8UHvlipy9Nxyv9RCXj1n31A&next=%2Fclient%2Faccount';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(String(e)));

// 1. Follow the magic link (logs her in)
await page.goto(LINK, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000); // allow signIn + redirect
const landedUrl = page.url();
const bodyAfter = (await page.textContent('body')) || '';
const loggedIn = landedUrl.includes('/client') && !/expired|no longer valid/i.test(bodyAfter);
console.log('LOGIN via magic link →', landedUrl.replace('https://app.cleocare.co',''), '| logged in:', loggedIn);

// 2. Visit every client page as her
const pages = ['/client','/client/account','/client/appointments','/client/invoices','/client/billing','/client/book','/client/care-plan'];
for (const p of pages) {
  const resp = await page.goto('https://app.cleocare.co'+p, { waitUntil: 'networkidle' });
  const status = resp?.status();
  const finalUrl = page.url().replace('https://app.cleocare.co','');
  const h1 = (await page.locator('h1').first().textContent().catch(()=>null))?.trim() || '(no h1)';
  const kickedToLogin = finalUrl.includes('/login');
  const errorPage = /Application error|Internal Server Error|could not be found/i.test(await page.textContent('body') || '');
  console.log(`${p.padEnd(22)} status:${status}  final:${finalUrl.padEnd(20)}  ${kickedToLogin?'❌ LOGIN':(errorPage?'❌ ERROR':'✓ '+h1)}`);
}
console.log('JS errors:', jsErrors.length ? jsErrors : 'none');
await browser.close();
