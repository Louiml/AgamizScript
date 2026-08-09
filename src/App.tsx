import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { LandingPage } from "@/components/landing/LandingPage";
import { Workspace } from "@/components/layout/Workspace";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useTheme } from "@/hooks/useTheme";
import { useI18nDirection } from "@/i18n/useI18n";
import { consumeLaunchFile } from "@/lib/io";

export function App() {
  useTheme();
  useI18nDirection();

  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const openProject = useProjectStore((s) => s.openProject);
  const activeId = useProjectStore((s) => s.activeId);

  useEffect(() => {
    void (async () => {
      const pkg = await consumeLaunchFile();
      if (pkg) {
        openProject(pkg);
        setView("workspace");
      }
    })();
  }, [openProject, setView]);

  return (
    <div className="h-full w-full overflow-hidden bg-surface text-ink">
      {view === "workspace" &&
        (activeId ? <Workspace /> : <LandingPage />)}
      {view === "landing" && <LandingPage />}
      {view === "settings" && <SettingsPanel />}
    </div>
  );
}