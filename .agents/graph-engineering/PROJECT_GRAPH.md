# TERMA project graph

Inspected upstream: `rafaelrnzo/terma`, merged motion contribution `82e1308` (2026-10-31).

| Owner | Source | Depends on |
| --- | --- | --- |
| Focused shift workflow and walkthrough | web/src/lib/shift-task-flow.ts, guide-content.ts, components/shift-workspace.tsx, shift-navigator.tsx, workflow-guide.tsx | scoped plans/actions, workflow.ts, inline task components, Driver.js |
| Inline operational forms | web/src/components/shift-participants.tsx, shift-plan-review.tsx, shift-instructions.tsx, shift-execution.tsx | shared worker-adaptation.tsx, rencana-card.tsx, action-dialogs.tsx, existing reducer guards |
| Shift sensor task and monitoring return | web/src/components/shift-sensor-task.tsx, device-workflow-context.tsx | server-built focused IotFigure, explicit device ingestion, selected shift |
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

IoT extension: /perangkat now renders a 103-solid Anatomy instrument bench with Station/RFID/Band/gateway readouts, selection zoom and controls. A LOCAL adapter supplies presentation telemetry. The explicit reading action fills only missing intervals and preserves manual/closed data. Geometry audit and line-end checks pass; developer provenance in docs/anatomy-provenance.md and behavior in docs/iot-visualization.md.

Motion ownership: figures/terma/instrument-motion.ts supplies pure activity paths; paint-activity.ts applies them to ref-owned SVG overlays. use-instrument-loop.ts owns one visible/hidden/reduced/paused clock and explicit opt-in. The RFID visit and scanner completion share device-telemetry.ts constants. Browser fixtures must restore reduced-motion emulation after testing.

Focused flow: /shift/[id] is one operational surface with six tasks and explicit next controls. Page client opens the requested snapshot before mounting, and role changes remount at that user’s pending task. Task completeness derives from canonical workflow/scoped records; no new write path or automatic role change. Monitoring /perangkat returns to the selected shift. Shared adaptation/report/verification forms serve both inline tasks and existing detail routes. See docs/focused-shift-flow.md for acceptance evidence.
