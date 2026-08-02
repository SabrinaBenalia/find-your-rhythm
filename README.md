# Find Your Rhythm

A personal cycle tracking PWA — body, menstrual, lunar, and seasonal patterns.

## Features

- **Today** — daily log with sliders, toggles, tag pills, notes
- **Calendar** — month view color-coded by cycle phase + moon phase markers
- **Lunar Wheel** — canvas visualization overlaying menstrual cycle on the 29.5-day lunar cycle
- **Trends** — line/bar charts for any field combination over 30/60/90d/all
- **Pattern Finder** — select a tag, see how it correlates with cycle phase, mood, moon phase
- **Settings** — hemisphere, latitude, export JSON/CSV, import backup, Google Drive sync

All data lives in `localStorage`. Nothing is sent anywhere.

## Tech

- React + Vite + React Router
- Recharts for charts, Canvas API for the lunar wheel
- `vite-plugin-pwa` + Workbox service worker
- Google Drive REST API + GIS for optional backup

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Framework: **Vite** (auto-detected)
4. Deploy — done.

For Google Drive sync (optional), add these env vars in Vercel → Settings → Environment Variables:

```
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=xxx
```

### Google Cloud Console setup for Drive sync

1. Create a project at console.cloud.google.com
2. Enable **Google Drive API** and **Google Picker API**
3. Create **OAuth 2.0 Client ID** (Web application) — add your Vercel domain to Authorized JavaScript Origins
4. Create **API Key** — restrict to Google Drive API and your domain
5. Add both to Vercel environment variables

## Add to Home Screen

- **iPhone**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Menu → Add to Home Screen

## Local dev

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in Google credentials if you want Drive sync locally.
