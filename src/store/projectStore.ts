import { create } from "zustand";
import type {
  Ascript,
  BeatCard,
  CharacterEntry,
  LocationEntry,
  ProjectDescriptor,
  ProjectLanguage,
  ProjectType,
  ScriptNode,
  SubtitleCue,
} from "@/types/script";
import { createAscript } from "@/types/script";

interface ProjectStore {
  /** Recent-open descriptors shown on the landing screen. */
  recent: ProjectDescriptor[];
  /** Currently loaded packages keyed by tab id. */
  openTabs: Record<string, Ascript>;
  nodes: ScriptNode[];
  subtitles: SubtitleCue[];
  activeId: string | null;
  dirty: boolean;
  revisionLabel: string;
  revisionSeed: number;

  addRecent: (descriptor: ProjectDescriptor) => void;
  removeRecent: (id: string) => void;
  createProject: (language: ProjectLanguage, type: ProjectType) => Ascript;
  openProject: (pkg: Ascript) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  patchMeta: (patch: Partial<Ascript["metadata"]>) => void;
  setNodes: (nodes: ScriptNode[]) => void;
  setSubtitles: (subs: SubtitleCue[]) => void;
  setDirty: (dirty: boolean) => void;
  bumpRevision: () => void;
  setRevisionLabel: (label: string) => void;
  upsertCharacter: (entry: CharacterEntry) => void;
  upsertLocation: (entry: LocationEntry) => void;
  removeCharacter: (id: string) => void;
  removeLocation: (id: string) => void;
  upsertCard: (card: BeatCard) => void;
  removeCard: (id: string) => void;
  reorderCards: (fromId: string, toId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  recent: [],
  openTabs: {},
  nodes: [],
  subtitles: [],
  activeId: null,
  dirty: false,
  revisionLabel: "White Draft",
  revisionSeed: 0,

  addRecent: (descriptor) =>
    set((s) => ({
      recent: [descriptor, ...s.recent.filter((r) => r.id !== descriptor.id)].slice(0, 12),
    })),

  removeRecent: (id) =>
    set((s) => ({ recent: s.recent.filter((r) => r.id !== id) })),

  createProject: (language: ProjectLanguage = "en", type: ProjectType = "screenplay") =>
    createAscript(language, type),

  openProject: (pkg) => {
    const id = tabId(pkg);
    set((s) => ({
      openTabs: { ...s.openTabs, [id]: pkg },
      nodes: pkg.content.script_nodes,
      subtitles: pkg.content.subtitles,
      activeId: id,
      dirty: false,
    }));
  },

  closeTab: (id) =>
    set((s) => {
      const tabs = { ...s.openTabs };
      delete tabs[id];
      const remaining = Object.keys(tabs);
      const next = remaining[0] ? tabs[remaining[0]] : null;
      return {
        openTabs: tabs,
        activeId: next ? tabId(next) : null,
        nodes: next?.content.script_nodes ?? [],
        subtitles: next?.content.subtitles ?? [],
      };
    }),

  setActive: (id) =>
    set((s) => {
      const pkg = s.openTabs[id];
      return {
        activeId: id,
        nodes: pkg?.content.script_nodes ?? [],
        subtitles: pkg?.content.subtitles ?? [],
      };
    }),

  patchMeta: (patch) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        metadata: { ...pkg.metadata, ...patch, updated_at: new Date().toISOString() },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  setNodes: (nodes) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        metadata: { ...pkg.metadata, updated_at: new Date().toISOString() },
        content: { ...pkg.content, script_nodes: nodes },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, nodes, dirty: true };
    }),

  setSubtitles: (subtitles) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        metadata: { ...pkg.metadata, updated_at: new Date().toISOString() },
        content: { ...pkg.content, subtitles },
      };
      return {
        openTabs: { ...s.openTabs, [s.activeId]: next },
        subtitles,
        dirty: true,
      };
    }),

  setDirty: (dirty) => set({ dirty }),

  bumpRevision: () => set((s) => ({ revisionSeed: s.revisionSeed + 1, dirty: true })),
  setRevisionLabel: (revisionLabel) => set({ revisionLabel, dirty: true }),

  upsertCharacter: (entry) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const chars = [
        ...pkg.bible.characters.filter((c) => c.id !== entry.id),
        entry,
      ].sort((a, b) => a.name.localeCompare(b.name));
      const next: Ascript = {
        ...pkg,
        bible: { ...pkg.bible, characters: chars },
        metadata: { ...pkg.metadata, updated_at: new Date().toISOString() },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  upsertLocation: (entry) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const locs = [
        ...pkg.bible.locations.filter((l) => l.id !== entry.id),
        entry,
      ].sort((a, b) => a.name.localeCompare(b.name));
      const next: Ascript = {
        ...pkg,
        bible: { ...pkg.bible, locations: locs },
        metadata: { ...pkg.metadata, updated_at: new Date().toISOString() },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  removeCharacter: (id) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        bible: {
          ...pkg.bible,
          characters: pkg.bible.characters.filter((c) => c.id !== id),
        },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  removeLocation: (id) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        bible: {
          ...pkg.bible,
          locations: pkg.bible.locations.filter((l) => l.id !== id),
        },
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  upsertCard: (card) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        cards: [...pkg.cards.filter((c) => c.id !== card.id), card],
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  removeCard: (id) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const next: Ascript = {
        ...pkg,
        cards: pkg.cards.filter((c) => c.id !== id),
      };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),

  reorderCards: (fromId, toId) =>
    set((s) => {
      if (!s.activeId) return s;
      const pkg = s.openTabs[s.activeId];
      if (!pkg) return s;
      const cards = [...pkg.cards];
      const fromIdx = cards.findIndex((c) => c.id === fromId);
      const toIdx = cards.findIndex((c) => c.id === toId);
      if (fromIdx < 0 || toIdx < 0) return s;
      const [moved] = cards.splice(fromIdx, 1);
      cards.splice(toIdx, 0, moved);
      const next: Ascript = { ...pkg, cards };
      return { openTabs: { ...s.openTabs, [s.activeId]: next }, dirty: true };
    }),
}));

export const selectActivePkg = (s: ProjectStore) =>
  s.activeId ? s.openTabs[s.activeId] : null;

/** Stable tab id for a package. */
export function tabId(pkg: Ascript): string {
  return `${pkg.metadata.type}-${pkg.metadata.language}-${pkg.metadata.title}-${pkg.metadata.created_at}`;
}