import type { PrayerStatus } from "@/types";

/** Minutes-remaining threshold below which an active prayer is "ending soon". */
export const ENDING_SOON_MINUTES = 15;

export function computeStatus(
  now: Date,
  start: Date,
  end: Date,
  endingSoonMinutes: number = ENDING_SOON_MINUTES,
): PrayerStatus {
  const t = now.getTime();
  if (t < start.getTime()) return "upcoming";
  if (t >= end.getTime()) return "ended";
  const remainingMs = end.getTime() - t;
  if (remainingMs <= endingSoonMinutes * 60_000) return "ending_soon";
  return "active";
}

/** 0..1 progress through the [start, end] window, clamped. */
export function windowProgress(now: Date, start: Date, end: Date): number {
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  const elapsed = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0, elapsed / span));
}
