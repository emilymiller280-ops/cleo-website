# CLAUDE.md — cleocare.co (marketing site)

Static HTML site. No framework, no build step for the pages themselves.

## ⚠️ This repo IS the live site
Deployed by **GitHub Pages** from `main`, domain set by `CNAME` → **cleocare.co**.
**A push publishes instantly.** Never push without asking Emily first. Committing locally is fine.

## What is live and what is not
- **Root `*.html` files are the live site.** `index.html`, `faq.html`, `booking.html`, `favorites.html`, `getstarted.html`, `our-story.html`, `gifting.html`, `meal-delivery.html`, `provider-intake.html`, `terms.html`, `privacy.html`, and the rest.
- **`redesign/` is NOT live.** It is the Born ID rebrand, nine pages, staged for the relaunch. It is committed so it is not laptop-only, but GitHub Pages does not serve it.
- `live/`, `_drafts/`, `index.new.html`, `ig-*.html` are scratch. Not served, not authoritative.

## Local preview
```
node serve.mjs          # serves the repo root at http://localhost:3000
```
Pages reference `/brand/brand.css` with an absolute path, so **always preview through the server**, never by opening a `file://` URL. If the server is already running, do not start a second one.

## Brand — Born ID
Tokens live in `brand/brand.css`. Also `brand/nav.css`, `brand/hero.css`, `brand/fonts/`, `brand/img/`.
Palette: Sky, Coral, Burgundy, Blush, Butter, Ivory. Type: Rosevale, Host Grotesk, Palmello.

**Emily's standing rules, all five:**
- No black text
- The main font is never red — red is for accents only
- No white backgrounds
- **No em dashes.** Anywhere, in any copy.
- **Headings are Host Grotesk, regular weight, never bold** (2026-09-28). Rosevale is for the Cleo logo only: nav, homepage CLEO, footer wordmarks. Use `var(--font-logo)` for it, `var(--font-display)` for headings.

## Legal pages are generated, not hand-edited
`terms.html` and `privacy.html` come from counsel's documents via:
```
node build-legal-pages.mjs
```
It resolves counsel's files **by pattern**, not exact filename — a rename used to silently publish a stale version. Editing the HTML by hand gets overwritten on the next build.

## Working in here
- **Another Claude session also edits Emily's repos. Run `git status` first**, and stage your own files explicitly. Never `git add -A`.
- Screenshots go to `screenshots/`, which is gitignored. So is `node_modules/` and `inspo`.
- The git remote embeds a GitHub token in plaintext — it prints on `git remote -v`. Filter it out of any output you show.

## The app is a different repo
`app.cleocare.co` lives in `~/Desktop/cleo-app` (Next.js, Prisma, AWS RDS). Do not mix the two.
