# TERMA DeveloperDay 2026 alignment

Source: TERMA_Proposal_DeveloperDay2026.pdf, supplied by the user on 2026-10-31, especially pp. 5-7 and 10. Baseline: upstream main bfd7b31.

Screen job: HSE identifies workers needing review, checks zone readings and approves a versioned daily plan. The foreman receives only scoped operational instructions.

Implementation commitments:

- Apply the Summon neutral palette, blue accent, Geist typography, tactile controls, persistent shell, measured selection indicator and reduced-motion behavior through shared owners.
- Use upstream Bklit animated charts for WBGT and the illustrative acclimatisation schedule. Preserve gaps; missing observations never become safe values.
- Make the three-device ecosystem visible: ESP32 WBGT station, RFID/QR water station and rotating upper-arm band. Clearly distinguish proposal specifications from connected runtime capabilities.
- Surface personal plans, explanation, approval and clinic handoff. Summarise verified exposure minutes separately from planned or reported exposure; do not infer a diagnosis, clinical threshold or a trained AI prediction.
- Preserve scoped access, local persistence, plan versions and existing HSE/foreman execution flows. Medical details and live telemetry require integrations outside this UI change.

References: locally installed summon-design-system skill (2026-10-18 token snapshot); https://bklit.com/docs/components/line-chart ; https://bklit.com/docs/components/bar-chart . Mobbin unavailable in this session.

Checks: TypeScript, ESLint, existing domain tests plus monthly exposure/gap tests; browser navigation, role scope, changed date, dark/light at 1440/820/390, reduced motion, chart interaction and overflow. Local development timing is directional, not production performance evidence.

Repository destination: Raya46 only. Preserve upstream history and provenance; do not modify the source repository or deploy the existing site.

## Verification observed 2026-10-31

- 84 tests in 12 files passed, including missing chart observations, forecast-only input, worker/crew scope, month boundaries and deduplicated verified exposure.
- TypeScript passed. ESLint: 0 errors; 8 warnings in unchanged upstream Bklit registry source (hook dependencies and unused generic/destructured variables). No lint rule was disabled.
- Browser: 18 combinations of /ringkasan, /perangkat and /kesehatan at 1440/820/390 px in light/dark, HTTP 200, no horizontal document overflow or page errors. Foreman sees only 4 crew members, including reload and monthly review. Zone filter, missing readings, worker search, role selector and theme toggle exercised.
- The existing map and hourly zone selector were moved to /pengukuran, with its SVG heat graph replaced by the same Bklit owner used on the dashboard. Mobile measurements screen checked for overflow.
- Motion sampled: nav indicator moved through y=88.29 to y=90, 200ms transition; page entry 420ms; Phosphor outline/fill 420/500ms. Reduced motion: entry animation none, nav transition 0s.
- Control artifact: upstream bfd7b31. Baseline and variant screenshots were inspected. Comparable control timings UNRESOLVED; a single warm local dev navigation to plans measured 211ms and is only directional. No performance improvement or production-speed claim.
- New dependencies: Phosphor; Bklit registry dependencies motion, d3 and number-flow with their TypeScript declarations. Lucide removed. No live services were connected or deployed.

Production build: `npm run build` passed, including Next.js type validation and static generation. Dashboard first-load JS reported by Next.js: 260 kB (103 kB shared). This is a bundle report, not a production latency measurement.

Production-preview browser smoke passed: Bklit hover tooltip, theme switch, search to devices, mobile navigation to clinic review, and dashboard reload. Preview: http://localhost:3026/ringkasan ; this is local, not a deployed service.
