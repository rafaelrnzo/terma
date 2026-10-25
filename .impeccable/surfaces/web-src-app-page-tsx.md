---
version: 1
slug: "web-src-app-page-tsx"
primary_target: "web/src/app/page.tsx"
related_targets: ["web/src/app/globals.css", "web/src/app/layout.tsx", "web/src/components/landing-site.tsx", "web/src/components/landing-handoff.tsx"]
---

# TERMA landing · Cloudflare layout reference

Mode: Persuade. Final implementation uses Open Sans and Roboto Slab, an app-oriented product entry, and the layout hierarchy of https://www.cloudflare.com/. TERMA blue remains the brand accent. The landing owns the composition change; shared typography applies across the app. The reference informs composition and hierarchy only.

## Direction contract

THESIS: Put TERMA's actual HSE workflow in front of the visitor quickly, rather than a long illustrated manual before the first action.

OWN-WORLD: A restrained white product shell, precise blue components from the workspace, and a large inset blue hero panel. Open Sans carries interface text, labels, operational headings, and most landing headings. Roboto Slab appears only on the second hero line and final landing CTA heading.

STORY: Understand that TERMA turns worker and heat data into an HSE-reviewed work-rest plan, enter the demo, then explore three illustrated site areas, role handoff, workflow, example, and limits.

FIRST VIEWPORT: Full-width white header and one dominant blue hero panel with centered promise, short explanation, white primary button, and visible simulation caveat. The next section begins with a centered product explanation and interactive construction-site illustration, echoing the reference's hero-to-product transition.

FORM: User-pinned Cloudflare composition, implemented with TERMA's own copy and blue palette. Signature interactions are three selectable locations in the illustration and the HSE–mandor–HSE handoff. The page continues through three compact workflow cards, a sample plan, demo limits, FAQ, and final CTA. No unsupported benchmark, customer, safety, or health claims.

FINISH: Desktop and mobile review captures are in `.impeccable/review/desktop.png` and `.impeccable/review/mobile.png`; the final narrow hero check is `/tmp/terma-ui-review/first-390-after.png`. The illustration choice, handoff controls, links, accordion, and responsive widths were checked in browser. Source keeps focus treatments, reduced motion handling, and simulation/data provenance language. `DESIGN.md` and `.impeccable/design.json` record the resulting tokens and layout. Lint, 74 tests, and the production build passed in the implementation pass.

Seed: none (user-pinned reference layout).
