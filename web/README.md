# TERMA frontend

Next.js 15. Role homes: `/hse`, `/admin`, `/mandor`. `/ringkasan` redirects to the current role. See [role workflow](../docs/role-workspaces.md).

## Start the application

```sh
npm install
npm run dev -- --port 3001
```

Open http://localhost:3001/hse. A new browser receives eight linked reference workers, assignments and baseline summaries through Company Data Hub. Existing workspaces are preserved. Create a draft shift, open **Buka layar absen pekerja**, then complete attendance and HSE review before approving plans.

## Connected surfaces

- `/kiosk`: camera permission and live preview, thermal color effect, self-confirmed identity, or interactive card tap; body condition questions follow both methods. Camera tracks stop on confirmation, mode change, page exit or hidden tab. No photo, video, biometric match or temperature is stored. Card tap uses the same scan duration as the water-station visualization; physical hardware is not connected.
- `/forecasting`: real BMKG JSON for Kemayoran, Jakarta Pusat (`31.71.03.1001`) through `/api/weather`. Server cache 15 minutes; visible browser refresh every 30 minutes. Source periods, production time, humidity and air temperature are retained. Air temperature is not WBGT. Errors are shown and previous successful data retained. Approved/active/closed shift snapshots stay unchanged.
- `/forecasting` and `/monitoring`: Leaflet 1.9.4 with OpenStreetMap tiles, visible attribution, zoom, pan and selectable zone markers. No token is needed. Zone offsets are illustrative around the weather reference, not surveyed GPS or worker tracking. Network failure returns to the selectable scheme. Only visible tiles are requested; no offline prefetch.
- `/impor`: existing URL now opens Company Data Hub and the worker directory; CSV forms have been removed. Empty workspaces get local reference data once. Sensor readings sync automatically when opening the Sensor task, preserving recorded/manual readings and closed history. Instructions go to the TERMA foreman inbox; no external WhatsApp delivery is claimed.

Operational records and role selection remain browser-local (`terma-demo-v2`), without server authentication or cross-device synchronization. Company/MCU/device adapters use local reference data; BMKG and OSM are actual external services.

## Checks and release

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Vercel builds `web/` from the upstream repository main branch. No map token or private API credentials are required.
