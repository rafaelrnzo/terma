# Worker CRUD and an explicit shift lifecycle

Baseline:1f27dc3. The app had no manual worker CRUD, no shift creation/deletion, and no close action. It auto-opened a populated scenario midway through work. Navigation and tours could not make these missing operations discoverable.

Contract: manage workers -> create a dated draft with selected workers -> prepare assignments/adaptation/readings -> approve current plan versions -> publish -> foreman acknowledges and reports -> HSE verifies -> close and read the report. One location and one shift per calendar date remain the prototype boundary.

Owners: split the existing store by state, CSV import, plan calculation, reducer and React provider before extending it. Keep its public exports for existing callers. New management mutations live at the reducer boundary with role checks and input validation. Persist in the existing browser workspace; do not add a backend or pretend that local roles are production authentication.

Master workers and each shift's participants/assignments are different records. Each shift captures its own workspace so master edits do not rewrite issued plans or closed history. A draft can be edited or deleted before approvals/actions exist. Used workers can be archived; hard deletion requires no shift/history references. Closed shifts are read-only. Opening a report is not closure; a dedicated HSE close command requires all current plans approved and all current actions verified. Multiple actions per plan must not prevent legitimate closure.

Existing saved data is retained as a legacy shift. A fresh workspace starts empty. The sample loader and demo/simulation copy have been removed from the application interface. Source provenance on existing records is preserved. No browser records are silently erased.

Navigation: Shift kerja is the primary entry point. Data pekerja contains the manual forms and optional bulk import. Each `/shift/[id]` has five tasks: participant preparation, WBGT readings, approval/publication, execution/reporting, verification/closure. Operational pages link back to the opened shift. Without an opened shift, operational pages ask the user to select one; draft shifts cannot enter instruction/execution pages. Analytics remains available separately with the existing Bklit charts.

Publication and closure are explicit commands with visible prerequisites. Returning an action as BELUM_SELESAI permits the foreman to correct the same report, removes the previous verification result, and requires HSE review again. Closed operational data is immutable, while master edits and opening/creating a different shift remain available.

Production readiness is not inferred from copy changes. Persistence is still browser-local, role selection is still client-side, and sensor/clinical integrations are not connected. Those limitations are documented under connection/storage information rather than repeated banners across operational screens.

Acceptance: create/edit/delete unused workers; archive a referenced worker without changing a shift snapshot; create/edit/delete a draft; duplicate/date/empty/role validation; publish requires current approvals; close rejects incomplete work; closed writes rejected; switch/reload retains snapshots and master catalogue; complete one shift from an empty browser through actual UI and inspect its final report. Keep Phosphor, Summon tokens and Driver.js, but attach guidance to these real operations.

## Verified 2026-10-31

- 111 tests across 14 files pass. Production build and type checking pass. Lint has zero errors and the same eight pre-existing Bklit vendor warnings.
- An isolated browser started empty: manually created/edited/deleted workers, created/published a shift, recorded sharing and foreman acknowledgement, submitted 90 minutes and verified 85, then explicitly closed. CLOSED and final report survived reload.
- Edited/archived/restored the master worker after closure. The closed shift retained its original name/assignment. A second draft was created, edited and deleted; master and closed history remained intact.
- Final build: a new worker defaulted to PEKERJA_BARU even with today's roster present, producing a 96-minute adaptation plan. Report was returned as BELUM_SELESAI, corrected to 85 reported minutes, verified at 80, and the second shift closed. Both closed snapshots persisted.
- Twelve light/dark and 1440/390px checks across shift list, workers, and analytics had no document overflow and no demo/simulation interface copy. Phosphor, Summon and Bklit retained. Browser console: zero errors/warnings.
- Driver.js on the new shift list supported next/close; persisted records were byte-for-byte unchanged. Existing role and cross-route walkthrough implementation is preserved.

No production deployment or backend/authentication integration was performed.
