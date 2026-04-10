import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { employees } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const CUSTOM_AUTH_COOKIE = "stellar_session";
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "stellar-gaming-secret-key-2026"
);

export interface StellarSessionPayload {
  employeeId: number;
  email: string;
  name: string;
  platformRole: "rh" | "gestor" | "colaborador";
}

export async function signStellarToken(payload: StellarSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET_KEY);
}

export async function verifyStellarToken(token: string): Promise<StellarSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload as unknown as StellarSessionPayload;
  } catch {
    return null;
  }
}

export function getStellarCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export const customAuthRouter = Router();

// POST /api/auth/login
customAuthRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados indisponível." });
    }

    // Find employee by email
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email.toLowerCase().trim()))
      .limit(1);

    const employee = result[0];

    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: "Email ou senha incorretos." });
    }

    if (!employee.accessPassword) {
      return res.status(401).json({ error: "Usuário sem senha configurada. Contate o RH." });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, employee.accessPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Email ou senha incorretos." });
    }

    // Create JWT token
    const payload: StellarSessionPayload = {
      employeeId: employee.id,
      email: employee.email || "",
      name: employee.name || "",
      platformRole: employee.platformRole as "rh" | "gestor" | "colaborador",
    };

    const token = await signStellarToken(payload);
    const isSecure = req.protocol === "https";

    res.cookie(CUSTOM_AUTH_COOKIE, token, getStellarCookieOptions(isSecure));

    return res.json({
      success: true,
      user: {
        ...payload,
        mustChangePassword: employee.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("[CustomAuth] Login error:", err);
    return res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
});

// POST /api/auth/logout
customAuthRouter.post("/logout", (req, res) => {
  const isSecure = req.protocol === "https";
  res.clearCookie(CUSTOM_AUTH_COOKIE, {
    ...getStellarCookieOptions(isSecure),
    maxAge: -1,
  });
  return res.json({ success: true });
});

// GET /api/auth/me
customAuthRouter.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.[CUSTOM_AUTH_COOKIE];
    if (!token) {
      return res.status(401).json({ user: null });
    }

    const payload = await verifyStellarToken(token);
    if (!payload) {
      return res.status(401).json({ user: null });
    }

    // Refresh user data from DB
    const db = await getDb();
    if (!db) {
      return res.json({ user: payload });
    }

    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.id, payload.employeeId))
      .limit(1);

    const employee = result[0];
    if (!employee || !employee.isActive) {
      res.clearCookie(CUSTOM_AUTH_COOKIE);
      return res.status(401).json({ user: null });
    }

    return res.json({
      user: {
        employeeId: employee.id,
        email: employee.email || "",
        name: employee.name || "",
        platformRole: employee.platformRole,
        managerId: employee.managerId,
        area: employee.area,
        diretoria: employee.diretoria,
        cargo: employee.jobTitle,
        mustChangePassword: employee.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("[CustomAuth] Me error:", err);
    return res.status(500).json({ user: null });
  }
});

// POST /api/auth/change-password
customAuthRouter.post("/change-password", async (req, res) => {
  try {
    const token = req.cookies?.[CUSTOM_AUTH_COOKIE];
    if (!token) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    const payload = await verifyStellarToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Sessão inválida." });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres." });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Banco de dados indisponível." });
    }

    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.id, payload.employeeId))
      .limit(1);

    const employee = result[0];
    if (!employee || !employee.accessPassword) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, employee.accessPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    // Clear mustChangePassword flag after successful password change
    await db
      .update(employees)
      .set({ accessPassword: newHash, mustChangePassword: false })
      .where(eq(employees.id, payload.employeeId));

    return res.json({ success: true });
  } catch (err) {
    console.error("[CustomAuth] Change password error:", err);
    return res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
});
