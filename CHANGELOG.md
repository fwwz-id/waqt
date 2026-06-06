# Changelog

All notable changes to **Waqt — Waktu Sholat** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.1.0] — 2026-06-06

Initial public release. A mobile-first, offline-first PWA that shows the
**start and the estimated end** of each prayer window, the time remaining, and
reminders before a window closes.

### Added

- **Prayer window engine** — a framework-free, fully tested fiqh rule engine
  (`src/lib/prayer`) that produces `PrayerWindow { start, end, status, accuracy,
  ruleId, explanation }`. End times are resolved by named rules, not hardcoded
  in components.
- **Local calculation** with adhan-js (Fajr, Sunrise, Dhuhr, Asr, Maghrib,
  Isha, plus tomorrow's Fajr for Isha's end). Works fully offline.
- **Calculation methods** — Auto-by-country, Kemenag Indonesia (custom 20°/18°),
  Umm al-Qura, MWL, ISNA, Egypt, Dubai, Kuwait, Qatar, Turkey, Singapore,
  Moonsighting.
- **Madhhab profiles** — Syafi'i / Hanafi / Maliki / Hanbali, mapping Asr shadow
  factor and majority-opinion end-time defaults.
- **Advanced mode** — per-prayer end-rule overrides (short Maghrib window,
  ⅓ / ½ night, next Fajr, yellowing-sun, isfar) with live previews, each tagged
  Astronomis / Fikih / Estimasi.
- **Location** — GPS with OpenStreetMap/Nominatim reverse geocoding, plus manual
  city search. No paid map dependencies.
- **Notifications** — best-effort web notifications with start, before-start, and
  before-end reminders; a `NotificationProvider` interface with prepared
  Cloudflare Web Push and future Capacitor providers.
- **Bilingual UI** — Bahasa Indonesia and English, auto-detected and switchable.
- **Install prompt** — in-app "Install / Pasang" button (with an iOS
  Add-to-Home-Screen fallback) on Settings and About.
- **PWA** — installable, app-shell precache, offline fallback, service worker.
- **"Cara Kerja" guide** — per-madhhab drawers explaining how each one works,
  with references.
- **Cloudflare-ready backend** — Worker scaffold (`worker/`) with D1 schema,
  cron triggers, and VAPID Web Push, for reliable background reminders later.
- **CI/CD** — GitHub Actions for Cloudflare Pages (build → typecheck → test →
  deploy) and an optional Worker deploy workflow.

### Notes

- Theological framing is intentionally careful: end-of-window times follow the
  majority opinion within the selected madhhab profile and are presented as
  estimates, not as a final fiqh ruling. This app is not a fatwa engine.

[Unreleased]: https://github.com/fwwz-id/waqt/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fwwz-id/waqt/releases/tag/v0.1.0
