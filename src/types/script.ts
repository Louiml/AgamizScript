/**
 * Agamiz Script — core data model for the `.ascript` package schema
 * and screenplay element semantics.
 */

export type ProjectLanguage = "en" | "he" | "ar" | "ru";
export type ProjectType = "screenplay" | "manuscript" | "subtitle";
export type ThemeMode = "system" | "light" | "dark";
export type Direction = "ltr" | "rtl";

/* ------------------------------------------------------------------ */
/* Script elements (Fountain + Hollywood taxonomy)                     */
/* ------------------------------------------------------------------ */

export enum ScriptElement {
  SceneHeading = "scene_heading",
  Action = "action",
  Character = "character",
  Dialogue = "dialogue",
  Parenthetical = "parenthetical",
  Transition = "transition",
  Shot = "shot",
  Lyrics = "lyrics",
  Centered = "centered",
  PageBreak = "page_break",
  Null = "null",
}

export const SCRIPT_ELEMENT_LABEL: Record<ScriptElement, string> = {
  [ScriptElement.SceneHeading]: "Scene Heading",
  [ScriptElement.Action]: "Action",
  [ScriptElement.Character]: "Character",
  [ScriptElement.Dialogue]: "Dialogue",
  [ScriptElement.Parenthetical]: "Parenthetical",
  [ScriptElement.Transition]: "Transition",
  [ScriptElement.Shot]: "Shot",
  [ScriptElement.Lyrics]: "Lyrics",
  [ScriptElement.Centered]: "Centered",
  [ScriptElement.PageBreak]: "Page Break",
  [ScriptElement.Null]: "Comment",
};

export interface ScriptFormatAttrs {
  element?: ScriptElement | null;
  /** Per-paragraph text direction (enables RTL inside an LTR script). */
  direction?: Direction;
  /** Draft / revision color tag. */
  revision?: RevisionColor;
}

/* ------------------------------------------------------------------ */
/* Revision tracking                                                   */
/* ------------------------------------------------------------------ */

export type RevisionColor =
  | "white"
  | "blue"
  | "pink"
  | "yellow"
  | "green"
  | "salmon"
  | "cherry"
  | "goldenrod";

export const REVISION_COLORS: RevisionColor[] = [
  "white",
  "blue",
  "pink",
  "yellow",
  "green",
  "salmon",
  "cherry",
  "goldenrod",
];

export interface RevisionStamp {
  id: string;
  label: string;
  color: RevisionColor;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Beat board cards                                                    */
/* ------------------------------------------------------------------ */

export interface BeatCard {
  id: string;
  sceneId?: string;
  title: string;
  logline: string;
  pageInterval: string;
  color: RevisionColor;
  tags: string[];
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Bible / production reference                                        */
/* ------------------------------------------------------------------ */

export interface CharacterEntry {
  id: string;
  name: string;
  age?: string;
  role?: string;
  description: string;
  backstory?: string;
  motivation?: string;
  arc?: string;
  tags: string[];
  updatedAt: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  description: string;
  timeOfDay: string[];
  notes?: string;
  tags: string[];
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Subtitles                                                           */
/* ------------------------------------------------------------------ */

export interface SubtitleCue {
  id: number;
  startMs: number;
  endMs: number;
  text: string;
}

export type Timecode = string; // "00:00:01,000"

/* ------------------------------------------------------------------ */
/* Project metadata                                                    */
/* ------------------------------------------------------------------ */

export interface ProjectThumbnail {
  accent: string;
  glyph: string;
}

export interface ProjectDescriptor {
  id: string;
  title: string;
  author: string;
  type: ProjectType;
  language: ProjectLanguage;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  sceneCount: number;
  phrase?: string;
  thumbnail?: ProjectThumbnail;
  filePath?: string;
}

/* ------------------------------------------------------------------ */
/* The `.ascript` package specification                                */
/* ------------------------------------------------------------------ */

export interface AscriptSettings {
  version: string;
  targetPageCount: number;
  tabWidthPercent: number;
}

export interface Ascript {
  version: "1.0.0";
  metadata: AscriptMetadata;
  content: {
    script_nodes: ScriptNode[];
    fountain_raw: string | null;
    subtitles: SubtitleCue[];
  };
  bible: {
    characters: CharacterEntry[];
    locations: LocationEntry[];
  };
  cards: BeatCard[];
  settings: AscriptSettings;
}

export interface AscriptMetadata {
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
  language: ProjectLanguage;
  type: ProjectType;
  direction: Direction;
}

/** Serialized paragraph node persisted inside `.ascript`. */
export interface ScriptNode {
  id: string;
  element: ScriptElement;
  text: string;
  direction?: Direction;
  revision?: RevisionColor;
  html?: string;
}

export type ScriptElementType = ScriptElement | null;

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

export const SPECIAL_ELEMENTS: ScriptElement[] = [
  ScriptElement.PageBreak,
  ScriptElement.Null,
];

export const RTL_LANGUAGES: ProjectLanguage[] = ["he", "ar"];

export const RTL_SCRIPT_PATTERN = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/** Heuristic first-seen-script direction detector. */
export function detectDirection(text: string, fallback: Direction = "ltr"): Direction {
  const sample = text.slice(0, 320);
  const rtlMatches = sample.match(RTL_SCRIPT_PATTERN);
  if (!rtlMatches) return fallback;
  const ltrCount = (sample.match(/[A-Za-z0-9\u0370-\u03FF]/g) ?? []).length;
  return rtlMatches.length >= ltrCount ? "rtl" : "ltr";
}

export function defaultDirection(language: ProjectLanguage): Direction {
  return RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
}

export function createAscript(
  language: ProjectLanguage = "en",
  type: ProjectType = "screenplay",
): Ascript {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    metadata: {
      title: "Untitled",
      author: "",
      created_at: now,
      updated_at: now,
      language,
      type,
      direction: defaultDirection(language),
    },
    content: {
      script_nodes: [],
      fountain_raw: null,
      subtitles: [],
    },
    bible: { characters: [], locations: [] },
    cards: [],
    settings: {
      version: "1.0.0",
      targetPageCount: 120,
      tabWidthPercent: 2.43,
    },
  };
}