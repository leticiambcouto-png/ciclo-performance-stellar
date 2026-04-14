import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyStellarToken } from "../customAuth";
import { getDb } from "../db";
import { users, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User & { secondaryPlatformRole?: string | null; employeeId?: number }) | null;
};

const STELLAR_COOKIE = "stellar_session";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (User & { secondaryPlatformRole?: string | null; employeeId?: number }) | null = null;

  try {
    // Read the stellar_session cookie (custom auth — works in any browser/domain)
    const token = opts.req.cookies?.[STELLAR_COOKIE];
    if (token) {
      const payload = await verifyStellarToken(token);
      if (payload) {
        const db = await getDb();
        if (db) {
          // First try to find user in the users table by email (Manus OAuth users)
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, payload.email))
            .limit(1);

          if (userResult[0]) {
            // Manus OAuth user found — merge with JWT platformRole
            user = {
              ...userResult[0],
              platformRole: payload.platformRole,
              secondaryPlatformRole: payload.secondaryPlatformRole ?? null,
              employeeId: payload.employeeId,
            } as User & { secondaryPlatformRole?: string | null; employeeId?: number };
          } else {
            // Custom auth user (email/password login) — only exists in employees table
            // Use employeeId from JWT to find the employee
            const empResult = await db
              .select()
              .from(employees)
              .where(eq(employees.id, payload.employeeId))
              .limit(1);

            const emp = empResult[0];
            if (emp && emp.isActive) {
              // If employee has a linked userId, fetch the user record
              if (emp.userId) {
                const linkedUser = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, emp.userId))
                  .limit(1);

                if (linkedUser[0]) {
                  user = {
                    ...linkedUser[0],
                    platformRole: payload.platformRole,
                    secondaryPlatformRole: payload.secondaryPlatformRole ?? null,
                    employeeId: payload.employeeId,
                  } as User & { secondaryPlatformRole?: string | null; employeeId?: number };
                }
              }

              // If no linked user record, create a synthetic user object
              // using the employee's ID as the user ID so getEmployeeByUserId works
              // We use a negative ID convention to distinguish synthetic users,
              // but the real lookup will use employeeId directly.
              if (!user) {
                user = {
                  id: -(emp.id), // Synthetic negative ID to avoid collisions
                  openId: `employee:${emp.id}`,
                  name: emp.name,
                  email: emp.email ?? null,
                  loginMethod: "custom",
                  role: "user" as const,
                  platformRole: payload.platformRole,
                  secondaryPlatformRole: payload.secondaryPlatformRole ?? null,
                  employeeId: emp.id, // Direct employee ID for lookups
                  createdAt: emp.createdAt,
                  updatedAt: emp.updatedAt,
                  lastSignedIn: new Date(),
                } as User & { secondaryPlatformRole?: string | null; employeeId?: number };
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
