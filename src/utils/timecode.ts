/** Convert milliseconds to SRT timecode `HH:MM:SS,mmm`. */
export function msToSrt(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const millis = total % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/** Convert milliseconds to VTT timecode: HH:MM:SS.mmm */
export function msToVtt(ms: number): string {
  return msToSrt(ms).replace(",", ".");
}

/** Parse SRT/VTT timecode to milliseconds. */
export function parseTimecode(tc: string): number {
  const match = tc.trim().replace(",", ".").match(/(\d+):(\d+):(\d+)(?:\.(\d{1,3}))?/);
  if (!match) return NaN;
  const [, h, m, s, ms = "0"] = match;
  return Number(h) * 3_600_000 + Number(m) * 60_000 + Number(s) * 1000 + Number(ms.padEnd(3, "0"));
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** Estimate reading duration in %ms from character count at 15 chars/sec. */
export function readingDurationMs(text: string, cps = 15): number {
  const chars = Array.from(text).length;
  return Math.max(700, Math.round((chars / cps) * 1000));
}

export function cpsFor(cue: { text: string; startMs: number; endMs: number }): number {
  const duration = Math.max(1, cue.endMs - cue.startMs) / 1000;
  return Array.from(cue.text).length / duration;
}