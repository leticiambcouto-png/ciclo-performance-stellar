import { useState } from "react";
import { useStellarAuth } from "@/contexts/StellarAuthContext";

/**
 * View modes available in the platform:
 * - "team"   → Gestão do Time (gestor avaliando reports)
 * - "self"   → Minhas Avaliações (usuário como liderado)
 * - "rh"     → Visão RH (apenas para usuários com papel RH)
 */
export type ViewMode = "team" | "self" | "rh";

/**
 * Determines which view tabs the current user has access to:
 *
 * | Primary Role | Secondary Role | Available Tabs                    |
 * |--------------|----------------|-----------------------------------|
 * | colaborador  | —              | self only (no tabs shown)         |
 * | gestor       | —              | team + self                       |
 * | gestor       | rh             | team + self (+ RH menu via nav)   |
 * | rh           | —              | rh only (no team/self tabs)       |
 * | rh           | gestor         | team + self + rh                  |
 *
 * Rule: Every gestor (primary OR secondary) is also a liderado → always has "self" tab.
 * Colaboradores see no tabs — single view.
 */
export function useViewMode() {
  const { user } = useStellarAuth();

  const primaryRole = (user as any)?.platformRole ?? "colaborador";
  const secondaryRole = (user as any)?.secondaryPlatformRole ?? null;

  // Determine which tabs are available
  const isGestor = primaryRole === "gestor" || secondaryRole === "gestor";
  const isRH = primaryRole === "rh" || secondaryRole === "rh";
  const isColaborador = primaryRole === "colaborador" && !isGestor && !isRH;

  // Build available tabs list
  const availableTabs: ViewMode[] = [];

  if (isGestor) {
    availableTabs.push("team");
    availableTabs.push("self");
  } else if (isRH && !isGestor) {
    // Pure RH without gestor role — only RH view (no team/self tabs in feature pages)
    availableTabs.push("self"); // RH can still see their own evaluation
  } else {
    // Pure colaborador
    availableTabs.push("self");
  }

  // Default: gestores start on "team", others on "self"
  const defaultMode: ViewMode = isGestor ? "team" : "self";
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  const showTabs = isGestor; // Only show tab switcher when user has both roles

  return {
    viewMode,
    setViewMode,
    availableTabs,
    showTabs,
    isGestor,
    isRH,
    isColaborador,
    primaryRole,
    secondaryRole,
  };
}
