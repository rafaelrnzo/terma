# One working surface per shift

Problem: all five task cards and their buttons remained open at once; approvals opened worker profiles, and reporting/instructions required unrelated routes. IoT controls mixed monitoring/playback with saving shift readings. Repeated guidance did not remove those choices.

Decision: one selected shift is the working surface. Six tasks: participants/adaptation -> sensor readings -> plan review/publication -> instruction sharing/acknowledgement -> execution reporting -> verification/closure. Show one task body at a time with actual forms; completed steps remain reviewable, future steps are disabled. The next button appears when the selected task is complete. Role handoffs switch explicitly in place and retain the shift URL.

Reuse the current reducers, scoped selectors, rule functions, RencanaCard and action dialogs. No automatic approval, sending, acknowledgement or role change. Returned reports regress to execution; changed plan inputs still require a new approval. Closed history remains read-only. No new database or identity system is introduced.

IoT: embed the server-built Anatomy instrument at the sensor task in a focused Station view; the workflow owns the reading-save action. The separate device page monitors devices and points back to the selected shift. RFID/Band inspection is optional, not an extra prerequisite for WBGT planning. Keep normal operational copy, animations, Summon and Phosphor.

Acceptance: create a worker/draft, confirm adaptation, ingest/read sensor intervals, review and approve each plan, publish, record sharing, switch to the assigned foreman, acknowledge and report, switch back, return/correct a report, verify and close. Stay on /shift/[id] for all operational actions. Test partial crews and incomplete/stale records, closed snapshots, role permissions, mobile layout, Driver.js and the IoT return path.

## Verified on 31 October 2026

- 124 tests in 17 files passed, including preparation/publication order, explicit handoff, returned-report regression and partial crew progress. TypeScript and production build passed; lint had zero errors and eight existing Bklit vendor warnings.
- Isolated real-browser UI: create WF01/Adi Alur → create dated draft → confirm adaptation → save 24 sensor intervals → calculate/review/approve → publish → record manual sharing → explicitly open Budi's task → acknowledge → report90 → explicitly open Ratna's task → return report → Budi correct85 → Ratna verify80 → close. Every operational action stayed at `/shift/2026-10-31`. Future tasks were disabled before readiness. Final record: CLOSED, reported85, verified80, readings24.
- A second shift with two workers from different crews showed only the pending worker's adaptation form, advancing to the second after confirmation. Both confirmations unlocked Sensor.
- Sensor rendered a focused Station with one reading-save control. Monitoring `/perangkat` had no competing ingest control and its primary return link reopened the selected shift at Sensor. Station animation produced seven distinct sampled packet positions; normal motion remained enabled after QA.
- Final production preview: save readings for the two-worker shift, review/approve each worker in sequence, publish ACTIVE and reload into Instruksi. Both approved plans persisted, and the earlier CLOSED shift still opened its final report. No runtime console errors or warnings.
- Driver.js next/Escape preserved persisted workspace bytes. Desktop1440 and mobile390 layouts inspected; mobile document width remained390. Light/dark screenshots saved under ignored `web/output/playwright/terma-focused-*`. No browser console errors or warnings.

The change reuses browser-local storage, client-side role selection and the local device adapter. It introduces no server identity, shared cloud persistence or physical sensor connection. Existing permissions, plan versions, source provenance and closed snapshot guards remain the write boundary.
