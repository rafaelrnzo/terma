---
version: 1
slug: "web-src-app-ringkasan-page-tsx"
primary_target: "web/src/app/ringkasan/page.tsx"
related_targets: ["web/src/components/app-shell.tsx","web/src/components/zone-map.tsx","web/src/components/dashboard-tour.tsx"]
---

# Dashboard workspace

Mode: Operate. Scope: `/ringkasan`, operational shell, zone map and optional onboarding. Approved by the user: keep the landing page, add sidebar, expose zone map, and add a skippable/replayable Driver.js tour. No Mapbox token is available; the default is a fully usable simulated zone scheme.

## Direction contract

THESIS: HSE can locate a zone, inspect the selected interval, and continue today's task without hunting inside an accordion. Avoid a dashboard of disconnected decorative metrics.

OWN-WORLD: Preserve Atmosphere's mist ground, forest-green controls, Manrope headings and Inter labels. Zone colors identify areas, never safety status. A quiet solid sidebar anchors the workspace.

STORY: Choose role/date, inspect zone conditions, continue the next authorized action. Keep demo provenance and missing readings visible. Landing and rule calculations remain unchanged.

FIRST VIEWPORT: A 224px desktop sidebar, compact role/date header, title and tour action, followed by a wide interactive zone canvas and selected-zone readout. The next task sits above the canvas as a compact action strip. Smaller screens use a focus-managed navigation drawer and stacked map/readout. Details and hourly history follow below.

FORM: User-pinned extension of the existing surface; no concept roll. Code-led. Signature interaction: selecting the same zone from the map or list updates the WBGT reading and history, preserving interval. Motion is restrained; tour respects reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Mapbox is lazy-loaded only with a public token and explicit map selection. Coordinates are fictional demo geometry, not a project location. Missing token, failed load, or unsupported WebGL retain the accessible scheme. No geolocation is requested.
