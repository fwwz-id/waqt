# Contributing to Waqt

Thanks for your interest in improving **Waqt — Waktu Sholat**! Contributions of
all kinds are welcome: bug reports, fixes, features, translations, docs, and
fiqh/accuracy feedback.

This app helps Muslims with prayer-time reminders, so please read the
[Domain & wording rules](#domain--wording-rules) before changing any
user-facing text or prayer logic — they're the part most likely to need a second
pass in review.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Development guidelines](#development-guidelines)
- [Domain & wording rules](#domain--wording-rules)
- [Internationalization (id / en)](#internationalization-id--en)
- [Adding to the fiqh engine](#adding-to-the-fiqh-engine)
- [Tests](#tests)
- [Commits & pull requests](#commits--pull-requests)
- [Reporting bugs & ideas](#reporting-bugs--ideas)

## Code of conduct

Be respectful, patient, and assume good faith. Discussions about fiqh
differences are welcome but must stay courteous and non-judgmental — we describe
positions, we don't issue rulings. Harassment of any kind isn't tolerated.

## Getting started

Prerequisites: [Bun](https://bun.sh) ≥ 1.3 (the project uses Bun, not npm/yarn).

```bash
git clone https://github.com/fwwz-id/waqt.git
cd waqt
bun install

bun run dev          # dev server (http://localhost:5173)
bun run typecheck    # tsc, no emit
bun run test         # vitest (fiqh engine, scheduler, i18n)
bun run build        # production build + service worker
```

Before opening a PR, make sure all three pass locally:

```bash
bun run typecheck && bun run test && bun run build
```

These are the same checks CI runs.

## Project layout

See the [Architecture](README.md#architecture) section of the README. The short
version:

- `src/lib/prayer/` — the **framework-free, testable** prayer + fiqh engine.
  No React or DOM imports belong here.
- `src/lib/i18n/messages.ts` — all user-facing copy (both languages).
- `src/features/` — screen-level UI (onboarding, dashboard, settings, etc.).
- `src/components/ui/` — shadcn/ui primitives; prefer reusing these.
- `worker/` — the optional Cloudflare push backend (separate package).

## Development guidelines

- **TypeScript is strict.** No `any`, no non-null hacks to silence the compiler.
  Model the types properly.
- **Keep prayer logic out of components.** Times and rules live in
  `src/lib/prayer/`. Components consume `PrayerWindow`s; they don't compute them.
- **Reuse UI primitives** from `src/components/ui` and keep the design
  mobile-first (soft green / cream, rounded cards, large readable type).
- **No new heavy dependencies** without discussion — especially no paid map or
  prayer-time services. Calculation stays local (adhan-js); geocoding stays on
  OpenStreetMap/Nominatim.
- The app must **keep working offline** after a location is saved.

## Domain & wording rules

User-facing copy is held to a careful standard:

1. **Not a fatwa engine.** Use safe, non-absolute wording:
   _Estimasi · Perkiraan · Batas waktu · Pengingat · "mengikuti pendapat
   mayoritas dalam profil ini"._
   Avoid absolutes: _"pasti tidak sah", "haram", "hukum final", "tidak sah
   secara mutlak"._
2. **Plain and human, not technical.** Don't expose jargon (browser, device,
   server, push) to end users. Avoid em dashes in UI copy.
3. **Label honestly.** Every end-time rule must carry an accuracy tag:
   `astronomical` (Astronomis), `fiqh_rule` (Fikih), or `heuristic` (Estimasi).
   If a value is a guess (e.g. yellowing sun, isfar), it must read as a
   _perkiraan_, not as a precise time.

If a change touches theology or wording and you're unsure, say so in the PR —
it's better to flag it than to assert certainty.

## Internationalization (id / en)

Every visible string lives in `src/lib/i18n/messages.ts`. The Indonesian
dictionary (`id`) is the source of truth; `type Messages = typeof id` forces the
English dictionary to implement **exactly the same keys** — so a missing
translation won't compile.

- Add new copy to **both** `id` and `en`.
- Read it in components via `const { t } = useT()`, e.g. `t.dashboard.todaySchedule`.
- For interpolation, add a function in the dictionary
  (`(name) => \`...${name}...\``), don't concatenate in the component.
- Use `locale` from `useT()` for date/number formatting; never hardcode `id-ID`.

## Adding to the fiqh engine

- **A new end-time rule** → add it to `RULES` in
  `src/lib/prayer/fiqhRules.ts` with an `accuracy`, `appliesTo`, `computeEnd`,
  and an `explain` that reads from the `ruleExplain` dictionary. Add its label
  and explanation to i18n, and a unit test.
- **A new calculation method** → extend `src/lib/prayer/methods.ts` and add its
  label/description to i18n.
- **A new madhhab profile / default** → `src/lib/prayer/fiqhProfiles.ts`.

Engine changes should come with tests in `src/lib/prayer/__tests__/`.

## Tests

We use [Vitest](https://vitest.dev/). The engine is designed to be testable
without React. Please add or update tests for:

- new or changed fiqh rules (verify the computed `Date` and accuracy),
- scheduler/reminder logic,
- i18n parity if you add a new dictionary section.

```bash
bun run test          # run once
bun run test:watch    # watch mode
```

## Commits & pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/):
  `feat: …`, `fix: …`, `docs: …`, `refactor: …`, `test: …`, `chore: …`.
- Branch from `main`; keep PRs focused and reasonably small.
- Fill in the PR template, including screenshots for UI changes (both languages
  if you touched copy).
- Add a line under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) for
  user-facing changes.
- Ensure `bun run typecheck && bun run test && bun run build` all pass.

By contributing, you agree your contributions are licensed under the project's
[Apache-2.0 License](LICENSE).

## Reporting bugs & ideas

Open a [GitHub issue](https://github.com/fwwz-id/waqt/issues) using the bug or
feature template. For something sensitive (e.g. a security concern), email
**hi@fwwz.space** instead of filing a public issue.

When reporting a wrong prayer time, please include your **city/coordinates,
calculation method, madhhab, and timezone** — these determine the result.
