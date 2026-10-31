# TERMA project graph

Inspected upstream: `rafaelrnzo/terma`, main `bfd7b31` (2026-10-31).

| Owner | Source | Depends on |
| --- | --- | --- |
| Shift navigation and walkthrough | web/src/lib/shift-journey.ts, guide-content.ts, components/shift-navigator.tsx, workflow-guide.tsx | current scoped plans/actions, workflow.ts, Driver.js, Next router |
| App layout and persistent chrome | web/src/app/layout.tsx, components/app-shell.tsx | AppProvider, navigation, UI primitives |
| Worker catalogue and shift snapshots | web/src/lib/worker-management.ts, shift-management.ts, management-state.ts | store-state.ts, access.ts, workflow.ts |
| Browser persistence and reducer boundary | web/src/lib/store.tsx, store-reducer.ts, management-validation.ts | store-imports.ts, store-plans.ts, shift-action-validation.ts |
| Versioned heat plans and verification | web/src/lib/rules.ts, workflow.ts | config.ts, workspace records |
| Bklit chart composition | web/src/components/wbgt-chart.tsx, heat-trend.tsx, acclimatisation-chart.tsx | heat-series.ts, vendored components/charts |
| Monthly exposure review | web/src/lib/exposure-review.ts, app/kesehatan/page.tsx | verified actions, versioned plans, scoped workers |
| Zone observations | web/src/lib/overview.ts | scoped workers, measured/replay/forecast quality |
| Presentation | web/src/app/globals.css, components/ui | app-owned theme and motion tokens |
| Verification | web/package.json | npm test, npm run lint, npx tsc --noEmit, browser smoke |

Task: inspect source + proposal -> Summon theme / Bklit installation -> dashboard + proposal surfaces -> type/lint/domain tests -> responsive browser check -> contribution branch for rafaelrnzo/terma.

Keep writes to the existing reducer and clinical information sequential. The app persists locally without a backend, identity provider, live telemetry or trained AI. Interface copy uses operational terminology; this is not evidence of those integrations. No production deployment is authorized. Use only verified Raya46 credentials for repository operations. The active contribution target is rafaelrnzo/terma, not a personal repository.

Current flow: catalogue CRUD -> dated DRAFT snapshot -> preparation -> approval -> publish ACTIVE -> sharing/acknowledgement/report -> verification -> explicit CLOSED. Primary surfaces: /ringkasan, /impor, /shift/[id]; analytics separated at /analitik. Closed snapshots cannot be changed by master edits. 111 tests/14 files and production build pass; see docs/crud-shift-flow.md for browser evidence.
