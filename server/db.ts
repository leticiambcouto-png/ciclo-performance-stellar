import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  calibrationParticipants,
  calibrationRooms,
  cyclePhases,
  CyclePhase,
  employees,
  evaluationCycles,
  feedbackReports,
  flashFeedbacks,
  InsertEmployee,
  InsertUser,
  managerEvaluations,
  nineboxPositions,
  notifications,
  selfEvaluations,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserPlatformRole(
  userId: number,
  platformRole: "rh" | "gestor" | "colaborador"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ platformRole }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name);
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.isActive, true)).orderBy(employees.name);
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return result[0];
}

export async function getDirectReports(managerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.managerId, managerId));
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(employees).values(data);
  return result;
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set(data).where(eq(employees.id, id));
}

// ─── EVALUATION CYCLES ───────────────────────────────────────────────────────

export async function getActiveCycle() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.status, "open"))
    .limit(1);
  return result[0];
}

export async function getAllCycles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluationCycles).orderBy(desc(evaluationCycles.createdAt));
}

// ─── SELF EVALUATIONS ────────────────────────────────────────────────────────

export async function getSelfEvaluation(employeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(selfEvaluations)
    .where(and(eq(selfEvaluations.employeeId, employeeId), eq(selfEvaluations.cycleId, cycleId)))
    .limit(1);
  return result[0];
}

export async function upsertSelfEvaluation(data: typeof selfEvaluations.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getSelfEvaluation(data.employeeId!, data.cycleId!);
  if (existing) {
    await db
      .update(selfEvaluations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(selfEvaluations.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(selfEvaluations).values(data);
    return (result as any)[0]?.insertId ?? null;
  }
}

// ─── MANAGER EVALUATIONS ─────────────────────────────────────────────────────

export async function getManagerEvaluation(managerId: number, employeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(managerEvaluations)
    .where(
      and(
        eq(managerEvaluations.managerId, managerId),
        eq(managerEvaluations.employeeId, employeeId),
        eq(managerEvaluations.cycleId, cycleId)
      )
    )
    .limit(1);
  return result[0];
}

export async function getManagerEvaluationsForTeam(managerId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(managerEvaluations)
    .where(
      and(eq(managerEvaluations.managerId, managerId), eq(managerEvaluations.cycleId, cycleId))
    );
}

export async function upsertManagerEvaluation(
  data: typeof managerEvaluations.$inferInsert
) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getManagerEvaluation(
    data.managerId!,
    data.employeeId!,
    data.cycleId!
  );
  if (existing) {
    await db
      .update(managerEvaluations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(managerEvaluations.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(managerEvaluations).values(data);
    return (result as any)[0]?.insertId ?? null;
  }
}

// ─── NINEBOX POSITIONS ───────────────────────────────────────────────────────

export async function getNineboxPosition(employeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(nineboxPositions)
    .where(
      and(
        eq(nineboxPositions.employeeId, employeeId),
        eq(nineboxPositions.cycleId, cycleId)
      )
    )
    .limit(1);
  return result[0];
}

export async function getNineboxPositionsForTeam(managerEmployeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get direct reports
  const reports = await getDirectReports(managerEmployeeId);
  const reportIds = reports.map((r) => r.id);
  if (reportIds.length === 0) return [];

  return db
    .select()
    .from(nineboxPositions)
    .where(eq(nineboxPositions.cycleId, cycleId));
}

export async function getAllNineboxPositions(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(nineboxPositions)
    .where(eq(nineboxPositions.cycleId, cycleId));
}

export async function upsertNineboxPosition(data: typeof nineboxPositions.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getNineboxPosition(data.employeeId!, data.cycleId!);
  if (existing) {
    await db
      .update(nineboxPositions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(nineboxPositions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(nineboxPositions).values(data);
    return (result as any)[0]?.insertId ?? null;
  }
}

// ─── FLASH FEEDBACKS ─────────────────────────────────────────────────────────

export async function getFlashFeedbacksForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(flashFeedbacks)
    .where(
      or(
        eq(flashFeedbacks.requesterId, employeeId),
        eq(flashFeedbacks.receiverId, employeeId)
      )
    )
    .orderBy(desc(flashFeedbacks.scheduledAt));
}

export async function getFlashFeedbacksForManager(managerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all reports
  const reports = await getDirectReports(managerId);
  const reportIds = reports.map((r) => r.id);
  if (reportIds.length === 0) return [];

  return db
    .select()
    .from(flashFeedbacks)
    .where(
      or(
        eq(flashFeedbacks.requesterId, managerId),
        eq(flashFeedbacks.receiverId, managerId)
      )
    )
    .orderBy(desc(flashFeedbacks.scheduledAt));
}

export async function createFlashFeedback(data: typeof flashFeedbacks.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(flashFeedbacks).values(data);
  return (result as any)[0]?.insertId ?? null;
}

export async function updateFlashFeedback(
  id: number,
  data: Partial<typeof flashFeedbacks.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(flashFeedbacks).set({ ...data, updatedAt: new Date() }).where(eq(flashFeedbacks.id, id));
}

export async function updateOverdueFlashFeedbacks() {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db
    .update(flashFeedbacks)
    .set({ status: "overdue" })
    .where(
      and(
        eq(flashFeedbacks.status, "scheduled"),
        sql`${flashFeedbacks.scheduledAt} < ${now}`
      )
    );
}

// ─── FEEDBACK REPORTS ────────────────────────────────────────────────────────

export async function getFeedbackReport(employeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(feedbackReports)
    .where(
      and(
        eq(feedbackReports.employeeId, employeeId),
        eq(feedbackReports.cycleId, cycleId)
      )
    )
    .limit(1);
  return result[0];
}

export async function getFeedbackReportsForManager(managerId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(feedbackReports)
    .where(
      and(
        eq(feedbackReports.managerId, managerId),
        eq(feedbackReports.cycleId, cycleId)
      )
    );
}

export async function upsertFeedbackReport(data: typeof feedbackReports.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getFeedbackReport(data.employeeId!, data.cycleId!);
  if (existing) {
    await db
      .update(feedbackReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedbackReports.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(feedbackReports).values(data);
    return (result as any)[0]?.insertId ?? null;
  }
}

// ─── CALIBRATION ROOMS ───────────────────────────────────────────────────────

export async function getAllCalibrationRooms(cycleId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (cycleId) {
    return db
      .select()
      .from(calibrationRooms)
      .where(eq(calibrationRooms.cycleId, cycleId))
      .orderBy(desc(calibrationRooms.createdAt));
  }
  return db.select().from(calibrationRooms).orderBy(desc(calibrationRooms.createdAt));
}

export async function createCalibrationRoom(data: typeof calibrationRooms.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(calibrationRooms).values(data);
  return (result as any)[0]?.insertId ?? null;
}

export async function updateCalibrationRoom(
  id: number,
  data: Partial<typeof calibrationRooms.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(calibrationRooms).set({ ...data, updatedAt: new Date() }).where(eq(calibrationRooms.id, id));
}

export async function addCalibrationParticipant(roomId: number, managerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(calibrationParticipants).values({ roomId, managerId });
}

export async function getCalibrationParticipants(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(calibrationParticipants)
    .where(eq(calibrationParticipants.roomId, roomId));
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return (result as any)[0]?.insertId ?? null;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── CYCLE PHASES ─────────────────────────────────────────────────────────────

export async function getCyclePhases(cycleId: number): Promise<CyclePhase[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cyclePhases)
    .where(eq(cyclePhases.cycleId, cycleId))
    .orderBy(cyclePhases.phaseNumber);
}

export async function updateCyclePhase(
  id: number,
  data: { startDate: Date; endDate: Date; titulo?: string; descricao?: string },
  updatedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(cyclePhases)
    .set({ ...data, updatedBy })
    .where(eq(cyclePhases.id, id));
}

export async function upsertCyclePhases(
  cycleId: number,
  phases: Array<{
    phaseNumber: number;
    titulo: string;
    descricao?: string;
    startDate: Date;
    endDate: Date;
    isContinuous?: boolean;
  }>,
  updatedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const phase of phases) {
    await db
      .insert(cyclePhases)
      .values({ cycleId, updatedBy, ...phase, isContinuous: phase.isContinuous ?? false })
      .onDuplicateKeyUpdate({
        set: {
          titulo: phase.titulo,
          descricao: phase.descricao ?? null,
          startDate: phase.startDate,
          endDate: phase.endDate,
          isContinuous: phase.isContinuous ?? false,
          updatedBy,
        },
      });
  }
}
