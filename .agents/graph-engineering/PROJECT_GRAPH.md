# TERMA project graph

Inspected upstream: `rafaelrnzo/terma`, main `bfd7b31` (2026-10-31).

| Owner | Source | Depends on |
| --- | --- | --- |
| App layout and persistent chrome | web/src/app/layout.tsx, components/app-shell.tsx | AppProvider, navigation, UI primitives |
| Demo workspace and permissions | web/src/lib/store.tsx, access.ts | seed-data.ts, rules.ts, types.ts |
| Versioned heat plans and verification | web/src/lib/rules.ts, workflow.ts | config.ts, workspace records |
| Bklit chart composition | web/src/components/wbgt-chart.tsx, heat-trend.tsx, acclimatisation-chart.tsx | heat-series.ts, vendored components/charts |
| Monthly exposure review | web/src/lib/exposure-review.ts, app/kesehatan/page.tsx | verified actions, versioned plans, scoped workers |
| Zone observations | web/src/lib/overview.ts | scoped workers, measured/replay/forecast quality |
| Presentation | web/src/app/globals.css, components/ui | app-owned theme and motion tokens |
| Verification | web/package.json | npm test, npm run lint, npx tsc --noEmit, browser smoke |

Task: inspect source + proposal -> Summon theme / Bklit installation -> dashboard + proposal surfaces -> type/lint/domain tests -> responsive browser check -> personal repository copy.

Keep writes to the existing reducer and clinical information sequential. The app is a local demo without a backend, identity provider, live telemetry or trained AI. No production deployment is authorized. Use only verified Raya46 credentials for repository operations.
