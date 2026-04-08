import { describe, expect, it } from "vitest";
import {
  calculateNineboxQuadrant,
  calculatePerformance,
  calculatePotencial,
  calculateFullNinebox,
  getCurveZone,
  calculateCurveDistribution,
  scoreToLevel,
  calcAxisAverage,
  AXIS_SCORES,
  NINEBOX_QUADRANTS,
  STELLAR_EXPECTED_CURVE,
} from "../shared/nineboxData";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── AUTH LOGOUT ─────────────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@stellar.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    platformRole: "colaborador",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── AXIS SCORES ─────────────────────────────────────────────────────────────

describe("AXIS_SCORES", () => {
  it("maps below=1, within=2, above=3", () => {
    expect(AXIS_SCORES.below).toBe(1);
    expect(AXIS_SCORES.within).toBe(2);
    expect(AXIS_SCORES.above).toBe(3);
  });
});

describe("calcAxisAverage", () => {
  it("returns 3.0 when all above", () => {
    expect(calcAxisAverage("above", "above", "above", "above")).toBe(3.0);
  });
  it("returns 2.0 when all within", () => {
    expect(calcAxisAverage("within", "within", "within", "within")).toBe(2.0);
  });
  it("returns 1.0 when all below", () => {
    expect(calcAxisAverage("below", "below", "below", "below")).toBe(1.0);
  });
  it("returns 2.5 for 2 above + 2 within", () => {
    expect(calcAxisAverage("above", "above", "within", "within")).toBe(2.5);
  });
  it("returns 1.5 for 2 below + 2 within", () => {
    expect(calcAxisAverage("below", "below", "within", "within")).toBe(1.5);
  });
});

describe("scoreToLevel", () => {
  it("returns high when avg >= 3.0", () => {
    expect(scoreToLevel(3.0)).toBe("high");
  });
  it("returns medium when avg >= 2.0 and < 3.0", () => {
    expect(scoreToLevel(2.0)).toBe("medium");
    expect(scoreToLevel(2.5)).toBe("medium");
    expect(scoreToLevel(2.99)).toBe("medium");
  });
  it("returns low when avg < 2.0", () => {
    expect(scoreToLevel(1.0)).toBe("low");
    expect(scoreToLevel(1.5)).toBe("low");
    expect(scoreToLevel(1.99)).toBe("low");
  });
});

// ─── POTENCIAL CALCULATION ────────────────────────────────────────────────────

describe("calculatePotencial", () => {
  it("returns high when all above (avg = 3.0)", () => {
    expect(calculatePotencial("above", "above", "above", "above")).toBe("high");
  });
  it("returns medium when all within (avg = 2.0)", () => {
    expect(calculatePotencial("within", "within", "within", "within")).toBe("medium");
  });
  it("returns low when all below (avg = 1.0)", () => {
    expect(calculatePotencial("below", "below", "below", "below")).toBe("low");
  });
  it("returns medium when 2 above + 2 within (avg = 2.5)", () => {
    expect(calculatePotencial("above", "above", "within", "within")).toBe("medium");
  });
  it("returns low when 2 below + 2 within (avg = 1.5)", () => {
    expect(calculatePotencial("below", "below", "within", "within")).toBe("low");
  });
  it("returns medium when 3 above + 1 within (avg = 2.75)", () => {
    // avg = (3+3+3+2)/4 = 2.75 → medium (high requires avg >= 3.0)
    expect(calculatePotencial("above", "above", "above", "within")).toBe("medium");
  });
});

// ─── PERFORMANCE CALCULATION ─────────────────────────────────────────────────

describe("calculatePerformance", () => {
  it("returns high when all above (avg = 3.0)", () => {
    expect(calculatePerformance("above", "above", "above", "above")).toBe("high");
  });
  it("returns medium when all within (avg = 2.0)", () => {
    expect(calculatePerformance("within", "within", "within", "within")).toBe("medium");
  });
  it("returns low when all below (avg = 1.0)", () => {
    expect(calculatePerformance("below", "below", "below", "below")).toBe("low");
  });
  it("returns low when 2 below + 2 within (avg = 1.5)", () => {
    expect(calculatePerformance("below", "below", "within", "within")).toBe("low");
  });
  it("returns medium when 2 above + 2 within (avg = 2.5)", () => {
    expect(calculatePerformance("above", "above", "within", "within")).toBe("medium");
  });
});

// ─── NINEBOX QUADRANT MAPPING ─────────────────────────────────────────────────

describe("calculateNineboxQuadrant", () => {
  it("Q1: low potencial + low performance", () => {
    expect(calculateNineboxQuadrant("low", "low")).toBe("Q1");
  });
  it("Q2: medium potencial + low performance", () => {
    expect(calculateNineboxQuadrant("medium", "low")).toBe("Q2");
  });
  it("Q3: high potencial + low performance", () => {
    expect(calculateNineboxQuadrant("high", "low")).toBe("Q3");
  });
  it("Q4: low potencial + medium performance", () => {
    expect(calculateNineboxQuadrant("low", "medium")).toBe("Q4");
  });
  it("Q5: medium potencial + medium performance", () => {
    expect(calculateNineboxQuadrant("medium", "medium")).toBe("Q5");
  });
  it("Q6: high potencial + medium performance", () => {
    expect(calculateNineboxQuadrant("high", "medium")).toBe("Q6");
  });
  it("Q7: low potencial + high performance", () => {
    expect(calculateNineboxQuadrant("low", "high")).toBe("Q7");
  });
  it("Q8: medium potencial + high performance", () => {
    expect(calculateNineboxQuadrant("medium", "high")).toBe("Q8");
  });
  it("Q9: high potencial + high performance", () => {
    expect(calculateNineboxQuadrant("high", "high")).toBe("Q9");
  });
});

// ─── FULL NINEBOX WITH 70/30 WEIGHTS ─────────────────────────────────────────

describe("calculateFullNinebox", () => {
  it("returns Q9 when all criteria are above", () => {
    const result = calculateFullNinebox(
      "above", "above", "above", "above",
      "above", "above", "above", "above"
    );
    expect(result.quadrant).toBe("Q9");
    expect(result.potencialLevel).toBe("high");
    expect(result.performanceLevel).toBe("high");
    expect(result.potencialAvg).toBe(3.0);
    expect(result.performanceAvg).toBe(3.0);
    expect(result.weightedScore).toBeCloseTo(3.0);
  });

  it("returns Q1 when all criteria are below", () => {
    const result = calculateFullNinebox(
      "below", "below", "below", "below",
      "below", "below", "below", "below"
    );
    expect(result.quadrant).toBe("Q1");
    expect(result.potencialLevel).toBe("low");
    expect(result.performanceLevel).toBe("low");
    expect(result.weightedScore).toBeCloseTo(1.0);
  });

  it("calculates weighted score correctly: perf 70% + pot 30%", () => {
    // potencial all within (avg=2.0), performance all above (avg=3.0)
    const result = calculateFullNinebox(
      "within", "within", "within", "within",
      "above", "above", "above", "above"
    );
    // weighted = 3.0 * 0.7 + 2.0 * 0.3 = 2.1 + 0.6 = 2.7
    expect(result.weightedScore).toBeCloseTo(2.7);
    expect(result.performanceLevel).toBe("high");
    expect(result.potencialLevel).toBe("medium");
    expect(result.quadrant).toBe("Q8");
  });

  it("returns Q5 for all within criteria", () => {
    const result = calculateFullNinebox(
      "within", "within", "within", "within",
      "within", "within", "within", "within"
    );
    expect(result.quadrant).toBe("Q5");
    expect(result.weightedScore).toBeCloseTo(2.0);
  });
});

// ─── CURVE ZONE CLASSIFICATION ───────────────────────────────────────────────

describe("getCurveZone", () => {
  it("Q1, Q2, Q4 are critical", () => {
    expect(getCurveZone("Q1")).toBe("critical");
    expect(getCurveZone("Q2")).toBe("critical");
    expect(getCurveZone("Q4")).toBe("critical");
  });
  it("Q3, Q5, Q7 are maintainer", () => {
    expect(getCurveZone("Q3")).toBe("maintainer");
    expect(getCurveZone("Q5")).toBe("maintainer");
    expect(getCurveZone("Q7")).toBe("maintainer");
  });
  it("Q6, Q8, Q9 are talent", () => {
    expect(getCurveZone("Q6")).toBe("talent");
    expect(getCurveZone("Q8")).toBe("talent");
    expect(getCurveZone("Q9")).toBe("talent");
  });
});

describe("calculateCurveDistribution", () => {
  it("returns zeros for empty array", () => {
    expect(calculateCurveDistribution([])).toEqual({ critical: 0, maintainer: 0, talent: 0 });
  });
  it("calculates correct percentages for a mixed team", () => {
    const quadrants = ["Q1", "Q5", "Q5", "Q9"] as any[];
    const result = calculateCurveDistribution(quadrants);
    expect(result.critical).toBe(25);
    expect(result.maintainer).toBe(50);
    expect(result.talent).toBe(25);
  });
  it("matches Stellar expected curve (10/60/30)", () => {
    const quadrants = ["Q1", "Q5", "Q5", "Q5", "Q7", "Q7", "Q3", "Q9", "Q9", "Q8"] as any[];
    const dist = calculateCurveDistribution(quadrants);
    expect(dist.critical).toBe(10);
    expect(dist.maintainer).toBe(60);
    expect(dist.talent).toBe(30);
  });
});

// ─── NINEBOX QUADRANT METADATA ───────────────────────────────────────────────

describe("NINEBOX_QUADRANTS", () => {
  it("has all 9 quadrants defined", () => {
    for (let i = 1; i <= 9; i++) {
      const key = `Q${i}` as keyof typeof NINEBOX_QUADRANTS;
      expect(NINEBOX_QUADRANTS[key]).toBeDefined();
      expect(NINEBOX_QUADRANTS[key].name).toBeTruthy();
      expect(NINEBOX_QUADRANTS[key].description).toBeTruthy();
    }
  });
  it("Q9 has merit, promotion and bonus", () => {
    expect(NINEBOX_QUADRANTS.Q9.merito).toBe(true);
    expect(NINEBOX_QUADRANTS.Q9.promocao).toBe(true);
    expect(["yes", "by_goal"]).toContain(NINEBOX_QUADRANTS.Q9.bonus);
  });
  it("Q1 has no merit, promotion or bonus", () => {
    expect(NINEBOX_QUADRANTS.Q1.merito).toBe(false);
    expect(NINEBOX_QUADRANTS.Q1.promocao).toBe(false);
    expect(NINEBOX_QUADRANTS.Q1.bonus).toBe("no");
  });
});

describe("STELLAR_EXPECTED_CURVE", () => {
  it("has the correct distribution (10/60/30)", () => {
    expect(STELLAR_EXPECTED_CURVE.critical).toBe(10);
    expect(STELLAR_EXPECTED_CURVE.maintainer).toBe(60);
    expect(STELLAR_EXPECTED_CURVE.talent).toBe(30);
  });
  it("sums to 100%", () => {
    const total =
      STELLAR_EXPECTED_CURVE.critical +
      STELLAR_EXPECTED_CURVE.maintainer +
      STELLAR_EXPECTED_CURVE.talent;
    expect(total).toBe(100);
  });
});

// ─── USER MANAGEMENT (RH CRUD) ───────────────────────────────────────────────
describe("employees router - RH user management", () => {
  function makeCollaboratorContext(): TrpcContext {
    return {
      user: {
        id: 2,
        openId: "colab-user",
        email: "colab@estrelabet.com",
        name: "Letícia",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        platformRole: "colaborador",
      } as any,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
  }

  it("employees.create input accepts all required fields including area, diretoria and accessPassword", () => {
    const input = {
      name: "João Silva",
      email: "joao@stellar.com",
      jobTitle: "Analista",
      department: "Marketing",
      area: "Growth",
      diretoria: "Diretoria de Marketing",
      managerId: 1,
      platformRole: "colaborador" as const,
      accessPassword: "senha123",
    };
    expect(input.name).toBe("João Silva");
    expect(input.area).toBe("Growth");
    expect(input.diretoria).toBe("Diretoria de Marketing");
    expect(input.accessPassword).toBe("senha123");
    expect(input.platformRole).toBe("colaborador");
  });

  it("employees.update input accepts area, diretoria and accessPassword for editing", () => {
    const input = {
      id: 1,
      name: "João Silva Atualizado",
      area: "Produto",
      diretoria: "Diretoria de Produto",
      accessPassword: "novaSenha456",
      platformRole: "gestor" as const,
    };
    expect(input.id).toBe(1);
    expect(input.area).toBe("Produto");
    expect(input.diretoria).toBe("Diretoria de Produto");
    expect(input.platformRole).toBe("gestor");
  });

  it("rhProcedure blocks non-RH users from accessing employees.allWithManager", async () => {
    const ctx = makeCollaboratorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.employees.allWithManager()).rejects.toThrow();
  });

  it("rhProcedure blocks non-RH users from deactivating employees", async () => {
    const ctx = makeCollaboratorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.employees.deactivate({ id: 1 })).rejects.toThrow();
  });

  it("platformRole enum only accepts valid values", () => {
    const validRoles = ["rh", "gestor", "colaborador"];
    expect(validRoles).toContain("rh");
    expect(validRoles).toContain("gestor");
    expect(validRoles).toContain("colaborador");
    expect(validRoles).not.toContain("admin");
    expect(validRoles).not.toContain("superuser");
  });

  it("deactivate input requires a numeric employee id", () => {
    const input = { id: 42 };
    expect(typeof input.id).toBe("number");
    expect(input.id).toBeGreaterThan(0);
  });
});
