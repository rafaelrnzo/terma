# TERMA instrument bench

Figure tier: one isometric equipment bench with three field devices and a gateway. The equipment works through a shared deterministic local telemetry adapter; the interface uses ordinary device terminology, as explicitly requested. Generated Station readings retain REPLAY provenance internally and never replace manually entered observations or modify a closed shift. Physical hardware and cloud ingestion are not connected.

Concept: a WBGT mast, RFID water point, upper-arm band and gateway sit on a service bench. Station LEDs follow packet updates, the water reader responds to a tap, and the band LED follows the same heart-rate value as its readout. Device selection zooms to the actual instrument. No diagram boxes, floating labels or arrows inside the drawing.

Parts list before geometry:
- Bench: base, four feet, inset border, four corner fasteners.
- Station: mounting foot, mounting flange, mast, collar, globe stem, black globe, shield core, six louver discs, louver cap, controller enclosure, lid, screen, two buttons, status lamp, solar bracket, panel, six photovoltaic inlays, antenna foot, antenna rod.
- Water point: cabinet, lid, base trim, reservoir seat, reservoir wall, neck, nozzle support, nozzle, drip shelf, drip insert, four drip slots, reader base, reader face, scan target, status lamp, card, two card inlays.
- Band: lower support, rolled cuff, upper sensor housing, lens bezel, optical window, indicator, button, three contact studs, six strap seams.
- Gateway: feet, enclosure, lid, antenna bosses, two antennas, six vent slots, three indicator lights, port recess.

Use the installed MIT Anatomy kit from wheresryan22/anatomy. Only build tooling is vendored; generated SVG art is server-rendered and geometry/audit code does not enter the client bundle. Four-tone surfaces adapt to Summon light/dark. Animation uses refs, pauses offscreen/hidden and respects reduced motion. Controls remain keyboard-operable. No community publishing is part of this task.

## Implementation and boundaries

- `/perangkat` uses a server-built Anatomy SVG and a small client interaction layer. Controls select the station, water point, band or gateway and ease the camera to that physical instrument. Active blue LEDs, RF rings and the readout share `device-telemetry.ts`. Pointer-independent native buttons provide keyboard operation.
- A deterministic local adapter supplies WBGT, air temperature, RH, RFID visit count, heart rate, skin temperature, battery and packet sequence. There is no physical device transport, cloud ingestion, hydration-volume measurement or clinical inference. UI labels use normal device terminology, as requested; adapter identity and recorded reading provenance remain available internally.
- `Ambil bacaan perangkat` fills missing zone/interval records and checkpoints them into the selected shift. Existing manual readings are retained; re-ingestion is idempotent. HSE/data permission and closed-shift guards still apply. New readings recompute versioned plans and require fresh approval when outputs change.
- Animation pauses when offscreen/hidden, supports an explicit pause and uses one rest frame under reduced motion. Metrics update every five seconds, not on every animation frame.

## Verification

116 domain tests across 15 files pass, including generated reading provenance, unique interval identities, gap filling, idempotency, manual preservation, role/closed guards, and plan reapproval. Browser UI created a worker/draft, ingested 24 readings and re-ingested without duplication. Readings and provenance persisted in the draft snapshot. Device selection, RFID taps, pause, reduced-motion camera, and Driver.js next/close were exercised. Desktop and mobile in both themes have no document overflow or mock/demo/simulation copy in the route.

Anatomy audit passes with 103 solids, zero unsupported/sunk solids, and zero depth errors. Line-end checks report zero floating ends. The figure and joints were visually reviewed at 1× and 4×. No WebGL shader, external device connection or community gallery publication was introduced.

Final production build passes with zero type/lint errors (the same eight upstream Bklit lint warnings). A fresh production browser has zero console errors/warnings. The Band LED changed across five sampled animation values; RFID taps updated the readout, zone selection changed the Station reading, pause/reduced motion settled, and the final mobile view had no overflow. Driver.js next/Escape worked on the device guide. Final screenshots are retained locally under `web/output/playwright/terma-iot-final-*.png` (ignored).

## Visible activity and motion controls

The first rendering relied on small LED/RF changes that were easy to miss. It also showed a pause control while a reduced-motion preference had already stopped the scene; the final QA browser had been left with that emulated preference enabled. The active preview is now restored to normal motion after verification.

The instrument overlay adds five visible packets travelling between the Station, RFID point, Band and gateway; a projected RFID sweep across the real card plane; a Station LCD bar; and rolling pulse traces on the Band display and readouts. Receiver/heartbeat halos share the telemetry clock. Auto RFID scans complete after two seconds and recur every twelve seconds; the same completion adds the visit to the model, while manual taps trigger their own scan immediately. Solid geometry remains unchanged and its 103-solid audit still passes.

Reduced motion stays still by default and is labelled Gerakan dikurangi. An explicit Aktifkan animasi button enables this figure's movement, after which Jeda/Lanjutkan works normally. A subsequent system preference change reapplies the preference. Offscreen/hidden work remains stopped; updates use refs rather than React renders each frame.

Verification: 120 tests/16 files pass, including packet endpoints, RFID/model timing, manual scan triggering and pulse periodicity. Browser sampled 24 distinct packet positions, trace paths and scan positions; reduced motion and pause yielded one stable position, while explicit opt-in yielded 15 moving positions. Large Band trace renders on selection, mobile has no overflow, and the preview is restored to no-preference motion after the test.

Final motion build/type checks pass, with no lint errors and the same eight upstream Bklit warnings. Production browser sampled 20 moving packet positions, manual scan opacity was visible, normal motion was restored, and console errors/warnings were zero. The Anatomy line-end check remains zero floating ends.
