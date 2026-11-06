# TERMA Band: source reconciliation

Sources inspected 7 November 2026:

- User PDF `TERMA_Proposal_DeveloperDay2026.pdf`, pp. 6–7 and reference [11].
- User PDF `Flowchart Perhitungan TERMA (Copy).pdf`, pp. 8–9, section 06; `Flow Website TERMA (Copy).pdf`, HSE/Band and Clinic sections.
- [Buller et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23780514/), DOI 10.1088/0967-3334/34/7/781. Author's [Brown dissertation](https://cs.brown.edu/media/filer_public/3f/d1/3fd1009d-e6b5-4ee8-99e9-1e553aee7dff/buller.pdf), §3.2, equations 3.27–3.32, Matlab implementation and Table 3.6, printed pp. 64–66.
- [Falcone et al., 2024](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2024.1219595/full), DOI 10.3389/fpubh.2024.1219595. This is a separate biphasic model, not interchangeable coefficients for Buller.

| PDF field | Implementation / display |
| --- | --- |
| HR every 30 seconds, valid 40–220 bpm | Worker/device/time/origin event; Clinic receives bpm. PPG quality retained. |
| Minute core estimate | Average HR by minute, Buller EKF. Skin temperature is not an input. Clinic receives estimate and trend explicitly labelled pilot. |
| Quality / activity | PPG status; optional `activityG` retained, validated and deduplicated. No activity-based artefact inference without this input. |
| Battery / last transmission | Optional `batteryPercent` in 0–100; latest event time. Missing battery stays unknown. |
| Assignment and consent | Only the assigned wearing period; active Band consent; role access. HSE receives device status/counts, no raw HR, skin/core values or trend. |
| Water / kidney prevention | Scan counts, elapsed time and target interval; no measured volume, hydration diagnosis, renal damage score, D30/D90/D180 or automatic referral. |

Corrections: the calculation PDF's “Buller 2023” refers to **Buller 2013**. The implemented process and observation variances are **0.022²** and **18.88²**. Model coefficients are −4.5714, 384.4286 and −7887.1; initial estimate 37.1°C and variance 0 follow the draft starting assumptions. The numerical test uses the author's independent Table 3.6 initialization 37.94°C and four HR observations; all four results agree to five decimal places.

Data gaps are never interpolated. Bad PPG, >30 bpm jumps within five seconds, a missing minute, device/origin change or a different wearing period resets continuity. At least 30 consecutive minutes is an explicit local initialization guard, not a clinical validation claim. Old/stale readings or revoked consent do not expose an estimate. This read-only projection cannot approve a plan, generate instructions or replace verified exposure.

Illustrations use a generated HR sequence through the same estimator, a fixed snapshot and a persistent illustration label. They create no operational records and do not enter reports. Actual physical ingestion, clinical validation V3, sustained HR/age alerts, approved core-temperature thresholds, D90 calculations and guaranteed delivery to a foreman remain separate work; they are not represented as active capabilities.

Logo: transparent original raster resources xref 18 (white) and 80 (navy), 1482×400, extracted from the user proposal without redrawing. Public assets: `web/public/brand/terma-paper-on-dark.png` and `terma-paper-on-light.png`.
