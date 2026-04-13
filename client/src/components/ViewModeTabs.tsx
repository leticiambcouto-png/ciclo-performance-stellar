import { Users, User } from "lucide-react";
import type { ViewMode } from "@/hooks/useViewMode";

interface ViewModeTabsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showTabs: boolean;
}

/**
 * Tab switcher shown at the top of feature pages for users who have both
 * "Gestão do Time" and "Minhas Avaliações" views (i.e., gestores).
 */
export function ViewModeTabs({ viewMode, setViewMode, showTabs }: ViewModeTabsProps) {
  if (!showTabs) return null;

  const tabs: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: "team",
      label: "Gestão do Time",
      icon: <Users size={15} />,
    },
    {
      id: "self",
      label: "Minhas Avaliações",
      icon: <User size={15} />,
    },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl mb-6"
      style={{ backgroundColor: "#020f1e", border: "1px solid #0a3060" }}
    >
      {tabs.map((tab) => {
        const isActive = viewMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: isActive ? "#0a3060" : "transparent",
              color: isActive ? "#d9f22a" : "#8aa3c0",
              border: isActive ? "1px solid #1a4a80" : "1px solid transparent",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
