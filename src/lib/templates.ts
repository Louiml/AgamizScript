import type {
  Ascript,
  ProjectDescriptor,
  ProjectLanguage,
  ProjectType,
  ScriptNode,
} from "@/types/script";
import { ScriptElement, createAscript } from "@/types/script";
import { uid } from "@/utils/cn";
import { projectStableId } from "@/utils/ascript";
import { computeStats } from "@/utils/counters";

export interface TemplateSeed {
  key: string;
  labelKey: string;
  descKey: string;
  type: ProjectType;
  language: ProjectLanguage;
  icon: string;
  color: string;
  seed: () => ScriptNode[];
}

const node = (element: ScriptElement, text: string): ScriptNode => ({
  id: uid(),
  element,
  text,
});

const STANDARD: ScriptNode[] = [
  node(ScriptElement.Action, "TITLE: AGAMIZ SCRIPT DEMO"),
  node(ScriptElement.Action, "A screenwriting suite, built for stories."),
  node(ScriptElement.SceneHeading, "INT. WRITING ROOM - DAY"),
  node(ScriptElement.Action, "A warm desk beside a tall window. Coffee steam rises."),
  node(ScriptElement.Character, "ALEX"),
  node(ScriptElement.Parenthetical, "(to JORDAN)"),
  node(ScriptElement.Dialogue, "I have it. The first scene."),
  node(ScriptElement.Character, "JORDAN"),
  node(ScriptElement.Dialogue, "Then we are unstoppable."),
  node(ScriptElement.Transition, "FADE OUT."),
];

const STAGE: ScriptNode[] = [
  node(ScriptElement.SceneHeading, "ACT ONE"),
  node(ScriptElement.Action, "The stage is bare but for a single chair."),
  node(ScriptElement.Character, "MARIANNE"),
  node(ScriptElement.Dialogue, "I came here to forget the city."),
  node(ScriptElement.Parenthetical, "(a long pause)"),
  node(ScriptElement.Dialogue, "Instead I remember everyone."),
];

const TV: ScriptNode[] = [
  node(ScriptElement.Action, "COLDPILL_A TEAM SERIES — PILOT, PART 1"),
  node(ScriptElement.SceneHeading, "EXT. SUBURBAN STREET - NIGHT"),
  node(ScriptElement.Action, "Steady rain. NEON signs blur behind a bus stop."),
  node(ScriptElement.Character, "DETECTIVE LEE"),
  node(ScriptElement.Dialogue, "Start the car. The storm is a minute out."),
  node(ScriptElement.Transition, "CUT TO:"),
];

const YOUTUBE: ScriptNode[] = [
  node(ScriptElement.SceneHeading, "VIDEO - INTRO (0:00 - 0:10)"),
  node(ScriptElement.Character, "HOST (V.O.)"),
  node(ScriptElement.Dialogue, "Ten tools that ruined and saved my editing."),
  node(ScriptElement.Action, "QUICK CUTS of keyboard, screen, coffee."),
  node(ScriptElement.Transition, "CUT TO:"),
];

const NOVEL: ScriptNode[] = [
  node(ScriptElement.Centered, "CHAPTER ONE"),
  node(ScriptElement.Action, "Mira woke to the sound of the sea."),
  node(ScriptElement.Action, "The same sound she had heard every morning for forty years, and yet this morning it meant something else."),
];

const SUBTITLE: ScriptNode[] = [
  node(ScriptElement.Action, "Subtitle project — press the Subtitle tab to edit cues."),
];

const SEEDS: TemplateSeed[] = [
  { key: "standard", labelKey: "template.standard", descKey: "template.standardDesc", type: "screenplay", language: "en", icon: "clapperboard", color: "#6366f1", seed: () => STANDARD },
  { key: "stage", labelKey: "template.stagePlay", descKey: "template.stagePlayDesc", type: "screenplay", language: "en", icon: "theater", color: "#db2777", seed: () => STAGE },
  { key: "tv", labelKey: "template.tvPilot", descKey: "template.tvPilotDesc", type: "screenplay", language: "en", icon: "tv", color: "#ea580c", seed: () => TV },
  { key: "youtube", labelKey: "template.youtube", descKey: "template.youtubeDesc", type: "screenplay", language: "en", icon: "youtube", color: "#dc2626", seed: () => YOUTUBE },
  { key: "novel", labelKey: "template.novel", descKey: "template.novelDesc", type: "manuscript", language: "en", icon: "book", color: "#16a34a", seed: () => NOVEL },
  { key: "subtitle", labelKey: "template.subtitle", descKey: "template.subtitleDesc", type: "subtitle", language: "en", icon: "captions", color: "#0ea5e9", seed: () => SUBTITLE },
];

export const TEMPLATES: TemplateSeed[] = SEEDS;

export function buildTemplateProject(key: string): { pkg: Ascript; descriptor: ProjectDescriptor } {
  const t = TEMPLATES.find((x) => x.key === key) ?? TEMPLATES[0];
  const pkg = createAscript(t.language, t.type);
  pkg.metadata.title = "Untitled Screenplay";
  const nodes = t.seed();
  pkg.content.script_nodes = nodes;

  const stats = computeStats(nodes);
  const descriptor: ProjectDescriptor = {
    id: projectStableId(pkg),
    title: pkg.metadata.title,
    author: pkg.metadata.author,
    type: pkg.metadata.type,
    language: pkg.metadata.language,
    createdAt: pkg.metadata.created_at,
    updatedAt: pkg.metadata.updated_at,
    wordCount: stats.words,
    sceneCount: stats.scenes,
    thumbnail: { accent: t.color, glyph: "✎" },
  };
  return { pkg, descriptor };
}