# Waqt — Waktu Sholat

Pengingat waktu sholat berdasarkan lokasi. Waqt menampilkan awal waktu sholat
sekaligus perkiraan batas akhir dan sisa waktunya — hal yang jarang ditampilkan
aplikasi jadwal sholat pada umumnya.

> **Catatan:** Batas akhir mengikuti profil madzhab yang Anda pilih. Sebagian
> hanya perkiraan, karena tidak semua tanda alam bisa diukur persis dari
> perangkat. Untuk keputusan ibadah, tetap rujuk kitab fikih atau guru Anda.

A mobile-first, offline-first PWA that shows not just the **start** of each
prayer time but also the **estimated end window**, remaining time, and reminders
before the window closes.

## Features

- 📍 **Location** — GPS (reverse-geocoded via OpenStreetMap/Nominatim) or manual
  city search. No Google Maps, no paid deps.
- 🕌 **Local prayer calculation** with [adhan-js] — Fajr, Sunrise, Dhuhr, Asr,
  Maghrib, Isha (+ tomorrow's Fajr for Isha end). Fully offline.
- 🧮 **Calculation methods** — Auto-by-country, Kemenag Indonesia (custom
  20°/18°), Umm al-Qura, MWL, ISNA, Egypt, Dubai, Kuwait, Qatar, Turkey,
  Singapore, Moonsighting.
- 📿 **Madhhab profiles** — Syafi'i / Hanafi / Maliki / Hanbali, mapping Asr
  shadow factor and majority-opinion end-time defaults.
- ⏳ **Prayer window engine** — a generic, framework-free fiqh rule engine
  (`src/lib/prayer`) producing `PrayerWindow { start, end, status, accuracy,
  ruleId, explanation }`. Each rule is tagged **Astronomis / Fikih / Estimasi**.
- 🎛️ **Advanced mode** — override the end rule per prayer (short Maghrib window,
  ⅓ / ½ night, next Fajr, yellowing-sun, isfar…), with live previews.
- 🔔 **Notifications** — three-level architecture: local web notifications (MVP),
  Cloudflare Web Push (prepared, `worker/`), Capacitor (future) — all behind one
  `NotificationProvider` interface.
- 📲 **Installable PWA** — manifest, service worker, app-shell precache, offline
  fallback.

## Tech stack

React · TypeScript · Vite · TanStack Router · TanStack Query · Tailwind CSS v4 ·
shadcn/ui · lucide-react · adhan-js · vite-plugin-pwa (Workbox) · Cloudflare-ready.

## Getting started

```bash
bun install
bun run dev          # http://localhost:5173
bun run build        # type-check + production build + service worker
bun run preview
bun run test         # fiqh engine + scheduler unit tests (vitest)
```

## Architecture

```
src/
  app/            SettingsContext, router, AppShell
  components/     shared UI + shadcn/ui primitives (components/ui)
  features/       onboarding · dashboard · settings · prayer-detail · about
  hooks/          useNow · usePrayerDay · useNotifications
  lib/
    prayer/       calculation · methods · fiqhProfiles · fiqhRules ·
                  prayerWindows · status · explain · labels   (testable, no React)
    location/     geolocation · nominatim
    storage/      settingsStorage (localStorage, defensive migration)
    notifications/ providers · webNotificationProvider · stubProviders · scheduler
    utils/        datetime (timezone-aware, Intl-based)
  types/          domain types
  sw.ts           service worker (Workbox injectManifest)
worker/           Cloudflare Worker push backend (D1 + Cron + VAPID)
```

The **prayer + fiqh engine is independently testable** without React — see
`src/lib/prayer/__tests__`.

### Why the end-time engine is rule-based

End times are not hardcoded in components. `resolveEndRule(madhhab, prayer,
overrides)` picks a `RuleId`; the rule (`src/lib/prayer/fiqhRules.ts`) computes
the `Date`, declares its `accuracy`, and renders a Bahasa Indonesia explanation.
This keeps the theology transparent, configurable, and auditable.

## Deploy (Cloudflare Pages)

The app is a static SPA — deploy `dist/` to Cloudflare Pages.

```bash
bun run build
# Pages settings:
#   Build command:        bun run build
#   Build output dir:     dist
#   (public/_redirects routes all paths to index.html for client routing)
```

For reliable background push, deploy the companion Worker in [`worker/`](worker/)
(D1 + Cron Triggers + Web Push). The frontend remains fully functional without
it.

**Cloudflare Pages (recommended):** connect this repo in the Cloudflare dashboard
with build command `bun run build` and output directory `dist`. Pages builds and
deploys on every push — no GitHub Actions workflow required.

**Web Push (Level 2):** deploy the Worker in [`worker/`](worker/), then set the
Pages environment variable `VITE_PUSH_API_URL` to your Worker URL (e.g.
`https://waqt-push.<account>.workers.dev`). Rebuild Pages after adding it. The
app auto-detects the backend, subscribes via VAPID, and syncs settings to D1;
cron delivers reminders even when the PWA is closed.

**Worker:** see [`worker/README.md`](worker/README.md) for D1, VAPID, and
`ALLOWED_ORIGIN` setup. The dashboard Pages integration does not deploy Workers.

## Edge cases handled

First open (onboarding gate) · GPS denied → manual search · Nominatim/offline
failure → graceful labels · missing timezone → device tz · invalid coordinates ·
midnight rollover (day-keyed recompute) · Isha crossing midnight (tomorrow's
Fajr) · madhhab/method/city changes (reactive recompute) · notifications denied /
unsupported · high-latitude warning (middle-of-the-night rule).

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the
domain/wording rules, and how the i18n and fiqh engine work. Notable changes are
tracked in [CHANGELOG.md](CHANGELOG.md).

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

[adhan-js]: https://github.com/batoulapps/adhan-js
