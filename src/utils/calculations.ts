/**
 * All calculated fields. Edge cases documented in TECHNICAL_NOTE.md:
 * - Division by zero: returns 0 for rejection%, null for achievement%
 * - Rounding: round-half-up to 1 decimal via Math.round(v*10)/10
 */

export function acceptedQty(produced: number, rejected: number): number {
  return produced - rejected;
}

export function rejectionPct(produced: number, rejected: number): number {
  if (produced === 0) return 0;
  return Math.round((rejected / produced) * 1000) / 10;
}

export function achievementPct(planned: number, accepted: number): number | null {
  if (planned === 0) return null;
  return Math.round((accepted / planned) * 1000) / 10;
}

export function runningTime(downtimeMinutes: number): number {
  return 60 - downtimeMinutes;
}

// Threshold is strictly greater than 10%, per spec ">10%"
export function rejectionExceedsThreshold(produced: number, rejected: number): boolean {
  if (produced === 0) return false;
  return rejectionPct(produced, rejected) > 10.0;
}
