import type { Ascript, ProjectLanguage, ProjectType } from "@/types/script";
import { createAscript } from "@/types/script";
import { parseAscript, serializeAscript } from "@/utils/ascript";
import { parseFdx } from "@/lib/fdx";
import { parseFountain } from "@/lib/fountain";
import { parseSrt, parseVtt } from "@/utils/srt";
import { downloadBlob } from "@/utils/exporter";

const inTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const ASC_FILTER = { name: "Agamiz Script", extensions: ["ascript"] };
export const ALL_FILTER = [
  ASC_FILTER,
  { name: "Fountain", extensions: ["fountain"] },
  { name: "Final Draft", extensions: ["fdx"] },
  { name: "Subtitles", extensions: ["srt", "vtt"] },
  { name: "Plain text", extensions: ["txt"] },
];

function browserPickText(): Promise<{ raw: string; name: string } | null> {
  const input = document.createElement("input");
  input.type = "file";
  return new Promise<File[] | null>((resolve) => {
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  }).then(async (files) => {
    const file = files?.[0];
    if (!file) return null;
    return { raw: await file.text(), name: file.name };
  });
}

/** Read a text file via Tauri dialog (returns raw + filename). */
async function tauriPickText(
  filters: { name: string; extensions: string[] }[],
): Promise<{ raw: string; name: string } | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const file = await open({ multiple: false, directory: false, filters });
  if (typeof file !== "string" || !file) return null;
  const raw = await readTextFile(file);
  return { raw, name: file.split(/[\\/]/).pop() ?? "file" };
}

/**
 * Open any supported file (`.ascript`, `.fountain`, `.fdx`, `.srt`, `.vtt`)
 * and normalize it into an Ascript package.
 */
export async function openProjectFile(): Promise<Ascript | null> {
  let picked: { raw: string; name: string } | null = null;
  try {
    picked = !inTauri
      ? await browserPickText()
      : await tauriPickText(ALL_FILTER);
  } catch (error) {
    console.warn("Open dialog failed", error);
    return null;
  }
  if (!picked) return null;
  return parsePickedFile(picked.name, picked.raw);
}

/** Sniff the file type by extension first, then content, and never throw. */
export function parsePickedFile(name: string, raw: string): Ascript | null {
  const lower = name.toLowerCase();
  const head = raw.trimStart();
  try {
    if (lower.endsWith(".ascript")) {
      try {
        return parseAscript(raw);
      } catch {
        return importAscriptFromNodes(parseFountain(raw), "screenplay", "Imported Script");
      }
    }
    if (lower.endsWith(".fdx") || /<FinalDraft/i.test(raw.slice(0, 2000))) {
      return importAscriptFromNodes(parseFdx(raw), "screenplay", "FDX Import");
    }
    if (lower.endsWith(".fountain") || lower.endsWith(".txt")) {
      return importAscriptFromNodes(parseFountain(raw), "screenplay", "Fountain Import");
    }
    if (lower.endsWith(".srt") || /^\d{1,3}\s*$.*\d{2}:\d{2}:\d{2},\d{3}/s.test(raw.slice(0, 1000))) {
      const pkg = importAscriptFromNodes([], "subtitle", "SRT Import");
      pkg.content.subtitles = parseSrt(raw);
      return pkg;
    }
    if (lower.endsWith(".vtt") || head.startsWith("WEBVTT")) {
      const pkg = importAscriptFromNodes([], "subtitle", "VTT Import");
      pkg.content.subtitles = parseVtt(raw);
      return pkg;
    }
    // Unknown extension — try the most forgiving readers.
    if (head.startsWith("{") || head.startsWith("[")) return parseAscript(raw);
    if (head.startsWith("<")) {
      return importAscriptFromNodes(parseFdx(raw), "screenplay", "FDX Import");
    }
    return importAscriptFromNodes(parseFountain(raw), "screenplay", "Fountain Import");
  } catch (error) {
    console.warn(`Failed to parse “${name}”`, error);
    return null;
  }
}

export function importAscriptFromNodes(
  nodes: Ascript["content"]["script_nodes"],
  type: ProjectType,
  title: string,
  language: ProjectLanguage = "en",
): Ascript {
  const pkg = createAscript(language, type);
  pkg.metadata.title = title;
  pkg.content.script_nodes = nodes;
  return pkg;
}

/** Serialize + persist an Ascript through the OS dialog. */
export async function saveProjectToFile(pkg: Ascript): Promise<string | null> {
  const json = serializeAscript(pkg);
  const suggested = `${slugify(pkg.metadata.title)}.ascript`;

  if (!inTauri) {
    downloadBlob(new Blob([json], { type: "application/json" }), suggested);
    return suggested;
  }

  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeTextFile } = await import("@tauri-apps/plugin-fs");
  const path = await save({
    defaultPath: suggested,
    filters: [ASC_FILTER],
  });
  if (!path) return null;
  await writeTextFile(path, json);
  return path;
}

/** Write an arbitrary text payload to disk via dialog. */
export async function saveTextToFile(
  content: string,
  suggestedName: string,
  filter: { name: string; extensions: string[] },
  mime = "text/plain",
): Promise<boolean> {
  if (!inTauri) {
    downloadBlob(new Blob([content], { type: mime }), suggestedName);
    return true;
  }
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeTextFile } = await import("@tauri-apps/plugin-fs");
  const path = await save({ defaultPath: suggestedName, filters: [filter] });
  if (!path) return false;
  await writeTextFile(path, content);
  return true;
}

/** Open a specific absolute path (Tauri) and parse it to an Ascript. */
export async function openProjectPath(path: string): Promise<Ascript | null> {
  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const raw = await readTextFile(path);
    const name = path.split(/[\\/]/).pop() ?? "project";
    return parsePickedFile(name, raw);
  } catch (error) {
    console.warn("openProjectPath failed", error);
    return null;
  }
}

/** Ask Rust for the `.ascript` path the OS opened this session with (Tauri only). */
export async function consumeLaunchFile(): Promise<Ascript | null> {
  if (!inTauri) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await invoke<string | null>("get_launched_file");
    if (!path) return null;
    return await openProjectPath(path);
  } catch (error) {
    console.warn("consumeLaunchFile failed", error);
    return null;
  }
}

function slugify(text: string): string {
  return (
    text
      .trim()
      .replace(/[^a-z0-9\u0590-\u05FF\u0600-\u06FF]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "untitled"
  );
}

export function isTauri(): boolean {
  return inTauri;
}