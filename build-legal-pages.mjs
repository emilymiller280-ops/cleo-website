// Build terms.html and privacy.html from counsel's .docx files.
//
//   node build-legal-pages.mjs
//
// These two pages are generated, never hand-edited — when RG sends a new
// version, drop it in the Legal Docs folder below and re-run. Hand edits
// would be silently overwritten and would also mean the live page no longer
// matches the document that was reviewed.
import { writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { convertDocx } from './docx-to-legal-html.mjs';

// Source of truth is the "Legal Docs" folder on Emily's Desktop — NOT Downloads,
// which accumulates older duplicates from counsel.
const LEGAL_DIR = `${process.env.HOME}/Desktop/Cleo/Documents/Legal Docs`;

// Emily renames these files every time counsel sends a revision ("Cleo TOS.docx"
// has also been "TOS 9.15.docx" and "Terms of Service 9.16.docx"). Exact filenames
// meant the build silently kept publishing the previous version — the live Terms
// sat a revision behind for three days that way. Resolve by PATTERN instead, the
// same approach build-agreement.mjs already uses, and take the newest match.
function resolveSrc(patterns, label) {
  const files = readdirSync(LEGAL_DIR)
    .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
    .filter(f => patterns.some(re => re.test(f)))
    .map(f => ({ f, m: statSync(join(LEGAL_DIR, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (!files.length) {
    throw new Error(`No .docx in "${LEGAL_DIR}" matches ${label}. Looked for: ${patterns}`);
  }
  if (files.length > 1) {
    console.warn(`  ! ${files.length} candidates for ${label}; using newest: ${files[0].f}`);
  }
  return join(LEGAL_DIR, files[0].f);
}

const DOCS = [
  {
    src: resolveSrc([/\bTOS\b/i, /terms\s*of\s*service/i], 'Terms of Service'),
    out: 'terms.html',
    title: 'Terms of Service',
    metaTitle: 'Terms of Service | Cleo',
    blurb: 'The agreement that governs your use of Cleo’s website and platform.',
  },
  {
    src: resolveSrc([/privacy\s*policy/i], 'Privacy Policy'),
    out: 'privacy.html',
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | Cleo',
    blurb: 'How Cleo collects, uses, and protects your information.',
  },
];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Give every heading a stable id so the platform agreement and emails can deep-link.
function addAnchors(html) {
  const seen = new Map();
  return html.replace(/<h([23]) class="legal-h[23]">([\s\S]*?)<\/h\1>/g, (full, level, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    let id = slug(text) || 'section';
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    return `<h${level} id="${id}" class="legal-h${level}">${inner}</h${level}>`;
  });
}

const page = ({ title, metaTitle, blurb, lastUpdated, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LJRX3HD7CC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LJRX3HD7CC');
</script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${blurb}" />
  <link rel="icon" type="image/png" sizes="32x32" href="/brand/img/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/brand/img/favicon-192.png">
  <link rel="apple-touch-icon" href="/brand/img/apple-touch-icon.png">
<link rel="stylesheet" href="/brand/brand.css">
<link rel="stylesheet" href="/brand/hero.css">
<link rel="stylesheet" href="/brand/nav.css">
<script src="/brand/no-widows.js" defer></script>
<style>
  /* Born ID legal pages (Emily, 2026-11-02): sky banner, cream page, burgundy footer */
  body{ background:var(--cream); }

  /* Title sits on the cream under the nav band, no second squiggle (Emily, 2026-11-02) */
  .legal-hero{ max-width:760px; margin:0 auto; text-align:center;
    padding:calc(98px + clamp(48px,7vw,88px)) 32px 0; }
  .legal-hero h1{ font-size:clamp(2.4rem,5.2vw,4.2rem); color:var(--burgundy); margin:14px 0 18px; text-wrap:balance; }
  .legal-hero__lede{ font-size:clamp(1.02rem,1.4vw,1.15rem); line-height:1.65; color:var(--text); margin:0; text-wrap:balance; }
  .legal-hero__date{ font-size:.9rem; color:var(--text); opacity:.75; margin:14px 0 0; }

  /* ---- Legal document typography ---- */
  .legal-main{ padding:clamp(40px,6vw,64px) 32px clamp(80px,10vw,120px); }
  .legal-body{ max-width:760px; margin:0 auto; }
  .legal-h2{
    font-family:var(--font-display); font-size:clamp(1.35rem,2.2vw,1.65rem); font-weight:400;
    color:var(--burgundy); line-height:1.3;
    margin:56px 0 18px; padding-bottom:12px; border-bottom:1.5px solid rgba(107,8,38,.16);
    scroll-margin-top:100px;
  }
  .legal-h3{
    font-family:var(--font-body); font-size:.8125rem; font-weight:600;
    letter-spacing:.14em; text-transform:uppercase; color:var(--burgundy);
    line-height:1.5; margin:40px 0 14px; scroll-margin-top:100px;
  }
  .legal-h2:first-child, .legal-h3:first-child{ margin-top:0; }
  .legal-p{ font-size:.98rem; line-height:1.85; color:var(--text); margin-bottom:18px; }
  .legal-p strong{ font-weight:600; }
  .legal-list{ margin:0 0 20px 0; padding-left:22px; list-style:disc; }
  .legal-list li{ font-size:.98rem; line-height:1.85; color:var(--text); margin-bottom:10px; padding-left:4px; }
  .legal-body a{ color:var(--burgundy); text-decoration:none; border-bottom:1px solid rgba(107,8,38,.35); }
  .legal-body a:hover{ border-bottom-color:var(--burgundy); }
  .legal-body a:focus-visible{ outline:2px solid var(--coral); outline-offset:3px; border-radius:2px; }
  .legal-table-wrap{ overflow-x:auto; margin:0 0 24px; border:1px solid rgba(107,8,38,.14); border-radius:8px; }
  .legal-table{ width:100%; border-collapse:collapse; background:var(--ivory); }
  .legal-table th, .legal-table td{
    font-size:.9rem; line-height:1.7; text-align:left; padding:14px 18px;
    border-bottom:1px solid rgba(107,8,38,.1); vertical-align:top;
  }
  .legal-table th{ background:var(--butter); color:var(--text); font-weight:600; }
  .legal-table td{ color:var(--text); }
  .legal-table tr:last-child th, .legal-table tr:last-child td{ border-bottom:none; }
  .legal-foot{ margin-top:56px; padding-top:28px; border-top:1.5px solid rgba(107,8,38,.16); font-size:.92rem; line-height:1.8; color:var(--text); }

  .foot{ background:var(--burgundy); color:var(--butter); }
  .foot .wrap{ padding-block:56px 30px; }
  .foot a{ color:rgba(250,246,183,.85); text-decoration:none; } .foot a:hover{ color:var(--butter); }
  .foot-bar{ border-top:1px solid rgba(250,246,183,.24); margin-top:34px; padding-top:22px;
    display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; font-size:.85rem; opacity:.85; }
  @media (max-width:768px){
    .legal-main{ padding:40px 20px 80px; }
  }
</style>
</head>
<body>

  <!-- Nav -->
  <header class="cleo-nav">
    <div class="cleo-nav__inner">
      <a class="cleo-nav__brand" href="index.html">Cleo Care</a>
      <input type="checkbox" id="cleo-nav-toggle" class="cleo-nav__toggle" aria-hidden="true" tabindex="-1">
      <label for="cleo-nav-toggle" class="cleo-nav__burger" aria-label="Menu"><span></span><span></span><span></span></label>
      <nav class="cleo-nav__links">
        <a href="faq.html">How We Work</a>
        <a href="meal-delivery.html">Meal Delivery</a>
        <a href="favorites.html">Our Favorites</a>
        <a href="our-story.html">Our Story</a>
        <a href="gifting.html">Gifting</a>
        <a href="provider-intake.html">For Providers</a>
        <a href="booking.html" class="cleo-nav__cta">Book Care</a>
      </nav>
    </div>
  </header>

<!-- HERO -->
<section class="legal-hero">
  <span class="eyebrow" style="color:var(--burgundy);opacity:.72;">Legal</span>
  <h1>${title}</h1>
  <p class="legal-hero__lede">${blurb}</p>
  ${lastUpdated ? `<p class="legal-hero__date">Last updated ${lastUpdated}</p>` : ''}
</section>

<!-- DOCUMENT -->
<main class="legal-main">
  <div class="legal-body">
${body}
    <p class="legal-foot">
      Questions about this document? Email <a href="mailto:hello@cleocare.co">hello@cleocare.co</a>.
      See also our <a href="${title === 'Terms of Service' ? 'privacy.html' : 'terms.html'}">${title === 'Terms of Service' ? 'Privacy Policy' : 'Terms of Service'}</a>.
    </p>
  </div>
</main>

<footer class="foot">
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;">
      <div style="max-width:280px;">
        <p style="font-family:var(--font-logo);font-size:1.6rem;color:var(--butter);margin-bottom:12px;">Cleo Care</p>
        <p style="opacity:.82;font-size:.95rem;">Maternal care, reimagined.</p>
      </div>
      <div style="display:flex;gap:56px;flex-wrap:wrap;">
        <div><p class="eyebrow" style="color:rgba(250,246,183,.7);margin-bottom:14px;">Care</p>
          <a href="booking.html" style="display:block;margin-bottom:9px;">Book Care</a>
          <a href="faq.html" style="display:block;margin-bottom:9px;">How We Work</a>
          <a href="meal-delivery.html" style="display:block;margin-bottom:9px;">Meal Delivery</a>
          <a href="favorites.html" style="display:block;">Our Favorites</a></div>
        <div><p class="eyebrow" style="color:rgba(250,246,183,.7);margin-bottom:14px;">More</p>
          <a href="our-story.html" style="display:block;margin-bottom:9px;">Our Story</a>
          <a href="gifting.html" style="display:block;margin-bottom:9px;">Gifting</a>
          <a href="provider-intake.html" style="display:block;margin-bottom:9px;">For Providers</a>
          <a href="mailto:hello@cleocare.co" style="display:block;">Contact</a></div>
        <div><p class="eyebrow" style="color:rgba(250,246,183,.7);margin-bottom:14px;">Follow</p>
          <a href="https://cleocare.substack.com" style="display:block;margin-bottom:9px;">Substack</a>
          <a href="https://www.instagram.com/cleo.care.co" style="display:block;">Instagram</a></div>
      </div>
    </div>
    <div class="foot-bar">
      <span>© 2026 Cleo Care, LLC · hello@cleocare.co</span>
      <span><a href="terms.html">Terms</a> &nbsp;·&nbsp; <a href="privacy.html">Privacy</a></span>
    </div>
  </div>
</footer>
</body>
</html>
`;

// Changes Emily made after counsel's last revision, applied on top of the .docx
// so a rebuild can't silently drop them. Each one throws if its sentence is no
// longer there — counsel reworded it, so look again rather than guess.
const AMENDMENTS = {
  'terms.html': {
    // Card processing moves from the client to the provider from Fri 6 Nov 2026
    // (Emily, 2026-10-29). Mirrors Appendix C item (iii) of the provider agreement.
    lastUpdated: 'November 6, 2026',
    edits: [
      ['; (b) a flat platform fee of ten dollars ($10.00) per appointment; and (c) a pass-through card-processing cost equal to the fee charged by our payment processor for the transaction. The platform fee and pass-through card-processing cost are in addition to',
       '; and (b) a flat platform fee of ten dollars ($10.00) per appointment. You are not charged any card-processing fee. The platform fee is in addition to'],
      ['(b) a flat platform fee of ten dollars ($10.00), and (c) a pass-through card-processing cost, each collected at the time of service.',
       'and (b) a flat platform fee of ten dollars ($10.00), each collected at the time of service. Consumers are not charged any card-processing fee.'],
      ['You will be charged flat, per-booking fees for use of the Services, consisting of (a) a one-time match fee assessed on the Consumer’s first appointment with you, (b) a flat per-appointment fee assessed for each appointment thereafter, and (c) if Cleo Care provides billing services',
       'You will be charged per-booking fees for use of the Services, consisting of (a) a one-time match fee assessed on the Consumer’s first appointment with you, (b) a flat per-appointment fee assessed for each appointment thereafter, (c) a pass-through of the actual card-processing cost charged by our payment processor on your clinical fee, without markup, and (d) if Cleo Care provides billing services'],
    ],
  },
};

for (const doc of DOCS) {
  let { html, lastUpdated } = convertDocx(doc.src);
  const amend = AMENDMENTS[doc.out];
  if (amend) {
    for (const [from, to] of amend.edits) {
      if (!html.includes(from)) throw new Error(`${doc.out}: amendment no longer matches the .docx — "${from.slice(0, 70)}…"`);
      html = html.replace(from, to);
    }
    lastUpdated = amend.lastUpdated;
  }
  writeFileSync(doc.out, page({ ...doc, lastUpdated, body: addAnchors(html) }));
  console.log(`wrote ${doc.out}  (last updated: ${lastUpdated || 'n/a'})`);
}
