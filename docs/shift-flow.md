# Guided shift workflow

This document records the first navigation/tour iteration. The current CRUD and explicit shift lifecycle supersedes its four-stage model: see [Worker CRUD and shift lifecycle](crud-shift-flow.md).

Baseline:039d86e. User requests clearer flow and Driver.js guidance, retaining the accepted Summon UI. Source of truth for writes remains lib/store.tsx and access.ts.

Problem: static Next buttons invite moving on before work is ready. Instruction sharing, foreman acknowledgment, actual reporting and HSE verification are different events owned by different roles. The old dashboard tour explains chrome rather than the operational handoff.

Decision: present four stages (prepare data, approve plans, run shift, verify/report), a role-aware next action or waiting state, and explicit handoff. Keep records and permission checks intact. A guided tour only navigates and explains; it never approves, sends, changes roles or submits work automatically.

| Event | Actor | Evidence | Next owner |
| --- | --- | --- | --- |
| Prepare workers, attendance and WBGT | Data officer / HSE | Scoped records for selected date | HSE |
| Confirm adaptation and approve a plan version | HSE | Current version approval | HSE shares instructions |
| Record manual sharing | HSE | Current approved plan set in delivery record | Assigned foreman |
| Acknowledge | Assigned foreman | Current instruction acknowledged | Foreman reports actual minutes |
| Report | Assigned foreman | TINDAKAN_DILAPORKAN | HSE |
| Verify or return unfinished | HSE | TERVERIFIKASI / BELUM_SELESAI | Shift report / foreman |

Cases: partial approvals remain distinct; stale/failed deliveries do not become ready; another crew's work is not counted; missing readings remain missing; reported minutes do not become verified exposure. Demo role switching requires an explicit click.

Verification: unit selectors for actionable vs waiting states and current-version scope; browser role flow and cross-route Driver.js next/back/close, interrupted route or role change, keyboard close, no data mutations by guide, dark/mobile/desktop, reduced motion.

Contribution target: rafaelrnzo/terma. Preserve the original source history and submit changes on a review branch; no production deployment is part of this change.

## Verified behavior (2026-10-31)

- 93 domain tests/13 files passed. TypeScript passed. ESLint has zero errors and the same eight upstream Bklit warnings.
- HSE walkthrough traversed eight real routes including worker review, with 31 visible stops; the persisted workspace was byte-for-byte unchanged after the tour.
- Foreman tour stays on instructions/execution. Next/previous within a page, previous across a cached route, and keyboard Escape were exercised. Back navigation tears down the old driver synchronously so it cannot remove a newly opened popover. Navigation initiated by the guide is distinguished from manual navigation; role/date changes end the current session.
- A real browser demo handoff submitted45reported minutes as Budi and verified45minutes as Ratna for DEMO003. Result was checked in the persisted state, then the isolated browser fixture was restored.
- Eighteen combinations of /ringkasan, /panduan and /instruksi in light/dark at1440/820/390px showed no document overflow. Mobile/dark Driver.js was inspected after its animation settled. Reduced-motion launch and Escape worked.
- A hydration warning in an early screenshot run was caused by Playwright temporarily adding a caret-color inline style before hydration completed. Later screenshots wait for the ready guide anchor and use caret:initial; do not suppress hydration validation in product code.



Production build passed after the final flow changes. Preview remains http://localhost:3026/ringkasan . The walkthrough was extended in the existing installed Driver.js dependency; no new dependency was required for the flow work.

Production-preview smoke passed for HSE verification navigation, page help, foreman journey, Escape, reload and mobile overflow. A fresh browser captured zero runtime or console errors.
