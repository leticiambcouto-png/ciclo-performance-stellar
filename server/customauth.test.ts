/**
 * Unit tests for custom auth context behavior.
 * Tests the synthetic negative ID convention used for employees
 * who only exist in the employees table (no users table entry).
 */
import { describe, it, expect } from "vitest";

// ─── SYNTHETIC ID LOGIC ───────────────────────────────────────────────────────

/**
 * Replicates the getEmployeeByUserId logic for unit testing:
 * - Positive userId: look up employees.userId = userId
 * - Negative userId: look up employees.id = -userId (synthetic ID for custom-auth users)
 */
function resolveEmployeeQuery(userId: number): { type: "byUserId" | "byId"; id: number } {
  if (userId < 0) {
    return { type: "byId", id: -userId };
  }
  return { type: "byUserId", id: userId };
}

describe("getEmployeeByUserId synthetic ID convention", () => {
  it("positive userId: queries by employees.userId", () => {
    const result = resolveEmployeeQuery(42);
    expect(result.type).toBe("byUserId");
    expect(result.id).toBe(42);
  });

  it("negative userId: queries by employees.id (custom auth user)", () => {
    const result = resolveEmployeeQuery(-15);
    expect(result.type).toBe("byId");
    expect(result.id).toBe(15);
  });

  it("negative userId -1: resolves to employee id 1", () => {
    const result = resolveEmployeeQuery(-1);
    expect(result.type).toBe("byId");
    expect(result.id).toBe(1);
  });

  it("large negative userId: resolves correctly", () => {
    const result = resolveEmployeeQuery(-999);
    expect(result.type).toBe("byId");
    expect(result.id).toBe(999);
  });
});

// ─── CONTEXT SYNTHETIC USER CREATION ─────────────────────────────────────────

/**
 * Replicates the synthetic user object creation logic from context.ts
 * for employees without a users table entry.
 */
function createSyntheticUser(employee: {
  id: number;
  name: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}, platformRole: "rh" | "gestor" | "colaborador", secondaryPlatformRole?: "rh" | "gestor" | "colaborador" | null) {
  return {
    id: -(employee.id),
    openId: `employee:${employee.id}`,
    name: employee.name,
    email: employee.email,
    loginMethod: "custom",
    role: "user" as const,
    platformRole,
    secondaryPlatformRole: secondaryPlatformRole ?? null,
    employeeId: employee.id,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    lastSignedIn: new Date(),
  };
}

describe("createSyntheticUser", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const emp = { id: 7, name: "Maria Silva", email: "maria@stellar.com", createdAt: now, updatedAt: now };

  it("creates synthetic user with negative ID", () => {
    const user = createSyntheticUser(emp, "colaborador");
    expect(user.id).toBe(-7);
  });

  it("employeeId is the original positive employee ID", () => {
    const user = createSyntheticUser(emp, "gestor");
    expect(user.employeeId).toBe(7);
  });

  it("openId follows employee: convention", () => {
    const user = createSyntheticUser(emp, "rh");
    expect(user.openId).toBe("employee:7");
  });

  it("platformRole is correctly set", () => {
    const user = createSyntheticUser(emp, "gestor");
    expect(user.platformRole).toBe("gestor");
  });

  it("secondaryPlatformRole is correctly set", () => {
    const user = createSyntheticUser(emp, "gestor", "rh");
    expect(user.secondaryPlatformRole).toBe("rh");
  });

  it("secondaryPlatformRole defaults to null when not provided", () => {
    const user = createSyntheticUser(emp, "colaborador");
    expect(user.secondaryPlatformRole).toBeNull();
  });

  it("loginMethod is custom", () => {
    const user = createSyntheticUser(emp, "colaborador");
    expect(user.loginMethod).toBe("custom");
  });

  it("resolveEmployeeQuery with synthetic user ID returns correct employee", () => {
    const user = createSyntheticUser(emp, "colaborador");
    const query = resolveEmployeeQuery(user.id);
    expect(query.type).toBe("byId");
    expect(query.id).toBe(emp.id);
  });
});
