import { describe, expect, it } from "vitest";
import {
  calculateNineboxQuadrant,
  calculatePerformance,
  calculatePotencial,
  getCurveZone,
  calculateCurveDistribution,
  NINEBOX_QUADRANTS,
  STELLAR_EXPECTED_CURVE,
} from "../shared/nineboxData";

// ─── POTENCIAL CALCULATION ────────────────────────────────────────────────────
describe("calculatePotencial", () => {
  it("returns 'low' when accountability is 'below'", () => {
    expect(calculatePotencial("above", "above", "below", "above")).toBe("low");
  });

  it("returns 'low' when ambicao is 'below'", () => {
    expect(calculatePotencial("below", "above", "above", "above")).toBe("low");
  });

  it("returns 'high' when 3 or more criteria are 'above'", () => {
    expect(calculatePotencial("above", "above", "above", "within")).toBe("high");
    expect(calculatePotencial("above", "above", "above", "above")).toBe("high");
  });

  it("returns 'medium' for mixed results without 'below' blockers", () => {
    expect(calculatePotencial("within", "within", "within", "within")).toBe("medium");
    expect(calculatePotencial("above", "within", "within", "within")).toBe("medium");
  });
});

// ─── PERFORMANCE CALCULATION ─────────────────────────────────────────────────
describe("calculatePerformance", () => {
  it("returns 'low' when qualidade is 'below' and not 3+ above", () => {
    // 3+ above takes precedence, so use only 2 above
    expect(calculatePerformance("below", "above", "within", "above")).toBe("low");
  });

  it("returns 'low' when contribuicao is 'below' and not 3+ above", () => {
    expect(calculatePerformance("above", "below", "within", "above")).toBe("low");
  });

  it("returns 'high' when 3 or more criteria are 'above'", () => {
    expect(calculatePerformance("above", "above", "above", "within")).toBe("high");
    expect(calculatePerformance("above", "above", "above", "above")).toBe("high");
  });

  it("returns 'medium' for mixed results without blockers", () => {
    expect(calculatePerformance("within", "within", "within", "within")).toBe("medium");
  });
});

// ─── NINEBOX QUADRANT CALCULATION ────────────────────────────────────────────
describe("calculateNineboxQuadrant", () => {
  it("maps low potential + low performance to Q1", () => {
    expect(calculateNineboxQuadrant("low", "low")).toBe("Q1");
  });

  // Renumbered grid:
  //   Performance ↑
  //   Alta  │ Q7  Q8  Q9
  //   Média │ Q4  Q5  Q6
  //   Baixa │ Q1  Q2  Q3
  //          ────────────→ Potencial (Baixo | Médio | Alto)
  it("maps low potential + medium performance to Q4", () => {
    expect(calculateNineboxQuadrant("low", "medium")).toBe("Q4");
  });

  it("maps low potential + high performance to Q7", () => {
    expect(calculateNineboxQuadrant("low", "high")).toBe("Q7");
  });

  it("maps medium potential + low performance to Q2", () => {
    expect(calculateNineboxQuadrant("medium", "low")).toBe("Q2");
  });

  it("maps medium potential + medium performance to Q5", () => {
    expect(calculateNineboxQuadrant("medium", "medium")).toBe("Q5");
  });

  it("maps medium potential + high performance to Q8", () => {
    expect(calculateNineboxQuadrant("medium", "high")).toBe("Q8");
  });

  it("maps high potential + low performance to Q3", () => {
    expect(calculateNineboxQuadrant("high", "low")).toBe("Q3");
  });

  it("maps high potential + medium performance to Q6", () => {
    expect(calculateNineboxQuadrant("high", "medium")).toBe("Q6");
  });

  it("maps high potential + high performance to Q9", () => {
    expect(calculateNineboxQuadrant("high", "high")).toBe("Q9");
  });
});

// ─── CURVE ZONE CLASSIFICATION ───────────────────────────────────────────────
describe("getCurveZone", () => {
  it("classifies Q1, Q2, Q4 as critical", () => {
    expect(getCurveZone("Q1")).toBe("critical");
    expect(getCurveZone("Q2")).toBe("critical");
    expect(getCurveZone("Q4")).toBe("critical");
  });

  // After renumbering: maintainers = Q3 (high-pot/low-perf), Q5 (core), Q7 (low-pot/high-perf)
  it("classifies Q3, Q5, Q7 as maintainer", () => {
    expect(getCurveZone("Q3")).toBe("maintainer"); // Talento Bloqueado
    expect(getCurveZone("Q5")).toBe("maintainer"); // Core/Mantenedor
    expect(getCurveZone("Q7")).toBe("maintainer"); // Resultado sem Cultura
  });

  // After renumbering: talents = Q6 (high-pot/mid-perf), Q8 (mid-pot/high-perf), Q9
  it("classifies Q6, Q8, Q9 as talent", () => {
    expect(getCurveZone("Q6")).toBe("talent"); // Talento a Acelerar
    expect(getCurveZone("Q8")).toBe("talent"); // Alto Entregador
    expect(getCurveZone("Q9")).toBe("talent"); // Top Talent
  });
});

// ─── CURVE DISTRIBUTION ──────────────────────────────────────────────────────
describe("calculateCurveDistribution", () => {
  it("calculates correct percentages for a team", () => {
    // calculateCurveDistribution takes NineboxQuadrant[] directly
    const quadrants = ["Q1", "Q5", "Q5", "Q9"] as any[];
    const result = calculateCurveDistribution(quadrants);
    expect(result.critical).toBe(25);
    expect(result.maintainer).toBe(50);
    expect(result.talent).toBe(25);
  });

  it("returns zeros for empty team", () => {
    const result = calculateCurveDistribution([]);
    expect(result.critical).toBe(0);
    expect(result.maintainer).toBe(0);
    expect(result.talent).toBe(0);
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
    // Q9 bonus is 'by_goal' per the actual data
    expect(["yes", "by_goal"]).toContain(NINEBOX_QUADRANTS.Q9.bonus);
  });

  it("Q1 has no merit, promotion or bonus", () => {
    expect(NINEBOX_QUADRANTS.Q1.merito).toBe(false);
    expect(NINEBOX_QUADRANTS.Q1.promocao).toBe(false);
    expect(NINEBOX_QUADRANTS.Q1.bonus).toBe("no");
  });
});

// ─── STELLAR EXPECTED CURVE ──────────────────────────────────────────────────
describe("STELLAR_EXPECTED_CURVE", () => {
  it("has the correct expected distribution (10/60/30)", () => {
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

// ─── AUTH LOGOUT ─────────────────────────────────────────────────────────────
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

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
