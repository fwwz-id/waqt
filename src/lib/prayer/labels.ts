import type { PrayerName } from "@/types";

/**
 * Canonical prayer ordering. Display text (names, statuses, accuracy labels)
 * lives in the i18n dictionaries (`src/lib/i18n/messages.ts`) so it can be
 * translated; this module only holds the language-neutral ordering.
 */
export const PRAYER_ORDER: PrayerName[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];
