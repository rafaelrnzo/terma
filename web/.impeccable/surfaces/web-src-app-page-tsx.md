---
version: 1
slug: "web-src-app-page-tsx"
primary_target: "web/src/app/page.tsx"
related_targets: ["web/src/components/app-shell.tsx","web/src/app/globals.css"]
---

# Reference-led application redesign

Scope: app shell, dashboard and all operational routes. Mode: Operate. User confirmed the combined reference direction with “lanjut”. Code-led; supplied screenshots are style references, not literal medical/warehouse content to reproduce.

## Direction contract

THESIS: TERMA is a spatial overview of work-zone exposure with an adjacent decision queue, not a stack of equally weighted cards.

OWN-WORLD: cool mist ground, translucent-white-looking solid panels, light Manrope headings, restrained green/lime and pale blue data fields, soft 12–20px corners. White space and tonal depth replace heavy outlines. Semantic danger labels remain legible.

STORY: choose an interval and zone, read its WBGT and source quality, inspect workers requiring action, then continue the real HSE workflow.

FIRST VIEWPORT: top tab navigation and compact date/user controls; location title and inline operational counts; broad zone schematic in the center, zone list to its left, gradient data summary to its right. Below: measured WBGT chart and review queue. Mobile linearizes controls, zones, selected detail, then chart and queue without page overflow.

FORM: user-pinned blend of warehouse reference 1 structure and Neka reference 2 light typography/gradient panels, overriding assigned index 4. seed:26590d835a967713. No alternative direction round: user has already supplied and approved the references.

SIGNATURE: selecting a zone or hour updates its schematic selection, WBGT, source badge, and plotted hourly series; missing values are gaps, never zero. Geometry is explicitly a schematic, not a site map. Motion is one short selection transition, disabled under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
