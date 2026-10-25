# Daily HSE usability simplification

Scope: entry to existing simulation and daily HSE work. The user's feedback rejects the last iteration as confusing, with too many logo/icon elements, and asks for a landing page explaining the whole product. Their confirmed primary use is daily HSE simulation, not public marketing. All data remains mock. A new logo is pending from their teammate; do not invent it.

## Direction contract

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
