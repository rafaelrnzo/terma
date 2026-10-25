---
version: 1
slug: "web-src-app-ringkasan-page-tsx"
primary_target: "web/src/app/ringkasan/page.tsx"
related_targets: ["web/src/components/app-shell.tsx", "web/src/components/zone-map.tsx", "web/src/components/zone-overview.tsx", "web/src/components/heat-monitor.tsx", "web/src/components/dashboard-tour.tsx"]
---

# Dashboard workspace

Mode: Operate. Current approved contract: PlanetScale refinement, 25 October 2026. Scope: `/ringkasan`, shared operational shell and components, zone scheme, and optional onboarding. This contract supersedes the earlier sidebar/font/palette instructions for this surface. User direction: “Tetap biru, fokus layout PlanetScale”. Landing composition and assets remain; shared fonts and tokens also apply there.

## Direction contract

THESIS: HSE can find today's task, choose a zone and interval, inspect its reading, and continue the authorized workflow within a precise, quiet layout guided by the supplied PlanetScale screenshots.

OWN-WORLD: Preserve TERMA's blue action accent and data semantics. White canvas, pale neutral sidebar, solid pale panels, fine gray borders, 6–12px shared corner scale, and Plus Jakarta Sans throughout. Zone colors identify areas, never safety status. Watermelon accents are not part of this approved refinement.

STORY: Choose role/date, find the next task, inspect zone conditions, then act. Keep simulation provenance, replay sources, missing readings, approval requirements, and role scope visible.

FIRST VIEWPORT: A 216px light sidebar, compact breadcrumb and role/date toolbar, 26px title and tour action, bordered task strip, three zone selectors, and segmented interval control. The isometric scheme sits beside a 280px white bordered readout; the heat-history accordion is open by default below. At 1024–1199px the map/readout stack; below 768px the surface stacks and zone choices scroll horizontally. Smaller screens use the existing focus-managed navigation drawer.

FORM: User-pinned refinement; code-led, no concept roll. Selecting a zone from the list or scheme updates reading and chart while preserving interval. SVG platforms lift 3px on hover and 9px on selection over 240ms with cubic-bezier(.16, 1, .3, 1). Reduced motion removes the transition; labels, checkmark, borders, and selected geometry still convey state. The diagram is fictional geometry, not a geographic site rendering. Chart width follows its container while text remains 12px; mobile retains a 540px minimum and an accessible scroll region.

FINISH: Final source was inspected at desktop and mobile sizes, including shared components and landing. Independent render review found no material visual defect; stale documentation was the remaining fix. Existing 74 tests, production build, and browser functional/responsive checks passed in the parent implementation pass. Shared tokens and component patterns are recorded in `DESIGN.md` and `.impeccable/design.json`. Review captures: `.impeccable/review/{desktop,mobile,components,landing}.png`.

Seed: none; user-pinned PlanetScale reference and explicit blue preference.

## Preserved behavior

Mapbox is lazy-loaded only with a public token and explicit selection. Coordinates are fictional; missing token, failed load, or unsupported WebGL retain the accessible scheme. No geolocation or worker tracking is requested.

The six-step dashboard tour is optional, skippable, and replayable. Reduced motion is respected and closing restores trigger focus. Zone selection, reading quality, and origin remain separate from action status. Missing measurements stay missing, never zero. Rules, permissions, records, approvals, and demo data are unchanged by this refinement.
