# TERMA project graph

## Current IoT ownership (source ec0bdb7, inspected 2026-11-10)

For device transport and persistence, this section supersedes the historical browser-local entries below.

- Firmware `firmware/*/terma_net.h` posts to the IP/mDNS host, port and key compiled from each sketch's ignored `secrets.h`.
- Companion `/Users/muhammadrayaarrizki/projects/proj-go/terma-iot` at `64e9f9c` owns authenticated POST ingestion, JSONL history and SSE heartbeat/replay. Local port 3028; Compose publishes VPS port 8080.
- `web/src/instrumentation.ts` starts `lib/server/iot-bridge.ts`, which ingests authenticated backend events into the file-backed shared workspace. `TERMA_IOT_URL` and `TERMA_IOT_KEY` are server configuration.
- `app/api/iot/stream/route.ts` owns signed-in browser SSE and Band redaction. It emits an initial comment and forwards upstream heartbeat comments, including when no device readings exist. `lib/iot-client.ts` owns EventSource.
- `web/next.config.ts` proxies API requests for `www.terma-app.id` to the configured VPS origin; `deploy/compose.yml` owns the web-to-IoT Docker address. A healthy web login alone does not prove device delivery.
- Observed VPS runtime on 2026-11-10: `terma-web.service` at 127.0.0.1:3000, `terma-iot.service` at port 8080, Caddy on HTTPS; Docker is not installed. The running web uses `TERMA_IOT_URL=http://127.0.0.1:8080`, and its key matches the running IoT service. Runtime source revision is not established by this configuration check.
- Runtime release owner: `terma-web.service`, user `terma-web`, working directory `/opt/terma-web/current` symlink into `releases`; persistent workspace `/var/lib/terma-web`. `.github/workflows/web-vps.yml` builds a native Linux/Node22 standalone archive in approved GitHub Actions, embeds REVISION and publishes a checksum. Promotion preserves the service environment and data, with the previous symlink target as rollback; no application builds on the Mac or VPS.
- Admin demo access: stream Band values and worker physiology use the existing Admin/Klinik policy. Admin dashboard exposes the existing Band handoff. Device status uses event metadata even when physiological values are redacted. Worker monitoring defaults to saved evidence; illustrations require explicit selection. Actual consent, allocation and wearing period still govern worker attribution.
- `web/src/lib/config.ts` owns the Jakarta operational date and interval epoch. Both use WIB independently of the host timezone, matching the IoT timestamp adapter. `config.test.ts` covers midnight WIB and interval boundaries; run the suite with TZ=UTC for the VPS/CI environment.
- `components/demo-flow.tsx` exposes the Admin's Band-to-Raya guide through `components/band-demo-guide.tsx`; `lib/band-demo-guide.ts` reads canonical consent, allocation, shift, handoff and body-monitoring evidence without mutating records. The guide advances from actual completion and requires fresh AKTUAL readings for RAYA001/BAND-01, with tests for replay, age, ownership and wearing-period boundaries.
- `lib/band-management.ts` separates physical monitoring from work-plan publication: Admin may hand over a consented assigned Band in today's DRAFT shift, without approving/publishing plans. Mandor still requires ACTIVE and crew scope. Admin can return a Band from DRAFT even on a later date; CLOSED and one-wearer guards remain. Shared handoff/return predicates drive worker-table and dashboard actions; guide has five steps and no publication gate.
- Focused verification: Go `go test ./...`; web `vitest run src/lib/server/iot-bridge.test.ts src/lib/iot.test.ts`, TypeScript and scoped ESLint; authenticated idle stream and replay; Safari EventSource.
- Task DAG: source/config inspection -> local services -> compare production auth and firmware destination -> reproduce idle stream -> focused fix -> stream and permission checks. All work is sequential; no delegation needed. Secrets, flashing, commits, pushes and deployment require their applicable authorization.

Inspected upstream: `rafaelrnzo/terma`, merged focused workflow contribution `db4e064` (2026-10-31).

| Owner | Source | Depends on |
| --- | --- | --- |
| Focused shift workflow and walkthrough | web/src/lib/shift-task-flow.ts, guide-content.ts, components/shift-workspace.tsx, shift-navigator.tsx, workflow-guide.tsx | scoped plans/actions, workflow.ts, inline task components, Driver.js |
| Inline operational forms | web/src/components/shift-participants.tsx, shift-plan-review.tsx, shift-instructions.tsx, shift-execution.tsx | shared worker-adaptation.tsx, rencana-card.tsx, action-dialogs.tsx, existing reducer guards |
| Shift sensor task and monitoring return | web/src/components/shift-sensor-task.tsx, device-workflow-context.tsx | server-built focused IotFigure, automatic missing-interval ingestion, selected shift |
| Role entry routing and dashboards | web/src/lib/navigation.ts, components/role-home.tsx, workspace-home.tsx, role-start.tsx, role-task-board.tsx | AppProvider identity, scoped shift flow, /admin, /hse, /mandor |
| Initial-condition check-in and baseline snapshots | web/src/lib/worker-readiness.ts, components/shift-health-review.tsx, app/kiosk, app/kesehatan-awal | management records, reducer permissions, draft approval guards, validation |
| Forecast map and native periods | web/src/lib/forecast.ts, app/forecasting/page.tsx, components/zone-map.tsx | BMKG JSON, Leaflet/OpenStreetMap, shared relative geometry |
| Shift monitoring | web/src/app/monitoring/page.tsx | scoped task flow, HeatMonitor, selected shift |
| App layout and persistent chrome | web/src/app/layout.tsx, components/app-shell.tsx | AppProvider, navigation, UI primitives |
| Worker catalogue and shift snapshots | web/src/lib/worker-management.ts, shift-management.ts, management-state.ts | store-state.ts, access.ts, workflow.ts |
| Browser persistence and reducer boundary | web/src/lib/store.tsx, store-reducer.ts, management-validation.ts | store-imports.ts, store-plans.ts, shift-action-validation.ts |
| Versioned heat plans and verification | web/src/lib/rules.ts, workflow.ts | config.ts, workspace records |
| Interactive IoT instrument bench | web/src/components/figures/terma, web/scripts/anatomy | MIT Anatomy kit, device-telemetry.ts, scoped Summon theme, ref-based animation |
| Device reading ingestion | web/src/lib/device-ingestion.ts, components/device-readings-button.tsx | selected shift, existing input permission, REPLAY provenance, recompute/checkpoint |
| Bklit chart composition | web/src/components/wbgt-chart.tsx, heat-trend.tsx, acclimatisation-chart.tsx | heat-series.ts, vendored components/charts |
| Monthly exposure review | web/src/lib/exposure-review.ts, app/kesehatan/page.tsx | verified actions, versioned plans, scoped workers |
| Zone observations | web/src/lib/overview.ts | scoped workers, measured/replay/forecast quality |
| Presentation | web/src/app/globals.css, components/ui | app-owned theme and motion tokens |
| Verification | web/package.json | npm test, npm run lint, npx tsc --noEmit, browser smoke |

Task: inspect source + proposal -> Summon theme / Bklit installation -> dashboard + proposal surfaces -> type/lint/domain tests -> responsive browser check -> contribution branch for rafaelrnzo/terma.

Keep writes to the existing reducer and clinical information sequential. The app persists locally without a backend, identity provider, live telemetry or trained AI. Interface copy uses operational terminology; this is not evidence of those integrations. No production deployment is authorized. Use only verified Raya46 credentials for repository operations. The active contribution target is rafaelrnzo/terma, not a personal repository.

Current flow: catalogue CRUD -> dated DRAFT snapshot -> preparation -> approval -> publish ACTIVE -> sharing/acknowledgement/report -> verification -> explicit CLOSED. Primary surfaces: /ringkasan, /impor, /shift/[id]; analytics separated at /analitik. Closed snapshots cannot be changed by master edits. 124 tests/17 files and production build pass; see docs/crud-shift-flow.md for browser evidence.

IoT extension: /perangkat now renders a 118-solid Anatomy instrument bench with Station/RFID/Band/gateway readouts, selection zoom and controls. A LOCAL adapter supplies presentation telemetry. The explicit reading action fills only missing intervals and preserves manual/closed data. Geometry audit and line-end checks pass; developer provenance in docs/anatomy-provenance.md and behavior in docs/iot-visualization.md.

Motion ownership: figures/terma/instrument-motion.ts supplies pure activity paths; paint-activity.ts applies them to ref-owned SVG overlays. use-instrument-loop.ts owns one visible/hidden/reduced/paused clock and explicit opt-in. The RFID visit and scanner completion share device-telemetry.ts constants. Browser fixtures must restore reduced-motion emulation after testing.

Focused flow: /shift/[id] is one operational surface with six tasks and explicit next controls. Page client opens the requested snapshot before mounting, and role changes remount at that user’s pending task. Task completeness derives from canonical workflow/scoped records; no new write path or automatic role change. Monitoring /perangkat returns to the selected shift. Shared adaptation/report/verification forms serve both inline tasks and existing detail routes. See docs/focused-shift-flow.md for acceptance evidence.

Station anatomy: scripts/anatomy/station-wet-bulb.mjs owns the true sectioned vessel/water/continuous wick geometry; generated-view.ts supplies a tighter wetbulb camera. StationAnatomy/WetBulbInspection explain the mechanism outside the drawing and use the existing ref-based camera loop. Inspection is view state only and never writes operational records.

Connected attendance extension (2026-11-06): `components/kiosk/*` owns camera/card identification and condition questions; `use-kiosk-camera.ts` owns stream cancellation/cleanup, `kiosk-entry.ts` owns saved method labels. `bmkg.ts` validates public JSON; `app/api/weather/route.ts` owns cached server fetching; `use-bmkg-sync.ts` is the single browser refresh owner. `company-data.ts` seeds linked local reference masters only in empty workspaces and preserves existing records. CSV UI removed. `zone-openstreetmap.tsx` owns Leaflet lifecycle/visible OSM tiles/attribution and returns to the scheme on failure. BMKG updates only unapproved DRAFT snapshots; approved/active/closed records stay frozen.
