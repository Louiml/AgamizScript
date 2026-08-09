import type { SubtitleCue } from "@/types/script";
import { parseTimecode } from "@/utils/timecode";

/** Parse SRT (`.srt`) source into timed cues. */
export function parseSrt(source: string): SubtitleCue[] {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/);

  const cues: SubtitleCue[] = [];
  let counter = 1;

  for (const block of blocks) {
    const lines = block.split("\n");
    let timeIndex = 0;
    let textIndex = 1;

    // First line may be the index number (optional in some exports)
    if (/^\d+$/.test(lines[0].trim())) {
      timeIndex = 1;
      textIndex = 2;
    }

    const timeLine = lines[timeIndex] ?? "";
    const match = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/,
    );
    if (!match) continue;

    const start = parseTimecode(match[1]);
    const end = parseTimecode(match[2]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const text = lines.slice(textIndex).join("\n").trim();
    cues.push({
      id: counter++,
      startMs: start,
      endMs: end,
      text,
    });
  }

  return cues.sort((a, b) => a.startMs - b.startMs);
}

/** Parse a WebVTT (`.vtt`) source into timed cues. Drops cue settings. */
export function parseVtt(source: string): SubtitleCue[] {
  const normalized = source.replace(/\r\n/g, "\n");
  const body = normalized.replace(/^\uFEFF?WEBVTT.*/i, "").replace(/^NOTE[^\n]*\n[\s\S]*?(?=\n{2,}|$)/gm, "");
  return parseSrt(body.replace(/\n{3,}/g, "\n\n"));
}