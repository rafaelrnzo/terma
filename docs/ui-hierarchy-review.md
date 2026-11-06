# TERMA interface revision — 7 November 2026

Contract: each operational page presents its worklist, priority values and decisive action first. Worker monitoring opens as an addressable page, with source/date and role access. Shift creation supports searching and selecting a roster in a spacious form. Shared data, approvals, snapshots and history stay owned by the domain reducers.

## Inspected visual references

- [Joseph Kalu — Health Dashboard for HR and Employee Health Check, Dribbble](https://dribbble.com/shots/25844475-Health-Dashboard-for-HR-and-Employee-Health-Check): inspected full image; separated overview metrics, main analysis and worklist. Adopted metric/label hierarchy and clear section grouping, without copying clinical categories or invented health scores.
- [Pixoul Studio — Schedule Management Dashboard, Behance](https://www.behance.net/gallery/230697189/Schedule-Management-Dashboard-UIUX-Design): inspected the indexed original project image after the project page returned 403. Adopted distinct metric cards, one primary action and desktop/mobile layout differences; no copied palette or unsupported comparisons.
- Mobbin was unavailable in this session. User explicitly requested Dribbble/Behance.

## Changes through shared owners

- Existing `globals.css` tokens own TERMA navy and orange/yellow identity; Summon typography, radii, fields, buttons, shadows, selection indicators, icon fills and reduced-motion paths remain.
- Shared headers, cards, tables and metric strips distinguish 24px page headings, 16px section headings, 24–32px values, 13px UI and 12px metadata. Status is separate from source quality.
- Sidebar exposes grouped destinations with a different Phosphor icon per visible destination. One indicator follows the active destination. Account switching remains in the header.
- Removed repeated role instructions, engineering footer, static workflow/IoT promotion panels, future-health-module cards, duplicate readiness guidance and long route subtitles. Necessary unknowns, consent, source labels and destructive-action consequences remain.
- Consolidated five functional pairs: directory/examinations (`/impor`), adaptation/plans (`/rencana`), monitoring/analytics (`/monitoring`), shift/monthly reports (`/laporan`, `/laporan/bulanan`), individual plan/analysis (`/pekerja/[kode]`). Shared measured tab indicators replace duplicate sidebar destinations. Existing URLs redirect; query parameters preserve selected worker. Monthly Clinic access does not grant shift-report or analytics access.
- Shift overview offers independent task links with counts and completion state; no forced single-page wizard. Primary action follows the first pending operational task.
- Worker rows use Pantau plus a contextual action menu; edit/archive/restore retain original reducers and confirmations. Removed duplicate date bar, kept two-line document summaries. Safari measured all eight rows at 67 CSS px.
- Shift creation: 960px desktop composer, separate schedule/participants areas, search, crew filter, select-all-results, selection count, sticky footer and mobile layout.
- `/pemantauan/[kode]?tanggal=…` owns Pantau. Persistent worker identity/date, primary metrics, interactive body, selected signal detail and history replace the former modal. Source/method explanation is expandable. No-shift monitoring and archived records remain available to HSE/Clinic only.
- Band fields and model reconciliation are documented in [band-paper-crosswalk.md](band-paper-crosswalk.md).

## Validation

Browser verification uses actual Safari through safaridriver, as requested. Screenshots, responsive viewport checks, role checks and local control/variant timing evidence are under ignored `web/output/`. Mobile-width checks use a 390×844 same-origin iframe in Safari, because desktop Safari limits native window width; this verifies responsive WebKit layout, not an iPhone hardware run. Static visual assessment is separate from animation sampling and interaction checks.

## Navigation verification

The navigation control is immutable Git tree `aafee29551d3d573ec1b4b5892634d0aad8a4867`, captured before the navigation fixes in this revision; the earlier baseline worktree is commit `b5219c09516cc812f05c57a36b60249962c11132`. Both use local development servers; this is directional Safari evidence, not a production-speed or p95 claim.

Removed server search-parameter dependencies for browser-local tabs and moved query reading under client Suspense boundaries. Same-path tabs use Next's supported History API integration, retaining back/forward behavior. Sidebar links use `useLinkStatus` to expose pending feedback while keeping the shell mounted. Shared route loading and retry boundaries cover delayed and failed navigation. Analytics loads only on its permitted selected tab. Official per-icon Phosphor exports replace wide barrel imports across 54 modules; no new package/configuration experiment remains.

Real Safari HSE→planning runs: three direct and three through a local proxy adding 1.5 seconds to relevant RSC requests. Variant feedback appeared in 6–11 ms; warm control feedback waited 191–239 ms direct and 1,935–2,963 ms delayed. First cold/HMR samples are excluded from warm comparisons; route readiness still depends on network/compilation. Raw samples: ignored `web/output/navigation-{control,variant}.json`. No production performance inference.

Latest matrix: 16 actual-content routes at 1440 light, 820 dark and 390 dark, 48 checks with no page/main overflow and distinct sidebar icons. Overlay checks separately cover adaptation calendar geometry, modal bounds and shift search/selection. Reviewed status is persisted only by confirmation; approved plans retain their separate badge. Operational lists use the selected shift participant snapshot, with an explicit all-workers directory for master management. Archived master records remain visible when already included in a shift.

TypeScript, ESLint and domain tests run locally. Production build/deployment is checked against the exact pushed commit's hosted status; no Mac production build.

Validation result: 187 tests in 29 files pass; TypeScript passes; ESLint has zero errors and the same eight existing Bklit warnings. Six overlay cases (adaptation and shift composer at three widths) pass bounds/overflow checks; calendar is 7×2. Participant scope switches 2→8→2 and search selections persist. Pantau opens the addressable detail and confirmation survives reload. Safari's background automation window suspends exit timelines: the harness records the actual closed state, then dispatches only the closed Radix exit-completion event to unblock subsequent cases. This is not evidence of foreground animation timing.

Additional browser checks: both participants can be approved and the shift published; the planning worklist shows two approved badges. HSE raw Band redaction, Clinic illustration values/estimate and monthly-only report tab, and foreman cross-crew identity hiding pass. Five legacy routes redirect to their consolidated owners. History traversal is verified with the browser History API; native toolbar/WebDriver back timing is not inferred from synthetic clicks in the background window.

The active-shift extension adds 12 successful actual-content checks: instructions, execution, individual plan and individual exposure analysis at 1440/820/390. Combined route/viewport matrix: **60 passing checks**, plus six overlay cases and the role/approval/redirect/history checks above.

## Instruction and attendance follow-up

Control artifact: `1b5bdecaa1c86852d52cd7a8409e38b5bf7c777b`. Scope: HSE prepares an approved per-crew message; the explicit send simulation produces immediate local feedback; Mandor separately confirms receipt. The prior channel dropdown, duplicate explanatory text and always-expanded history are removed. The approved message and all interval details remain intact and copyable, inside a bounded, keyboard-focusable conversation preview. Sender/recipient, pending plans, timestamps, failure/retry and confirmation remain separate. The WhatsApp green action uses owned brand tokens with dark text for contrast; other TERMA branding remains intact. Primary brand reference: [WhatsApp/Meta brand resources](https://www.meta.com/en-gb/brand/resources/whatsapp/whatsapp-brand/). Existing inspected Dribbble/Behance hierarchy references above remain applicable; Mobbin unavailable.

The user specifically requests an “as if sent” interaction: preview/receipt are labelled simulation, while the domain record stays `DIBAGIKAN_MANUAL`. Optional `kanal` persists the simulated channel through reload; it is not a provider receipt. No external messages, provider requests, fabricated phone number or automatic acknowledgement. Legacy records keep their original status. Approved-version deduplication, failure, retry, crew access and history stay in the existing reducers.

Attendance joins Monitoring as a permitted tab beside Pemantauan/Analitik. `/absensi` redirects; its sidebar destination is removed. The semantic table shows only selected participants within role scope: identity, crew, check-in status, time and method. Search/status filters have explicit empty results. Clinical answers/complaints do not enter this table, and Clinic does not gain attendance access through the consolidated route or search. Internal links use the canonical tab directly.

No navigation, dependency or animation optimization claim is made for this component revision. Control timing was not collected after the Safari session reset; local send feedback is measured independently with a DOM observer. No artificial sending delay or provider wait is introduced. Browser evidence is under ignored `web/output/whatsapp-qa-results.json`; mobile checks use the same Safari iframe method described above.

Validation for this follow-up: 189 tests across 29 files pass; TypeScript passes; ESLint zero errors with the same eight pre-existing Bklit warnings. Actual Safari checks cover both routes at 1440/820/390 in both themes (12 route/viewport/theme cases), no page/main overflow, separate send/duplicate/reload/failure/retry/foreman acknowledgement cases, crew scope, attendance search and status filters, Clinic tab exclusion and legacy redirect. A mixed check-in fixture verifies time/method/present/pending states without exposing its private complaint. The independent first development send DOM-feedback sample was ~28 ms; no production latency or within-one-frame guarantee is inferred. Synthetic records remain isolated to the Safari automation profile and ignored output files.
