import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyStellarToken } from "../customAuth";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User & { secondaryPlatformRole?: string | null }) | null;
};

const STELLAR_COOKIE = "stellar_session";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Read the stellar_session cookie (custom auth — works in any browser/domain)
    const token = opts.req.cookies?.[STELLAR_COOKIE];
    if (token) {
      const payload = await verifyStellarToken(token);
      if (payload) {
        const db = await getDb();
        if (db) {
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, payload.email))
            .limit(1);

          if (result[0]) {
            // Merge DB user with JWT platformRole (JWT is source of truth for role)
            user = {
              ...result[0],
              platformRole: payload.platformRole,
              secondaryPlatformRole: payload.secondaryPlatformRole ?? null,
            } as User & { secondaryPlatformRole?: string | null };
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
