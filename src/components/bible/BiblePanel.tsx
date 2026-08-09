import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, User, MapPin } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import type { CharacterEntry, LocationEntry } from "@/types/script";
import { uid } from "@/utils/cn";
import { cn } from "@/utils/cn";

const TABS = ["characters", "locations"] as const;

function blankCard(t: (key: string) => string): CharacterEntry {
  return {
    id: uid(),
    name: t("bible.name"),
    age: "",
    role: "",
    description: "",
    backstory: "",
    motivation: "",
    arc: "",
    tags: [],
    updatedAt: new Date().toISOString(),
  };
}

function blankLocation(): LocationEntry {
  return {
    id: uid(),
    name: "",
    description: "",
    timeOfDay: [],
    notes: "",
    tags: [],
    updatedAt: new Date().toISOString(),
  };
}

export function BiblePanel() {
  const { t } = useTranslation();
  const activePkg = useProjectStore((s) => (s.activeId ? s.openTabs[s.activeId] : null));
  const upsertCharacter = useProjectStore((s) => s.upsertCharacter);
  const upsertLocation = useProjectStore((s) => s.upsertLocation);
  const removeCharacter = useProjectStore((s) => s.removeCharacter);
  const removeLocation = useProjectStore((s) => s.removeLocation);

  const [tab, setTab] = useState<(typeof TABS)[number]>("characters");

  const characters = activePkg?.bible.characters ?? [];
  const locations = activePkg?.bible.locations ?? [];

  const createCharacter = () => {
    upsertCharacter(blankCard(t));
  };

  const createLocation = () => {
    upsertLocation(blankLocation());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <h2 className="text-sm font-semibold text-ink">{t("bible.title")}</h2>
        <div className="ml-4 flex gap-1">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs transition-colors",
                tab === key ? "bg-accent/15 text-accent" : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              {t(`bible.${key}`)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={tab === "characters" ? createCharacter : createLocation}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white"
        >
          <Plus size={12} /> {tab === "characters" ? t("bible.addCharacter") : t("bible.addLocation")}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "characters" ? (
          characters.length === 0 ? (
            <Empty label={t("bible.noCharacters")} onCreate={createCharacter} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {characters.map((c) => {
                const fields: BibleField[] = [
                  make("name", c.name, t("bible.name")),
                  make("role", c.role ?? "", t("bible.role")),
                  make("age", c.age ?? "", t("bible.age")),
                  make("description", c.description ?? "", t("bible.description"), true),
                  make("backstory", c.backstory ?? "", t("bible.backstory"), true),
                  make("motivation", c.motivation ?? "", t("bible.motivation")),
                  make("arc", c.arc ?? "", t("bible.arc"), true),
                ];
                return (
                  <WikiCard
                    key={c.id}
                    icon={<User size={14} />}
                    accent="#8b5cf6"
                    onDelete={() => removeCharacter(c.id)}
                    onCommit={(values) =>
                      upsertCharacter({ ...c, ...values, updatedAt: new Date().toISOString() })
                    }
                    fields={fields}
                  />
                );
              })}
            </div>
          )
        ) : locations.length === 0 ? (
          <Empty label={t("bible.noLocations")} onCreate={createLocation} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {locations.map((l) => {
              const fields: FieldDef[] = [
                make("name", l.name, t("bible.name")),
                make("description", l.description, t("bible.description"), true),
                make("notes", l.notes ?? "", t("bible.backstory"), true),
              ];
              return (
                <WikiCard
                  key={l.id}
                  icon={<MapPin size={14} />}
                  accent="#0ea5e9"
                  onDelete={() => removeLocation(l.id)}
                  onCommit={(patch) =>
                    upsertLocation({ ...l, ...patch, updatedAt: new Date().toISOString() })
                  }
                  fields={fields}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

interface BibleField {
  key: string;
  label: string;
  value: string;
  textarea?: boolean;
}

type FieldDef = BibleField;

function make(key: string, value: string, label: string, textarea?: boolean): FieldDef {
  return { key, value, label, textarea };
}

function WikiCard({
  icon,
  accent,
  onDelete,
  onCommit,
  fields,
}: {
  icon: React.ReactNode;
  accent: string;
  onDelete: () => void;
  onCommit: (patch: Record<string, string>) => void;
  fields: FieldDef[];
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );

  const commitNow = () => {
    onCommit(draft);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface-raised shadow-card">
      <div
        className="flex items-center gap-2 rounded-t-2xl border-b border-line px-3 py-2"
        style={{ background: `${accent}14` }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
          {icon}
        </span>
        <input
          value={draft.name ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          onBlur={commitNow}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
        />
        <button className="text-ink-muted hover:text-red-400" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="space-y-2.5 p-3">
        {fields
          .filter((f) => f.key !== "name")
          .map((f) => (
            <label key={f.key} className="block">
              <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {f.label}
              </span>
              {f.textarea ? (
                <textarea
                  rows={2}
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  onBlur={commitNow}
                  className="w-full resize-none rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-accent/50"
                />
              ) : (
                <input
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  onBlur={commitNow}
                  className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-accent/50"
                />
              )}
            </label>
          ))}
      </div>
    </div>
  );
}

function Empty({ label, onCreate }: { label: string; onCreate: () => void }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-muted">
      <p className="mb-3">{label}</p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}