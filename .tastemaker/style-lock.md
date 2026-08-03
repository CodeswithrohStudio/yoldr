# Style lock — Yoldr

Established: 2026-06-19. Source: shipped codebase (already deployed to production) — not regenerated. This lock records the real tokens found in `src/app/globals.css`, `src/app/page.tsx`, and `src/app/app/*` rather than re-deriving a fresh palette, since a live brand already exists and a re-derived palette would drift from what users have seen.

Scope note: this pass covers **logo + favicon only** (Step 1). The rest of this lock records the tokens already governing the shipped site so the mark matches it; it does not re-litigate layout, motion, or structure, which were established in earlier (pre-tastemaker) sessions.

## Palette
- Background: `#000000` (page background, `bg-black`) — app dialogs/sidebar use `#0a0a0a`/`#0b0b0d` as a slightly-lifted variant, treated as the same role.
- Surface: `rgba(255,255,255,0.03)` on black, `border-white/10` (cards/panels — very low-opacity white washes, not a distinct hex)
- Primary / Accent: `#e8702a` (single brand accent — CTAs, active nav state, highlights). No separate primary; accent does both jobs.
- Text primary: `#ffffff` — contrast vs background: 21.0 (WCAG AAA)
- Text muted: `white/60`, `white/45`, `white/35` (opacity steps, not separate hexes)
- Button label color: white on Accent fill — contrast 6.78 (text-safe, from `check_contrast.py`)
- Dark mode: not needed — single mode only, no runtime toggle. The brand *is* dark.

## Color contract
Verified via `scripts/check_contrast.py --matrix text=#ffffff bg=#000000 surface=#0a0a0a primary=#e8702a accent=#e8702a border=#ffffff on-primary=#000000`:

- Text-safe (>=4.5): text/bg, text/on-primary, bg/border, border/on-primary, text/surface, surface/border, bg/primary, bg/accent, primary/on-primary, accent/on-primary, surface/primary, surface/accent
- UI-safe (>=3.0, <4.5): text/primary, text/accent, primary/border, accent/border
- Decorative (<3.0): bg/surface, surface/on-primary, text/border, bg/on-primary, primary/accent

Relevant to the logo: **white shield on black tile** = 21.0 (text-safe). **Orange dot on black tile** = 6.78 (text-safe). Both clear every floor with large margin — safe at any favicon size.

## Typography
- Display/heading + wordmark font: Playfair Display, italic — used for the "Yoldr" wordmark everywhere (landing nav, app sidebar, headings)
- Body/UI font: Inter
- (No re-derivation needed — both already imported in `src/app/globals.css` and used project-wide)

## Assets
- Anchor asset: `design/assets/logo/yoldr-mark.svg` — everything else (favicon, wordmark lockup) matches this
- Asset style: flat geometric mark, 2 colors max (white + accent orange), no gradients/shadows, per `ideagram/references/style-contract.md`'s shape language
- Logo (v2 — current): `design/assets/logo/yoldr-mark.svg` (transparent, in-app use — nav/sidebar on black backgrounds) + `design/assets/logo/yoldr-lockup.svg` (mark + Playfair-italic wordmark) + `design/assets/favicons/yoldr-mark-favicon.svg` (mark on a black rounded-square tile, for browser-chrome legibility on any theme). Source: **constructed (Path A)** — original geometric shapes, no licensing question. Concept: a solid white circle (the vault/principal — whole, anchored, stays home) with a separate accent-orange comet (a tapered trailing path + a head circle) departed with a visible gap and ascending up-and-right, encoding the brand's own tagline directly: *your principal stays home (the circle), your yield goes adventuring (the departed comet)*. 2 grouped shapes, describable in one sentence, tested at 512/32/16px.
- Logo v1 (superseded, do not reuse): a shield silhouette + escaping dot. Rejected by the user as "too common" for a fintech mark — see `.tastemaker/decisions.log`.

## Do not
- Don't reintroduce the old gold/purple/green icon set (`public/icon.png`, `public/favicon.png` pre-rebrand) — those predate the current black/orange/Playfair identity and were replaced by this pass.
- Don't reintroduce a shield/security-badge silhouette for the logo mark — explicitly rejected as too common a fintech cliché; use the vault-circle + comet concept instead.
- Don't add a third color to the mark. White + accent-orange only.
- Don't put a letter ("Y") in a colored box — that's the exact anti-slop failure this mark is designed to avoid.
- Don't place a Next.js App Router convention file (`favicon.ico`, `icon.*`, `apple-icon.*`) directly under `src/app/` — it silently overrides everything in `public/` and the `metadata.icons` config. This exact bug shipped once already (a stale pre-rebrand `src/app/favicon.ico`) and cost a full round-trip to diagnose. Favicons live in `public/` only, referenced via `metadata.icons` in `src/app/layout.tsx`.
