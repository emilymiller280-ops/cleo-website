// Build terms.html and privacy.html from counsel's .docx files.
//
//   node build-legal-pages.mjs
//
// These two pages are generated, never hand-edited — when RG sends a new
// version, drop it in Downloads, update DOCS below, and re-run. Hand edits
// would be silently overwritten and would also mean the live page no longer
// matches the document that was reviewed.
import { writeFileSync } from 'node:fs';
import { convertDocx } from './docx-to-legal-html.mjs';

// Source of truth is the "Legal Docs" folder on Emily's Desktop — NOT Downloads,
// which accumulates older duplicates from counsel.
const LEGAL_DIR = `${process.env.HOME}/Desktop/Cleo/Documents/Legal Docs`;
const DOCS = [
  {
    src: `${LEGAL_DIR}/Cleo TOS.docx`,
    out: 'terms.html',
    title: 'Terms of Service',
    metaTitle: 'Terms of Service | Cleo',
    blurb: 'The agreement that governs your use of Cleo’s website and platform.',
  },
  {
    src: `${LEGAL_DIR}/Cleo Care - Privacy Policy.docx`,
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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='white'/><text y='.9em' font-size='82' font-family='Georgia,serif' fill='%231B3872' x='50%' text-anchor='middle' dy='0.1em'>C</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #FAF8F4; color: #0D1F3C; -webkit-font-smoothing: antialiased; }
    :root {
      --navy: #1B3872; --navy-dark: #0F2352; --navy-light: #2A4F9E;
      --navy-pale: #D6E0F5; --navy-wash: #EBF0FA;
      --ink: #0D1F3C; --ink-mid: #3A4A6A; --ink-muted: #7888A8;
      --cream: #FAF8F4; --warm: #F5F0E8;
    }
    .heading-display { font-family: 'Spectral', serif; line-height: 1.05; letter-spacing: -0.02em; }
    .body-text { font-family: 'Inter', sans-serif; line-height: 1.7; }
    .nav-link { font-family: 'Spectral', serif; font-size: 1rem; font-weight: 400; color: var(--ink-mid); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s ease; }
    .nav-link:hover { color: var(--navy); }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--navy); color: #fff; font-family: 'Spectral', serif;
      font-size: 0.9375rem; font-weight: 400; letter-spacing: 0.04em;
      padding: 16px 40px; border-radius: 4px; text-decoration: none; border: none; cursor: pointer;
      box-shadow: 0 2px 4px rgba(27,56,114,0.18), 0 6px 20px rgba(27,56,114,0.22);
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background 0.15s ease;
    }
    .btn-primary:hover { background: var(--navy-light); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(27,56,114,0.22), 0 12px 32px rgba(27,56,114,0.32); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:focus-visible, .nav-link:focus-visible, .legal-body a:focus-visible { outline: 2px solid var(--navy-light); outline-offset: 3px; border-radius: 2px; }

    /* ---- Legal document typography ---- */
    .legal-body { max-width: 760px; }
    .legal-h2 {
      font-family: 'Spectral', serif; font-size: 1.5rem; font-weight: 400;
      color: var(--ink); letter-spacing: -0.01em; line-height: 1.3;
      margin: 56px 0 18px; padding-bottom: 12px; border-bottom: 1px solid rgba(27,56,114,0.12);
      scroll-margin-top: 100px;
    }
    .legal-h3 {
      font-family: 'Inter', sans-serif; font-size: 0.8125rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--navy);
      line-height: 1.5; margin: 40px 0 14px; scroll-margin-top: 100px;
    }
    .legal-h2:first-child, .legal-h3:first-child { margin-top: 0; }
    .legal-p {
      font-family: 'Inter', sans-serif; font-size: 0.9375rem; line-height: 1.85;
      color: var(--ink-mid); margin-bottom: 18px;
    }
    .legal-p strong { color: var(--ink); font-weight: 600; }
    .legal-list { margin: 0 0 20px 0; padding-left: 22px; list-style: disc; }
    .legal-list li {
      font-family: 'Inter', sans-serif; font-size: 0.9375rem; line-height: 1.85;
      color: var(--ink-mid); margin-bottom: 10px; padding-left: 4px;
    }
    .legal-body a { color: var(--navy); text-decoration: none; border-bottom: 1px solid rgba(27,56,114,0.3); transition: border-color 0.15s ease; }
    .legal-body a:hover { border-bottom-color: var(--navy); }
    .legal-table-wrap { overflow-x: auto; margin: 0 0 24px; border: 1px solid rgba(27,56,114,0.12); border-radius: 8px; }
    .legal-table { width: 100%; border-collapse: collapse; background: #fff; }
    .legal-table th, .legal-table td {
      font-family: 'Inter', sans-serif; font-size: 0.875rem; line-height: 1.7;
      text-align: left; padding: 14px 18px; border-bottom: 1px solid rgba(27,56,114,0.09); vertical-align: top;
    }
    .legal-table th { background: var(--navy-wash); color: var(--ink); font-weight: 600; }
    .legal-table td { color: var(--ink-mid); }
    .legal-table tr:last-child th, .legal-table tr:last-child td { border-bottom: none; }

    .hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:4px; flex-shrink:0; }
    .hamburger span { display:block; width:22px; height:1.5px; background:var(--navy); transition:transform 0.3s ease, opacity 0.3s ease; }
    .hamburger.open span:nth-child(1) { transform:translateY(6.5px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity:0; }
    .hamburger.open span:nth-child(3) { transform:translateY(-6.5px) rotate(-45deg); }
    .mobile-menu { display:none; position:fixed; top:76px; left:0; right:0; bottom:0; background:rgba(250,248,244,0.98); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); z-index:49; flex-direction:column; align-items:center; justify-content:center; gap:36px; }
    .mobile-menu.open { display:flex; }
    @media (max-width:768px) {
      .hamburger { display:flex !important; }
      header nav > div { display:none !important; }
      #nav-links { display:none !important; }
      header nav { padding: 0 20px !important; }
      .legal-hero { padding: 130px 20px 48px !important; }
      .legal-main { padding: 40px 20px 80px !important; }
      .legal-h2 { font-size: 1.3rem; }
      footer { padding: 60px 20px 36px !important; }
      #legal-footer-bottom { flex-direction: column; align-items: flex-start !important; gap: 16px; }
    }
  </style>
</head>
<body>

<!-- NAV -->
<header style="position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(250,248,244,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(27,56,114,0.07);">
  <nav style="max-width:1280px;margin:0 auto;padding:0 56px;height:76px;display:flex;align-items:center;justify-content:space-between;position:relative;">
    <a href="index.html" style="text-decoration:none;flex-shrink:0;">
      <span style="font-family:'Spectral',serif;font-size:1.875rem;font-weight:300;color:var(--navy);letter-spacing:-0.01em;">Cleo</span>
    </a>
    <div id="nav-links" style="position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:24px;white-space:nowrap;">
      <a href="index.html" class="nav-link">Home</a>
      <a href="meal-delivery.html" class="nav-link">Meal Delivery</a>
      <a href="booking.html" class="btn-primary" style="padding:10px 24px;font-size:0.75rem;width:auto;display:inline-flex;">Book Care</a>
      <a href="favorites.html" class="nav-link">Our Favorites</a>
      <a href="https://app.cleocare.co/gift" class="nav-link">Gift</a>
      <a href="faq.html" class="nav-link">The Details</a>
    </div>
    <button class="hamburger" id="hamburger" onclick="toggleMenu()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </nav>
</header>
<div class="mobile-menu" id="mobile-menu">
  <a href="index.html" style="font-family:'Spectral',serif;font-size:1.75rem;font-weight:300;color:var(--navy);text-decoration:none;letter-spacing:-0.01em;">Home</a>
  <a href="meal-delivery.html" style="font-family:'Spectral',serif;font-size:1.75rem;font-weight:300;color:var(--navy);text-decoration:none;letter-spacing:-0.01em;">Meal Delivery</a>
  <a href="favorites.html" style="font-family:'Spectral',serif;font-size:1.75rem;font-weight:300;color:var(--navy);text-decoration:none;letter-spacing:-0.01em;">Our Favorites</a>
  <a href="https://app.cleocare.co/gift" style="font-family:'Spectral',serif;font-size:1.75rem;font-weight:300;color:var(--navy);text-decoration:none;letter-spacing:-0.01em;">Gift</a>
  <a href="faq.html" style="font-family:'Spectral',serif;font-size:1.75rem;font-weight:300;color:var(--navy);text-decoration:none;letter-spacing:-0.01em;">The Details</a>
  <a href="booking.html" style="font-family:'Spectral',serif;font-size:1.125rem;font-weight:400;letter-spacing:0.03em;color:#fff;background:var(--navy);padding:14px 40px;border-radius:4px;text-decoration:none;">Book Care</a>
</div>

<!-- HERO -->
<section class="legal-hero" style="padding:170px 56px 56px;background:linear-gradient(160deg, #F7F2EB 0%, #EEE5D8 55%, #E8DDD0 100%);">
  <div style="max-width:760px;margin:0 auto;">
    <p style="font-family:'Inter',sans-serif;font-size:0.6875rem;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--navy);opacity:0.65;margin-bottom:14px;">Legal</p>
    <h1 class="heading-display" style="font-size:clamp(2.1rem,5vw,3rem);font-weight:300;color:var(--ink);margin-bottom:16px;">${title}</h1>
    <p class="body-text" style="font-size:1rem;color:var(--ink-mid);max-width:560px;">${blurb}</p>
    ${lastUpdated ? `<p style="font-family:'Inter',sans-serif;font-size:0.8125rem;color:var(--ink-muted);margin-top:20px;">Last updated ${lastUpdated}</p>` : ''}
  </div>
</section>

<!-- DOCUMENT -->
<main class="legal-main" style="padding:56px 56px 110px;">
  <div class="legal-body" style="margin:0 auto;">
${body}
    <div style="margin-top:56px;padding-top:28px;border-top:1px solid rgba(27,56,114,0.12);">
      <p style="font-family:'Inter',sans-serif;font-size:0.875rem;color:var(--ink-muted);line-height:1.8;">
        Questions about this document? Email <a href="mailto:hello@cleocare.co" style="color:var(--navy);text-decoration:none;border-bottom:1px solid rgba(27,56,114,0.3);">hello@cleocare.co</a>.
        See also our <a href="${title === 'Terms of Service' ? 'privacy.html' : 'terms.html'}" style="color:var(--navy);text-decoration:none;border-bottom:1px solid rgba(27,56,114,0.3);">${title === 'Terms of Service' ? 'Privacy Policy' : 'Terms of Service'}</a>.
      </p>
    </div>
  </div>
</main>

<footer style="background:#070F1E;padding:80px 56px 44px;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="padding-bottom:64px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-family:'Spectral',serif;font-size:1.625rem;font-weight:400;color:rgba(255,255,255,0.9);letter-spacing:-0.01em;display:block;margin-bottom:20px;">Cleo</span>
      <p class="body-text" style="font-size:0.875rem;color:rgba(255,255,255,0.38);max-width:260px;line-height:1.7;">Maternal care, reimagined.</p>
      <a href="mailto:hello@cleocare.co" style="font-family:'Spectral',serif;font-size:0.875rem;color:rgba(255,255,255,0.55);text-decoration:none;display:inline-block;margin-top:16px;transition:color 0.15s ease;" onmouseover="this.style.color='rgba(255,255,255,0.9)'" onmouseout="this.style.color='rgba(255,255,255,0.55)'">hello@cleocare.co</a>
    </div>
    <div id="legal-footer-bottom" style="display:flex;align-items:center;justify-content:space-between;padding-top:36px;gap:20px;flex-wrap:wrap;">
      <p class="body-text" style="font-size:0.8125rem;color:rgba(255,255,255,0.22);">© 2026 Cleo Care, LLC. All rights reserved.</p>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
        <a href="terms.html" class="body-text" style="font-size:0.8125rem;color:rgba(255,255,255,0.4);text-decoration:none;transition:color 0.15s ease;" onmouseover="this.style.color='rgba(255,255,255,0.9)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Terms</a>
        <a href="privacy.html" class="body-text" style="font-size:0.8125rem;color:rgba(255,255,255,0.4);text-decoration:none;transition:color 0.15s ease;" onmouseover="this.style.color='rgba(255,255,255,0.9)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Privacy</a>
        <a href="https://www.instagram.com/cleo.care.co" target="_blank" rel="noopener" class="body-text" style="font-size:0.8125rem;color:rgba(255,255,255,0.4);text-decoration:none;transition:color 0.15s ease;" onmouseover="this.style.color='rgba(255,255,255,0.9)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">@cleo.care.co</a>
        <a href="https://substack.com/@cleocare" target="_blank" rel="noopener" class="body-text" style="font-size:0.8125rem;color:rgba(255,255,255,0.4);text-decoration:none;transition:color 0.15s ease;" onmouseover="this.style.color='rgba(255,255,255,0.9)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Substack</a>
      </div>
    </div>
  </div>
</footer>

<script>
  function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('hamburger');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  }
</script>
</body>
</html>
`;

for (const doc of DOCS) {
  const { html, lastUpdated } = convertDocx(doc.src);
  writeFileSync(doc.out, page({ ...doc, lastUpdated, body: addAnchors(html) }));
  console.log(`wrote ${doc.out}  (last updated: ${lastUpdated || 'n/a'})`);
}
