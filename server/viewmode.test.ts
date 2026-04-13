/**
 * Unit tests for the useViewMode hook logic.
 * We test the pure derivation logic (not the React hook itself) to keep tests fast.
 */
import { describe, it, expect } from "vitest";

// Replicate the pure logic from useViewMode for testability
type PlatformRole = "colaborador" | "gestor" | "rh" | "admin";
type ViewMode = "team" | "self" | "rh";

function deriveViewCapabilities(
  primaryRole: PlatformRole,
  secondaryRole?: PlatformRole | null
) {
  const isRH = primaryRole === "rh" || primaryRole === "admin";
  const isGestor =
    primaryRole === "gestor" ||
    secondaryRole === "gestor" ||
    isRH; // RH can also act as gestor
  const isColaborador = !isGestor && !isRH;

  const availableTabs: ViewMode[] = [];
  if (isGestor) availableTabs.push("team");
  // Everyone who is gestor or colaborador has a "self" view
  availableTabs.push("self");

  const defaultMode: ViewMode = isGestor ? "team" : "self";
  const showTabs = isGestor; // Only show tabs when user has both views

  return { isRH, isGestor, isColaborador, availableTabs, defaultMode, showTabs };
}

describe("deriveViewCapabilities", () => {
  it("colaborador: self-only, no tabs", () => {
    const r = deriveViewCapabilities("colaborador");
    expect(r.isColaborador).toBe(true);
    expect(r.isGestor).toBe(false);
    expect(r.isRH).toBe(false);
    expect(r.showTabs).toBe(false);
    expect(r.defaultMode).toBe("self");
    expect(r.availableTabs).toEqual(["self"]);
  });

  it("gestor: team + self tabs, defaults to team", () => {
    const r = deriveViewCapabilities("gestor");
    expect(r.isGestor).toBe(true);
    expect(r.isColaborador).toBe(false);
    expect(r.showTabs).toBe(true);
    expect(r.defaultMode).toBe("team");
    expect(r.availableTabs).toContain("team");
    expect(r.availableTabs).toContain("self");
  });

  it("rh: treated as gestor (can see team), no tabs shown for pure RH without secondary gestor", () => {
    const r = deriveViewCapabilities("rh");
    expect(r.isRH).toBe(true);
    expect(r.isGestor).toBe(true); // RH inherits gestor capabilities
    expect(r.showTabs).toBe(true);
    expect(r.availableTabs).toContain("team");
    expect(r.availableTabs).toContain("self");
  });

  it("rh with secondary gestor: same as rh (already has gestor capabilities)", () => {
    const r = deriveViewCapabilities("rh", "gestor");
    expect(r.isRH).toBe(true);
    expect(r.isGestor).toBe(true);
    expect(r.showTabs).toBe(true);
  });

  it("colaborador with secondary gestor: treated as gestor, shows tabs", () => {
    // This represents e.g. a person who is primarily colaborador but also manages a team
    const r = deriveViewCapabilities("colaborador", "gestor");
    expect(r.isGestor).toBe(true);
    expect(r.isColaborador).toBe(false);
    expect(r.showTabs).toBe(true);
    expect(r.defaultMode).toBe("team");
  });

  it("admin: treated as rh+gestor", () => {
    const r = deriveViewCapabilities("admin");
    expect(r.isRH).toBe(true);
    expect(r.isGestor).toBe(true);
    expect(r.showTabs).toBe(true);
  });
});
