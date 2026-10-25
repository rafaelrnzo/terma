# TERMA frontend demo

Landing page: `/`. Dashboard HSE: `/ringkasan`. All operational records are local mock data; there is no authentication or worker tracking.

## Dashboard map and tour

The dashboard includes desktop sidebar navigation (mobile drawer), an interactive zone scheme, interval-specific WBGT readings, and an optional six-step Driver.js tour. Start, skip, or replay it using **Panduan dashboard**; the tour does not alter records.

The scheme works without a Mapbox account and makes no Mapbox requests. To enable the optional geographic view:

1. Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `web/.env.local` using `web/.env.example` as a reference.
2. Use a public `pk.*` token restricted to the allowed site URLs. Never use a secret `sk.*` token. This value is visible in browser bundles.
3. Restart the development server, or rebuild the deployment, then choose **Mapbox** above the scheme.

The map uses fictional demo coordinates from `src/lib/zone-map.ts`, **not an actual project location**. A configured token enables external Mapbox requests only when that view is selected; usage is governed by the token owner's Mapbox account. Invalid token, unsupported WebGL, network errors, or a 12-second load timeout return to the usable scheme. No geolocation permission is requested. Live tiles cannot be verified without a valid token.

Run `scripts/dashboard-smoke.cjs` against the dev server with a Playwright runtime. It checks five viewport widths, role/date changes, zone selection, six tour steps, keyboard exit/replay, unchanged records, and zero Mapbox requests without a token.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev -- --port 3001
```

Open [http://localhost:3001/ringkasan](http://localhost:3001/ringkasan) for the dashboard.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses `next/font` for Inter and Manrope.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
