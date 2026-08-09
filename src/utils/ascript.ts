import type {
  Ascript,
  AscriptMetadata,
  ProjectDescriptor,
  ScriptNode,
} from "@/types/script";
import { createAscript } from "@/types/script";
import { computeStats } from "@/utils/counters";

export const ASC_EXTENSION = "ascript";

/** Serialize an Ascript package to the `.ascript` JSON string. */
export function serializeAscript(pkg: Ascript): string {
  const copy: Ascript = structuredClone(pkg);
  copy.metadata.updated_at = new Date().toISOString();
  copy.content.fountain_raw = null; // regenerated on export
  return JSON.stringify(copy, null, 2);
}

/** Parse an `.ascript` string, tolerating lightly-outdated shapes. */
export function parseAscript(raw: string): Ascript {
  const data = JSON.parse(raw) as Partial<Ascript>;
  if (!data.metadata || !data.content || !data.bible || !data.settings) {
    throw new Error("Invalid .ascript package: missing required sections.");
  }
  if (!Array.isArray(data.content.script_nodes)) data.content.script_nodes = [];
  if (!Array.isArray(data.content.subtitles)) data.content.subtitles = [];
  if (!Array.isArray(data.bible.characters)) data.bible.characters = [];
  if (!Array.isArray(data.bible.locations)) data.bible.locations = [];
  if (!Array.isArray(data.cards)) data.cards = [];
  return data as Ascript;
}

/** Derive a metadata view from a package. */
export function metadataFromAscript(pkg: Ascript): AscriptMetadata {
  return { ...pkg.metadata };
}

/** Build a ProjectDescriptor for the landing "recent" list. */
export function createProjectDescriptor(
  pkg: Ascript,
  nodes: ScriptNode[],
): ProjectDescriptor {
  const stats = computeStats(
    nodes,
    pkg.metadata.type === "manuscript" ? "manuscript" : "screenplay",
  );
  return {
    id: projectStableId(pkg),
    title: pkg.metadata.title,
    author: pkg.metadata.author,
    type: pkg.metadata.type,
    language: pkg.metadata.language,
    createdAt: pkg.metadata.created_at,
    updatedAt: pkg.metadata.updated_at,
    wordCount: stats.words,
    sceneCount: stats.scenes,
    thumbnail: {
      accent: pkg.metadata.language === "he" || pkg.metadata.language === "ar" ? "#7c3aed" : "#2563eb",
      glyph: "✎",
    },
  };
}

/** Stable id independent of object identity so recent-projects de-dupe. */
export function projectStableId(pkg: Ascript): string {
  return `${pkg.metadata.type}-${pkg.metadata.language}-${pkg.metadata.title}-${pkg.metadata.created_at}`;
}

export { createAscript };