import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { REVISION_COLORS, type BeatCard, type RevisionColor } from "@/types/script";
import { uid } from "@/utils/cn";
import { cn } from "@/utils/cn";

const COLORS: Record<RevisionColor, string> = {
  white: "#ffffff",
  blue: "#3b82f6",
  pink: "#ec4899",
  yellow: "#fbbf24",
  green: "#22c55e",
  salmon: "#fb7185",
  cherry: "#ef4444",
  goldenrod: "#eab308",
};

export function BeatBoard() {
  const { t } = useTranslation();
  const cards = useProjectStore((s) =>
    s.activeId ? s.openTabs[s.activeId].cards : [],
  );
  const upsertCard = useProjectStore((s) => s.upsertCard);
  const removeCard = useProjectStore((s) => s.removeCard);
  const reorder = useProjectStore((s) => s.reorderCards);
  const [dragging, setDragging] = useState<string | null>(null);

  const addCard = () => {
    if (!useProjectStore.getState().activeId) return;
    upsertCard({
      id: uid(),
      title: "",
      logline: "",
      pageInterval: "",
      color: "blue",
      tags: [],
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <h2 className="text-sm font-semibold text-ink">{t("cards.title")}</h2>
        <div className="flex-1" />
        <button
          onClick={addCard}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white"
        >
          <Plus size={12} /> {t("cards.addCard")}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-line m-4 text-sm text-ink-muted">
          {t("cards.title")} — drag to reorder.
          <button className="mt-3" onClick={addCard}>
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                isDragging={dragging === card.id}
                onDragStart={() => setDragging(card.id)}
                onDragEnd={() => setDragging(null)}
                onDropOn={(targetId) => {
                  if (dragging && dragging !== targetId) reorder(dragging, targetId);
                  setDragging(null);
                }}
                onChange={(patch) => upsertCard({ ...card, ...patch })}
                onDelete={() => removeCard(card.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  card,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onDropOn,
  onChange,
  onDelete,
}: {
  card: BeatCard;
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: (targetId: string) => void;
  onChange: (patch: Partial<BeatCard>) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const colorHex = COLORS[card.color] ?? "#3b82f6";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn(card.id);
      }}
      className={cn(
        "cursor-grab rounded-2xl border border-line bg-surface-raised p-3 shadow-card transition-shadow active:cursor-grabbing",
        isDragging && "opacity-40",
        index === 0 && "ring-1 ring-accent/30",
      )}
      style={{ borderTop: `3px solid ${colorHex}` }}
    >
      <div className="mb-1 flex items-center gap-1">
        <GripVertical size={13} className="text-ink-muted/60" />
        <span className="text-[10px] font-semibold uppercase text-ink-muted">{index + 1}</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorHex }} />
        <div className="flex-1" />
        <button className="text-ink-muted hover:text-red-400" onClick={onDelete}>
          <Trash2 size={12} />
        </button>
      </div>

      <input
        value={card.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Beat title"
        className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-muted"
      />

      <textarea
        value={card.logline}
        onChange={(e) => onChange({ logline: e.target.value })}
        placeholder={t("cards.logline")}
        rows={3}
        className="mt-1 w-full resize-none rounded-lg border border-line bg-surface px-2 py-1 text-[11px] text-ink outline-none placeholder:text-ink-muted focus:border-accent/50"
      />

      <div className="mt-2 flex items-center gap-2">
        <input
          value={card.pageInterval}
          onChange={(e) => onChange({ pageInterval: e.target.value })}
          placeholder={t("cards.pageInterval")}
          className="h-6 w-20 rounded-md border border-line bg-surface px-1.5 text-[10px] text-ink outline-none placeholder:text-ink-muted"
        />
        <select
          value={card.color}
          onChange={(e) => onChange({ color: e.target.value as BeatCard["color"] })}
          className="h-6 rounded-md border border-line bg-surface px-1 text-[10px] text-ink outline-none"
          title="Revision color"
        >
          {REVISION_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}