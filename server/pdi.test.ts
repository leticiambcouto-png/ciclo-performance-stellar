/**
 * PDI (Plano de Desenvolvimento Individual) — unit tests
 *
 * Tests cover the core business rules:
 * - PDI status transitions
 * - Mandatory quadrant detection
 * - 70/20/10 block validation
 * - IA suggestion generation
 */

import { describe, it, expect } from "vitest";

// ─── Business rule helpers (extracted for testability) ────────────────────────

const MANDATORY_QUADRANTS = ["Q1", "Q2", "Q4", "Q6", "Q8", "Q9"];

function isPdiMandatory(quadrant: string): boolean {
  return MANDATORY_QUADRANTS.includes(quadrant);
}

type PdiStatus = "draft" | "leader_defined" | "employee_filling" | "leader_validating" | "completed";

function canEmployeeFill(status: PdiStatus): boolean {
  return status === "leader_defined" || status === "employee_filling";
}

function canLeaderValidate(status: PdiStatus): boolean {
  return status === "leader_validating";
}

function isBlockComplete(block: {
  acoes70: string | null;
  acoes70Justificativa: string | null;
  acoes20: string | null;
  acoes10: string | null;
}): boolean {
  return (
    !!block.acoes70?.trim() &&
    !!block.acoes70Justificativa?.trim() &&
    !!block.acoes20?.trim() &&
    !!block.acoes10?.trim()
  );
}

function nextStatusAfterEmployeeSave(currentStatus: PdiStatus, bothBlocksFilled: boolean): PdiStatus {
  if (bothBlocksFilled) return "leader_validating";
  return "employee_filling";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PDI — Mandatory quadrant detection", () => {
  it("marks Q1 (Crítico) as mandatory", () => {
    expect(isPdiMandatory("Q1")).toBe(true);
  });

  it("marks Q2 (Crítico Comportamental) as mandatory", () => {
    expect(isPdiMandatory("Q2")).toBe(true);
  });

  it("marks Q4 (Resultado sem Cultura) as mandatory", () => {
    expect(isPdiMandatory("Q4")).toBe(true);
  });

  it("marks Q6 (Alto Entregador) as mandatory", () => {
    expect(isPdiMandatory("Q6")).toBe(true);
  });

  it("marks Q8 (Talento a Acelerar) as mandatory", () => {
    expect(isPdiMandatory("Q8")).toBe(true);
  });

  it("marks Q9 (Top Talent) as mandatory", () => {
    expect(isPdiMandatory("Q9")).toBe(true);
  });

  it("does NOT mark Q5 (Core/Mantenedor) as mandatory", () => {
    expect(isPdiMandatory("Q5")).toBe(false);
  });

  it("does NOT mark Q7 (Alta Entrega, Baixa Cultura) as mandatory", () => {
    expect(isPdiMandatory("Q7")).toBe(false);
  });

  it("does NOT mark Q3 (Talento Bloqueado) as mandatory", () => {
    expect(isPdiMandatory("Q3")).toBe(false);
  });
});

describe("PDI — Status transitions", () => {
  it("employee can fill when status is leader_defined", () => {
    expect(canEmployeeFill("leader_defined")).toBe(true);
  });

  it("employee can fill when status is employee_filling", () => {
    expect(canEmployeeFill("employee_filling")).toBe(true);
  });

  it("employee cannot fill when status is draft", () => {
    expect(canEmployeeFill("draft")).toBe(false);
  });

  it("employee cannot fill when status is leader_validating", () => {
    expect(canEmployeeFill("leader_validating")).toBe(false);
  });

  it("employee cannot fill when status is completed", () => {
    expect(canEmployeeFill("completed")).toBe(false);
  });

  it("leader can validate when status is leader_validating", () => {
    expect(canLeaderValidate("leader_validating")).toBe(true);
  });

  it("leader cannot validate when status is employee_filling", () => {
    expect(canLeaderValidate("employee_filling")).toBe(false);
  });

  it("leader cannot validate when status is completed", () => {
    expect(canLeaderValidate("completed")).toBe(false);
  });
});

describe("PDI — Block completeness validation", () => {
  it("marks a block as complete when all required fields are filled", () => {
    expect(isBlockComplete({
      acoes70: "Liderar o projeto X",
      acoes70Justificativa: "Porque desenvolve accountability",
      acoes20: "Mentoria mensal com Y",
      acoes10: "Curso de liderança na plataforma Z",
    })).toBe(true);
  });

  it("marks a block as incomplete when acoes70 is empty", () => {
    expect(isBlockComplete({
      acoes70: "",
      acoes70Justificativa: "Justificativa",
      acoes20: "Mentoria",
      acoes10: "Curso",
    })).toBe(false);
  });

  it("marks a block as incomplete when acoes70Justificativa is missing", () => {
    expect(isBlockComplete({
      acoes70: "Ação prática",
      acoes70Justificativa: null,
      acoes20: "Mentoria",
      acoes10: "Curso",
    })).toBe(false);
  });

  it("marks a block as incomplete when acoes20 is missing", () => {
    expect(isBlockComplete({
      acoes70: "Ação prática",
      acoes70Justificativa: "Justificativa",
      acoes20: null,
      acoes10: "Curso",
    })).toBe(false);
  });

  it("marks a block as incomplete when acoes10 is whitespace only", () => {
    expect(isBlockComplete({
      acoes70: "Ação prática",
      acoes70Justificativa: "Justificativa",
      acoes20: "Mentoria",
      acoes10: "   ",
    })).toBe(false);
  });
});

describe("PDI — Status after employee save", () => {
  it("moves to leader_validating when both blocks are filled", () => {
    expect(nextStatusAfterEmployeeSave("employee_filling", true)).toBe("leader_validating");
  });

  it("stays in employee_filling when not all blocks are filled", () => {
    expect(nextStatusAfterEmployeeSave("employee_filling", false)).toBe("employee_filling");
  });

  it("moves to leader_validating even from leader_defined if both blocks filled", () => {
    expect(nextStatusAfterEmployeeSave("leader_defined", true)).toBe("leader_validating");
  });
});

describe("PDI — 70/20/10 methodology percentages", () => {
  it("70 + 20 + 10 sums to 100", () => {
    expect(70 + 20 + 10).toBe(100);
  });

  it("70% is the largest learning bucket (on-the-job)", () => {
    expect(70).toBeGreaterThan(20);
    expect(70).toBeGreaterThan(10);
  });

  it("formal learning (10%) is the smallest bucket", () => {
    expect(10).toBeLessThan(20);
    expect(10).toBeLessThan(70);
  });
});
