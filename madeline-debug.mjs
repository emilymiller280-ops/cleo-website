import { chromium } from 'playwright';
const LINK = 'https://app.cleocare.co/go?token=eyJ1aWQiOiIzZjBmMTVmNS04NzVmLTRlZGEtYTFiNi00N2ZkODM1MDg0OTciLCJyb2xlIjoiY2xpZW50IiwicHVycG9zZSI6ImFjY291bnQiLCJleHAiOjE3ODUyNjUwMDMyNTB9.8uo59gwTnsy5e9v5e_Jp8UHvlipy9Nxyv9RCXj1n31A&next=%2Fclient%2Faccount';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(LINK, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
for (const p of ['/client/account','/client/appointments','/client/invoices']) {
  await page.goto('https://app.cleocare.co'+p, { waitUntil: 'networkidle' });
  const h1 = (await page.locator('h1').first().textContent().catch(()=>'(none)'))?.trim();
  const title = await page.title();
  const bodyStart = ((await page.textContent('body'))||'').replace(/\s+/g,' ').slice(0, 220);
  console.log(`\n=== ${p} ===`);
  console.log('title:', title, '| h1:', h1);
  console.log('body:', bodyStart);
}
await browser.close();
