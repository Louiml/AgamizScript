import { useTranslation } from "react-i18next";
import {
  Captions,
  LayoutGrid,
  Users,
  MapPin,
  Settings,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { cn } from "@/utils/cn";

export type Pane = "editor" | "subtitle" | "bible" | "cards";

export function Sidebar({
  activePane,
  onSelectPane,
}: {
  activePane: Pane;
  onSelectPane: (pane: Pane) => void;
}) {
  const { t } = useTranslation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setView = useAppStore((s) => s.setView);
  const activePkg = useProjectStore((s) => (s.activeId ? s.openTabs[s.activeId] : null));

  const type = activePkg?.metadata.type ?? "screenplay";

  const items: { pane: Pane; icon: React.ElementType; label: string; visible: boolean }[] = [
    {
      pane: "editor",
      icon: LayoutGrid,
      label: type === "manuscript" ? t("editor.manuscript") : t("editor.screenplay"),
      visible: type !== "subtitle",
    },
    { pane: "subtitle", icon: Captions, label: t("editor.subtitles"), visible: type === "subtitle" },
    { pane: "bible", icon: Users, label: t("bible.characters"), visible: true },
    { pane: "cards", icon: MapPin, label: t("editor.cards"), visible: true },
  ];

  return (
    <nav
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-line bg-surface/60 backdrop-blur-md transition-all",
        collapsed ? "w-12" : "w-52",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-12 items-center px-3", collapsed && "justify-center px-0")}>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-ink">
            {t("app.name")}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-ink-muted hover:text-ink"
          title="Collapse"
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <div className="flex-1 space-y-0.5 px-2 py-2">
        <NavItem
          icon={Home}
          label={t("app.recentProjects")}
          collapsed={collapsed}
          onClick={() => setView("landing")}
        />

        {items
          .filter((i) => i.visible)
          .map((item) => (
            <NavItem
              key={item.pane}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              active={activePane === item.pane}
              onClick={() => onSelectPane(item.pane)}
            />
          ))}
      </div>

      <div className="border-t border-line p-2">
        <NavItem
          icon={Settings}
          label={t("app.settings")}
          collapsed={collapsed}
          onClick={() => setView("settings")}
        />
      </div>
    </nav>
  );
}

function NavItem({
  icon: Icon,
  label,
  collapsed,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink",
        collapsed && "justify-center px-0",
        active && "bg-accent/10 font-medium text-accent",
      )}
    >
      <Icon size={16} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}