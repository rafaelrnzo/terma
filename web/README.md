# TERMA web

Next.js 16. One server holds the shared workspace: every screen signs in, every action runs on the
server as that user (role rules enforced there), and changes reach all open screens over SSE.
Clinical notes, check-in complaints and raw Band values are sent only to Klinik accounts.
See [role workflow](../docs/role-workspaces.md) and [firmware](../firmware/README.md).

## Start locally

```sh
npm install
npm run set-password -- ratna   # once per account: ratna, budi, sari, tono, dewi
npm run dev -- --port 3030
```

Open http://localhost:3030 and sign in. Data lives in `~/.terma` (outside the project, so saving it does
not trigger Next reloads; set `TERMA_DATA_DIR` to change it): `workspace.json`
(shared workspace) and `users.json` (scrypt password hashes). For device data also run terma-iot
(repo Raya46/terma-iot) and set `TERMA_IOT_URL` / `TERMA_IOT_KEY` in `.env.local` (see `.env.example`).
A new workspace receives eight reference workers through Company Data Hub.

## Connected surfaces

- Devices: TERMA Station (ISBB per placed zone), Water Station (card taps, drink gaps) and TERMA Band
  (heart rate, core-temperature estimate) arrive through terma-iot; this server files them into the
  shift and recomputes plans. Band and drink warnings create a new plan version for HSE approval.
- `/kiosk`: sign in once on the tablet (data officer account), then workers check in by camera or card.
- `/forecasting`: BMKG forecast for Kemayoran via `/api/weather`, Leaflet/OpenStreetMap map, and the
  Station placement form (map click, device GPS or typed coordinates).
- `/monitoring`: monitoring, attendance, drink records, ISBB readings and analytics tabs.

## Deploy

Not on Vercel: the workspace needs a persistent disk. Run the `web-image` workflow (tests, then
`ghcr.io/rafaelrnzo/terma-web`), then `deploy/compose.yml` at the repo root with terma-iot on the VPS,
HTTPS in front of port 3000, `TERMA_SESSION_SECRET` (≥ 32 characters) and `TERMA_IOT_KEY` set.
Set passwords inside the container: `docker compose exec web node scripts/set-password.mjs ratna`.

## Checks and release

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build   # CI only (web-image workflow)
```

Vercel still builds `web/` from main, but without a persistent disk and `users.json` nobody can sign in there; production is the VPS deployment above. No map token is required.
