# Daily HSE usability simplification

Scope: entry to existing simulation and daily HSE work. The user's feedback rejects the last iteration as confusing, with too many logo/icon elements, and asks for a landing page explaining the whole product. Their confirmed primary use is daily HSE simulation, not public marketing. All data remains mock. A new logo is pending from their teammate; do not invent it.

## Landing information extension · 25 October 2026

Latest request: expand the existing landing page to explain the whole application. Surface mode: Persuade, with informational depth and an invitation to try the existing demo. Preserve the approved hero, text wordmark, Atmosphere tokens, and operational workspace. Extend below the hero with three user roles, seven linked capabilities grouped into preparation/planning/follow-up, an explicitly illustrative plan-information example, visible simulation limits, FAQ, and a final entry link. In-page navigation makes the longer page scannable. No testimonials, promised outcomes, new integrations, or production-readiness claims. Code-led extension; no new visual-world or composition tournament. The new information depth supersedes the earlier short-entry-only scope; daily-work pages are unchanged.

## Direction contract

### Landing motion refinement

User asks for a more appealing visual with animation, preserving the informational landing. Focal moment: a bounded HSE → mandor → HSE handoff showing which illustrative output passes between roles. Autoplay once for 4.2 seconds while visible, with pause/replay and manual stage selection; never change application data. Continuity: a reading-progress line and current in-page section identify position in the long landing. Feedback: directional arrow, control tint, and connector transitions respond to input. Budget: CSS and one small client component, no animation dependency, no infinite loops or pointer-tracking effects; the plan example receives one short entrance when encountered, not every section. All content is visible before scripts; reduced motion removes autoplay/spatial effects, retaining immediate selection and color feedback. Offscreen or hidden-document playback stops. This is animate/polish, not a replacement visual world.

Implementation uses two small client components: handoff playback and progressive reading/entrance enhancement. Motion/polish inspection covered 390/1024/1440 rendered captures and all three handoff states. Automated checks at 320/390/768/1024/1440 passed autoplay completion, pause/replay, manual and keyboard selection, offscreen stop, preference changes, reduced-motion load, unchanged demo data, existing anchors/FAQ/entry destinations, and static content without JavaScript. The changed-target detector returned no findings. Global palette, fonts, tokens, and operational pages are unchanged.

THESIS: Understand TERMA before entering, then see what needs doing today. Remove repeated explanation and competing controls rather than add more context panels.

OWN-WORLD: Preserve Atmosphere type, mist ground, restrained green and existing components. Use the existing text wordmark without the thermometer emblem; icons only where they identify a control.

STORY: A short entry at / explains the HSE–mandor–HSE handoff. A single entry action leads to /ringkasan. The daily workspace prioritizes unfinished work; the zone monitor remains available on demand.

FIRST VIEWPORT: Entry: simple brand/header, plain-language purpose, one entry CTA, three-stage handoff example, explicit demo note. Workspace: five grouped top-level navigation items, date/peran, compact simulation note, daily heading and actionable priority queue. Interior headers show one sentence and a compact progress line, not three columns of repeated context.

FORM: Code-led onboarding extension of pinned Atmosphere (inherited seed:26590d835a967713), not a new visual identity or an open marketing page. Seven operational routes remain under five task groups. Plan lists lead to individual worker detail; decision facts and safety warnings remain in that detail.

SIGNATURE: From an unfinished daily task directly into the corresponding work; record rows lead to focused details instead of displaying every calculation at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Recorded implementation and review

The implementation follows the approved entry at `/`, daily work at `/ringkasan`, five navigation groups from `web/src/lib/navigation.ts`, compact step context, text-only wordmark, and worker plan rows linking to `/pekerja/{kode}#rencana`. The zone monitor is available within a collapsed accordion beneath daily work. Search and help remain header utilities. All data remains simulated.

The independent finish review used the degraded reviewer contract because the shipped agent definition was unavailable. It found no material control or layout issue in the nine required captures and sampled source; its sole requested fix was persistence of the approved changes. `DESIGN.md`, `.impeccable/design.json`, and `PRODUCT.md` now record the shipped structure. All existing frontmatter tokens, palette, fonts, and sidecar token extensions are preserved. The reviewer scored this documentation fix resolved with disposition `ship`; that verdict is scoped to the documentation fix.

Verification: lint, production build, and 73 unit tests passed. Isolated Chromium smoke tests covered 12 routes, 27 internal URLs (including plan anchors), and 49 viewport checks from 320px to 1440px, including the local HSE–mandor–verification flow, with zero runtime errors. The changed-target detector returned no findings. No shipping raster assets were added.

## Landing extension finish evidence

The fresh landing review returned `ship` with no material fixes. Its required 1440px, 1024px, and 390px captures are retained in `.impeccable/review/landing-information/`, covering the hero, roles, workflow, illustrative plan, visible limits, open FAQ, and full page. The dedicated landing browser check passed at five widths from 320px to 1440px: three roles, seven linked steps, five FAQ items, eleven distinct internal destinations, keyboard skip navigation, static content with JavaScript disabled, and zero runtime errors. Lint, 73 unit tests, production build, and the whole-application check of 12 routes, 27 URLs, and 49 viewport checks passed. The changed-target detector ran once with `[]`. No new shipping raster assets require provenance.

The documenter used `reference/degraded/documenter.md` because the shipped documenter definition was unavailable. Source comparison covered `web/src/app/page.tsx`, the root and landing rules in `web/src/app/globals.css`, `DESIGN.md`, and `.impeccable/design.json`. The extension retains the mist background, forest-green actions, Manrope headings, Inter body text, blue/green panel gradients, shared Button/StatusChip/QualityBadge/Accordion primitives, separate decision and source-quality labels, and tonal depth without new shadows. The established 1360px landing container and 48px desktop / 20px mobile gutters remain; the new role, workflow, example, limits, and FAQ compositions stack below 768px. Local section headings use a 26–36px fluid scale and 20px group headings; these are surface composition choices, not new global typography tokens.

The design tokens and `.impeccable/design.json` are preserved without regeneration. The documenter identified one composition-description mismatch caused by this extension: the entry now has three workspace links rather than two. The completing agent updated only that Layout sentence in `DESIGN.md` to identify header, hero, and closing links, all verified in source as pointing to `/ringkasan`. The expanded content and in-page navigation are recorded in this surface brief. No defect or unrelated drift was promoted into the design system, and no UI or operational code was changed by the documentation pass.
