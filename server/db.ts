import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  calibrationConsequences,
  calibrationParticipants,
  calibrationRooms,
  calibrationScope,
  cyclePhases,
  CyclePhase,
  employees,
  evaluationCycles,
  feedbackReports,
  flashFeedbacks,
  impactPlans,
  InsertEmployee,
  InsertPdi,
  InsertPdiBlock,
  InsertUser,
  managerEvaluations,
  nineboxPositions,
  notifications,
  pdiBlocks,
  pdis,
  selfEvaluations,
  structuredFeedbacks,
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
  // Negative IDs are synthetic (custom auth users without a users table entry)
  // In this case, the absolute value is the actual employee ID
  if (userId < 0) {
    const result = await db.select().from(employees).where(eq(employees.id, -userId)).limit(1);
    return result[0];
  }
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

export async function getAllManagerEvaluations(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(managerEvaluations).where(eq(managerEvaluations.cycleId, cycleId));
}

export async function getManagerEvaluationByEmployee(employeeId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(managerEvaluations)
    .where(
      and(
        eq(managerEvaluations.employeeId, employeeId),
        eq(managerEvaluations.cycleId, cycleId),
        eq(managerEvaluations.status, "submitted")
      )
    )
    .limit(1);
  return result[0];
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

export async function getAllFlashFeedbacks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flashFeedbacks).orderBy(desc(flashFeedbacks.scheduledAt));
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
export async function removeCalibrationParticipant(roomId: number, managerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(calibrationParticipants)
    .where(and(eq(calibrationParticipants.roomId, roomId), eq(calibrationParticipants.managerId, managerId)));
}
export async function deleteCalibrationRoom(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete related records first
  await db.delete(calibrationConsequences).where(eq(calibrationConsequences.roomId, id));
  await db.delete(calibrationScope).where(eq(calibrationScope.roomId, id));
  await db.delete(calibrationParticipants).where(eq(calibrationParticipants.roomId, id));
  await db.delete(calibrationRooms).where(eq(calibrationRooms.id, id));
}
// ─── CALIBRATION SCOPE ────────────────────────────────────────────────────────
export async function getCalibrationScope(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calibrationScope).where(eq(calibrationScope.roomId, roomId));
}
export async function addCalibrationScopeEmployee(roomId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return;
  // Upsert: ignore if already exists
  const existing = await db.select().from(calibrationScope)
    .where(and(eq(calibrationScope.roomId, roomId), eq(calibrationScope.employeeId, employeeId)));
  if (existing.length === 0) {
    await db.insert(calibrationScope).values({ roomId, employeeId });
  }
}
export async function removeCalibrationScopeEmployee(roomId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(calibrationScope)
    .where(and(eq(calibrationScope.roomId, roomId), eq(calibrationScope.employeeId, employeeId)));
}
// ─── CALIBRATION CONSEQUENCES ─────────────────────────────────────────────────
export async function getCalibrationConsequences(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calibrationConsequences).where(eq(calibrationConsequences.roomId, roomId));
}
export async function getAllCalibrationConsequences(cycleId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (cycleId) {
    return db.select().from(calibrationConsequences).where(eq(calibrationConsequences.cycleId, cycleId));
  }
  return db.select().from(calibrationConsequences);
}

export async function getConsequencesWithEmployeeData(cycleId?: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all consequences
  const cons = cycleId
    ? await db.select().from(calibrationConsequences).where(eq(calibrationConsequences.cycleId, cycleId))
    : await db.select().from(calibrationConsequences);
  if (cons.length === 0) return [];
  // Get all employees and rooms for enrichment
  const allEmployees = await db.select().from(employees);
  const allRooms = await db.select().from(calibrationRooms);
  // Get ninebox positions for quadrant info
  const allPositions = cycleId
    ? await db.select().from(nineboxPositions).where(eq(nineboxPositions.cycleId, cycleId))
    : await db.select().from(nineboxPositions);
  const empMap = new Map(allEmployees.map((e) => [e.id, e]));
  const roomMap = new Map(allRooms.map((r) => [r.id, r]));
  const posMap = new Map(allPositions.map((p) => [p.employeeId, p]));
  return cons.map((c) => {
    const emp = empMap.get(c.employeeId);
    const manager = emp?.managerId ? empMap.get(emp.managerId) : null;
    const room = roomMap.get(c.roomId);
    const pos = posMap.get(c.employeeId);
    return {
      employeeName: emp?.name ?? "",
      employeeEmail: emp?.email ?? "",
      jobTitle: emp?.jobTitle ?? "",
      area: emp?.area ?? "",
      diretoria: emp?.diretoria ?? "",
      managerName: manager?.name ?? "",
      roomName: room?.name ?? "",
      quadrant: pos?.quadrant ?? "",
      consequence: c.consequence,
      notes: c.notes ?? "",
      decidedAt: c.decidedAt,
    };
  });
}
export async function upsertCalibrationConsequence(
  roomId: number,
  employeeId: number,
  cycleId: number | undefined,
  consequence: "merito" | "promocao" | "desligamento" | "plano_recuperacao" | "nenhuma",
  notes: string | undefined,
  decidedBy: number
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(calibrationConsequences)
    .where(and(eq(calibrationConsequences.roomId, roomId), eq(calibrationConsequences.employeeId, employeeId)));
  if (existing.length > 0) {
    await db.update(calibrationConsequences)
      .set({ consequence, notes, decidedBy, decidedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(calibrationConsequences.roomId, roomId), eq(calibrationConsequences.employeeId, employeeId)));
  } else {
    await db.insert(calibrationConsequences).values({
      roomId, employeeId, cycleId, consequence, notes, decidedBy, decidedAt: new Date()
    });
  }
}
// ─── NOTIFICATIONSS ────────────────────────────────────────────────────────────

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
  updatedBy: number | null
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

// ─── EVALUATION REPORT DATA (for Excel export) ───────────────────────────────

export async function getEvaluationReportData(cycleId: number) {
  const db = await getDb();
  if (!db) return [];

  // Fetch all manager evaluations for the cycle with employee and manager names
  const evals = await db
    .select({
      // Evaluated employee
      employeeId: employees.id,
      employeeName: employees.name,
      employeeEmail: employees.email,
      jobTitle: employees.jobTitle,
      department: employees.department,
      // Manager (direct leader)
      managerId: managerEvaluations.managerId,
      // Evaluation criteria — Potencial axis
      ambicao: managerEvaluations.ambicao,
      ambicaoComment: managerEvaluations.ambicaoComment,
      sonharGrande: managerEvaluations.sonharGrande,
      sonharGrandeComment: managerEvaluations.sonharGrandeComment,
      accountability: managerEvaluations.accountability,
      accountabilityComment: managerEvaluations.accountabilityComment,
      juntosSomosMaisFortes: managerEvaluations.juntosSomosMaisFortes,
      juntosSomosMaisfortesComment: managerEvaluations.juntosSomosMaisfortesComment,
      // Evaluation criteria — Performance axis
      qualidade: managerEvaluations.qualidade,
      qualidadeComment: managerEvaluations.qualidadeComment,
      contribuicao: managerEvaluations.contribuicao,
      contribuicaoComment: managerEvaluations.contribuicaoComment,
      adaptacao: managerEvaluations.adaptacao,
      adaptacaoComment: managerEvaluations.adaptacaoComment,
      usoDeIA: managerEvaluations.usoDeIA,
      usoDeIAComment: managerEvaluations.usoDeIAComment,
      // Calculated axes
      potencialAxis: managerEvaluations.potencialAxis,
      performanceAxis: managerEvaluations.performanceAxis,
      nineboxQuadrant: managerEvaluations.nineboxQuadrant,
      evalStatus: managerEvaluations.status,
      submittedAt: managerEvaluations.submittedAt,
    })
    .from(managerEvaluations)
    .innerJoin(employees, eq(managerEvaluations.employeeId, employees.id))
    .where(eq(managerEvaluations.cycleId, cycleId))
    .orderBy(employees.name);

  // Fetch manager names separately for each unique managerId
  const managerIds = Array.from(new Set(evals.map((e) => e.managerId)));
  const managerMap: Record<number, string> = {};
  if (managerIds.length > 0) {
    for (const mid of managerIds) {
      const mgr = await db
        .select({ name: employees.name })
        .from(employees)
        .where(eq(employees.id, mid))
        .limit(1);
      managerMap[mid] = mgr[0]?.name ?? "—";
    }
  }

  return evals.map((e) => ({
    ...e,
    managerName: managerMap[e.managerId] ?? "—",
  }));
}

// ─── USER MANAGEMENT (RH) ────────────────────────────────────────────────────

export async function getAllEmployeesWithManager() {
  const db = await getDb();
  if (!db) return [];

  // Fetch all employees (including inactive) with manager name
  const allEmps = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      jobTitle: employees.jobTitle,
      department: employees.department,
      area: employees.area,
      diretoria: employees.diretoria,
      managerId: employees.managerId,
      platformRole: employees.platformRole,
      secondaryPlatformRole: employees.secondaryPlatformRole,
      isActive: employees.isActive,
      userId: employees.userId,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .orderBy(employees.name);

  // Build a name map for managers
  const managerIds = Array.from(new Set(allEmps.map((e) => e.managerId).filter(Boolean) as number[]));
  const managerMap: Record<number, string> = {};
  for (const mid of managerIds) {
    const mgr = await db
      .select({ name: employees.name })
      .from(employees)
      .where(eq(employees.id, mid))
      .limit(1);
    managerMap[mid] = mgr[0]?.name ?? "—";
  }

  return allEmps.map((e) => ({
    ...e,
    managerName: e.managerId ? (managerMap[e.managerId] ?? "—") : "—",
  }));
}

export async function deactivateEmployee(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
}

export async function reactivateEmployee(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set({ isActive: true }).where(eq(employees.id, id));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

// ─── REPORT DATA FUNCTIONS ───────────────────────────────────────────────────

/** Relatório 1: Todos os colaboradores com dados completos */
export async function getCollaboratorsReportData() {
  const db = await getDb();
  if (!db) return [];

  const allEmps = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      jobTitle: employees.jobTitle,
      department: employees.department,
      area: employees.area,
      diretoria: employees.diretoria,
      managerId: employees.managerId,
      platformRole: employees.platformRole,
      secondaryPlatformRole: employees.secondaryPlatformRole,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .orderBy(employees.name);

  // Build manager name map
  const managerIds = Array.from(new Set(allEmps.map((e) => e.managerId).filter(Boolean) as number[]));
  const managerMap: Record<number, string> = {};
  for (const mid of managerIds) {
    const mgr = await db.select({ name: employees.name }).from(employees).where(eq(employees.id, mid)).limit(1);
    managerMap[mid] = mgr[0]?.name ?? "—";
  }

  return allEmps.map((e) => ({
    ...e,
    managerName: e.managerId ? (managerMap[e.managerId] ?? "—") : "—",
  }));
}

/** Relatório 3: 9-Box com quadrante inicial e calibrado */
export async function getNineboxReportData(cycleId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Get active cycle if not provided
  let cid = cycleId;
  if (!cid) {
    const cycle = await getActiveCycle();
    cid = cycle?.id;
  }
  if (!cid) return [];

  const positions = await db
    .select({
      employeeId: nineboxPositions.employeeId,
      performanceAxis: nineboxPositions.performanceAxis,
      potencialAxis: nineboxPositions.potencialAxis,
      quadrant: nineboxPositions.quadrant,
      isManuallyAdjusted: nineboxPositions.isManuallyAdjusted,
      adjustmentNote: nineboxPositions.adjustmentNote,
      updatedAt: nineboxPositions.updatedAt,
    })
    .from(nineboxPositions)
    .where(eq(nineboxPositions.cycleId, cid));

  // Fetch employee data
  const empIds = positions.map((p) => p.employeeId).filter(Boolean) as number[];
  const empMap: Record<number, { name: string; email: string | null; jobTitle: string | null; area: string | null; diretoria: string | null; managerId: number | null }> = {};
  for (const eid of empIds) {
    const emp = await db
      .select({ name: employees.name, email: employees.email, jobTitle: employees.jobTitle, area: employees.area, diretoria: employees.diretoria, managerId: employees.managerId })
      .from(employees)
      .where(eq(employees.id, eid))
      .limit(1);
    if (emp[0]) empMap[eid] = emp[0];
  }

  // Fetch manager names
  const managerIds = Array.from(new Set(Object.values(empMap).map((e) => e.managerId).filter(Boolean) as number[]));
  const managerMap: Record<number, string> = {};
  for (const mid of managerIds) {
    const mgr = await db.select({ name: employees.name }).from(employees).where(eq(employees.id, mid)).limit(1);
    managerMap[mid] = mgr[0]?.name ?? "—";
  }

  return positions.map((p) => {
    const emp = empMap[p.employeeId!] ?? {};
    return {
      ...p,
      employeeName: (emp as any).name ?? "—",
      employeeEmail: (emp as any).email ?? "—",
      jobTitle: (emp as any).jobTitle ?? "—",
      area: (emp as any).area ?? "—",
      diretoria: (emp as any).diretoria ?? "—",
      managerName: (emp as any).managerId ? (managerMap[(emp as any).managerId] ?? "—") : "—",
    };
  });
}

/** Relatório 4: Flash Feedbacks com dados de gestor e colaborador */
export async function getFlashFeedbacksReportData() {
  const db = await getDb();
  if (!db) return [];

  const ffs = await getAllFlashFeedbacks();
  if (ffs.length === 0) return [];

  // Collect all unique employee IDs
  const empIds = Array.from(new Set([
    ...ffs.map((f) => f.requesterId),
    ...ffs.map((f) => f.receiverId),
  ].filter(Boolean) as number[]));

  const empMap: Record<number, { name: string; email: string | null; jobTitle: string | null }> = {};
  for (const eid of empIds) {
    const emp = await db
      .select({ name: employees.name, email: employees.email, jobTitle: employees.jobTitle })
      .from(employees)
      .where(eq(employees.id, eid))
      .limit(1);
    if (emp[0]) empMap[eid] = emp[0];
  }

  return ffs.map((f) => ({
    ...f,
    requesterName: f.requesterId ? (empMap[f.requesterId]?.name ?? "—") : "—",
    requesterEmail: f.requesterId ? (empMap[f.requesterId]?.email ?? "—") : "—",
    receiverName: f.receiverId ? (empMap[f.receiverId]?.name ?? "—") : "—",
    receiverEmail: f.receiverId ? (empMap[f.receiverId]?.email ?? "—") : "—",
    receiverJobTitle: f.receiverId ? (empMap[f.receiverId]?.jobTitle ?? "—") : "—",
  }));
}

/** Relatório 6: Painel Geral — colaborador + avaliação + 9-Box + consequência */
export async function getConsolidatedPanelData(cycleId?: number) {
  const db = await getDb();
  if (!db) return [];

  let cid = cycleId;
  if (!cid) {
    const cycle = await getActiveCycle();
    cid = cycle?.id;
  }
  if (!cid) return [];

  // Get all employees
  const allEmps = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      jobTitle: employees.jobTitle,
      area: employees.area,
      diretoria: employees.diretoria,
      managerId: employees.managerId,
      platformRole: employees.platformRole,
      isActive: employees.isActive,
    })
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(employees.name);

  // Manager name map
  const managerIds = Array.from(new Set(allEmps.map((e) => e.managerId).filter(Boolean) as number[]));
  const managerMap: Record<number, string> = {};
  for (const mid of managerIds) {
    const mgr = await db.select({ name: employees.name }).from(employees).where(eq(employees.id, mid)).limit(1);
    managerMap[mid] = mgr[0]?.name ?? "—";
  }

  // 9-Box positions
  const positions = await db.select().from(nineboxPositions).where(eq(nineboxPositions.cycleId, cid));
  const posMap: Record<number, typeof positions[0]> = {};
  for (const p of positions) posMap[p.employeeId!] = p;

  // Manager evaluations
  const evals = await db.select().from(managerEvaluations).where(eq(managerEvaluations.cycleId, cid));
  const evalMap: Record<number, typeof evals[0]> = {};
  for (const e of evals) evalMap[e.employeeId!] = e;

  // Consequences
  const consequences = await getConsequencesWithEmployeeData(cid);
  const consMap: Record<string, typeof consequences[0]> = {};
  for (const c of consequences) consMap[c.employeeEmail ?? ""] = c;

  return allEmps.map((emp) => {
    const pos = posMap[emp.id];
    const ev = evalMap[emp.id];
    const cons = consMap[emp.email ?? ""];
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeEmail: emp.email,
      jobTitle: emp.jobTitle,
      area: emp.area,
      diretoria: emp.diretoria,
      managerName: emp.managerId ? (managerMap[emp.managerId] ?? "—") : "—",
      platformRole: emp.platformRole,
      // 9-Box
      quadranteInicial: pos?.quadrant ?? "—",
      quadranteCalibracao: pos?.isManuallyAdjusted ? (pos?.adjustmentNote ?? pos?.quadrant ?? "—") : (pos?.quadrant ?? "—"),
      performanceAxis: pos?.performanceAxis ?? "—",
      potencialAxis: pos?.potencialAxis ?? "—",
      // Avaliação
      statusAvaliacao: ev?.status ?? "Não avaliado",
      notaPerformance: ev?.performanceAxis ?? "—",
      notaCultura: ev?.potencialAxis ?? "—",
      feedbackGeral: ev?.feedbackGeral ?? "—",
      // Consequência
      consequencia: cons?.consequence ?? "—",
      salaCalibração: cons?.roomName ?? "—",
      observacoesConsequencia: cons?.notes ?? "—",
    };
  });
}

// ─── CYCLE MANAGEMENT ────────────────────────────────────────────────────────

/** Create a new evaluation cycle with default phases */
export async function createCycle(data: {
  name: string;
  semester: string;
  startDate: Date;
  endDate: Date;
  status?: "draft" | "open" | "closed";
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(evaluationCycles).values({
    name: data.name,
    semester: data.semester,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status ?? "draft",
  });

  const cycleId = (result as any).insertId as number;

  // Create default 7 phases for the new cycle
  const defaultPhases = [
    { phaseNumber: 1, titulo: "Autoavaliação", descricao: "Período de autoavaliação dos colaboradores", isContinuous: false },
    { phaseNumber: 2, titulo: "Avaliação do Gestor", descricao: "Período de avaliação dos liderados pelo gestor", isContinuous: false },
    { phaseNumber: 3, titulo: "Calibração", descricao: "Reuniões de calibração com RH e gestores", isContinuous: false },
    { phaseNumber: 4, titulo: "Devolutiva", descricao: "Período de devolutiva dos resultados aos colaboradores", isContinuous: false },
    { phaseNumber: 5, titulo: "PDI", descricao: "Elaboração do Plano de Desenvolvimento Individual", isContinuous: false },
    { phaseNumber: 6, titulo: "Flash Feedbacks", descricao: "Período contínuo de flash feedbacks", isContinuous: true },
    { phaseNumber: 7, titulo: "Encerramento", descricao: "Encerramento do ciclo e consolidação dos dados", isContinuous: false },
  ];

  for (const phase of defaultPhases) {
    // Default: each phase starts at cycle start and ends at cycle end (RH will adjust)
    await db.insert(cyclePhases).values({
      cycleId,
      phaseNumber: phase.phaseNumber,
      titulo: phase.titulo,
      descricao: phase.descricao,
      startDate: data.startDate,
      endDate: data.endDate,
      isContinuous: phase.isContinuous,
    });
  }

  return cycleId;
}

/** Update cycle status (draft → open → closed) */
export async function updateCycleStatus(
  cycleId: number,
  status: "draft" | "open" | "closed"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(evaluationCycles)
    .set({ status })
    .where(eq(evaluationCycles.id, cycleId));
}

/** Get active cycle phases and check if a specific phase is currently active */
export async function isPhaseActive(cycleId: number, phaseNumber: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const now = new Date();
  const result = await db
    .select()
    .from(cyclePhases)
    .where(
      and(
        eq(cyclePhases.cycleId, cycleId),
        eq(cyclePhases.phaseNumber, phaseNumber)
      )
    )
    .limit(1);
  if (!result[0]) return false;
  return result[0].startDate <= now && result[0].endDate >= now;
}


// ─── STRUCTURED FEEDBACKS ────────────────────────────────────────────────────

export async function getStructuredFeedback(cycleId: number, leaderId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(structuredFeedbacks)
    .where(
      and(
        eq(structuredFeedbacks.cycleId, cycleId),
        eq(structuredFeedbacks.leaderId, leaderId),
        eq(structuredFeedbacks.employeeId, employeeId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getStructuredFeedbackById(feedbackId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(structuredFeedbacks)
    .where(eq(structuredFeedbacks.id, feedbackId))
    .limit(1);
  return result[0] ?? null;
}

export async function getStructuredFeedbackForEmployee(cycleId: number, employeeId: number) {
  // Returns the feedback written BY the employee's leader FOR the employee
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(structuredFeedbacks)
    .where(
      and(
        eq(structuredFeedbacks.cycleId, cycleId),
        eq(structuredFeedbacks.employeeId, employeeId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function listStructuredFeedbacksForManager(cycleId: number, leaderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(structuredFeedbacks)
    .where(
      and(
        eq(structuredFeedbacks.cycleId, cycleId),
        eq(structuredFeedbacks.leaderId, leaderId)
      )
    )
    .orderBy(desc(structuredFeedbacks.updatedAt));
}

export async function upsertStructuredFeedback(data: {
  cycleId: number;
  leaderId: number;
  employeeId: number;
  entregasRelevantes?: string | null;
  metaAtingidaAuto?: boolean | null;
  abaixoEsperado?: string | null;
  valorConsistente?: string | null;
  valorConsistenteDesc?: string | null;
  valorEvoluir?: string | null;
  valorEvoluirComportamento?: string | null;
  proximoCicloDiferente?: string | null;
  proximoCicloExpectativa?: string | null;
  status?: "draft" | "submitted";
  submittedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getStructuredFeedback(data.cycleId, data.leaderId, data.employeeId);
  if (existing) {
    await db
      .update(structuredFeedbacks)
      .set({ ...data })
      .where(eq(structuredFeedbacks.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(structuredFeedbacks).values({ ...data });
    return { id: Number((result as any).insertId), ...data };
  }
}

// ─── IMPACT PLANS ────────────────────────────────────────────────────────────

export async function getImpactPlan(cycleId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(impactPlans)
    .where(
      and(
        eq(impactPlans.cycleId, cycleId),
        eq(impactPlans.employeeId, employeeId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function listImpactPlansForManager(cycleId: number, leaderId: number) {
  // Returns impact plans for all direct reports of the leader in this cycle
  const db = await getDb();
  if (!db) return [];
  const feedbacks = await listStructuredFeedbacksForManager(cycleId, leaderId);
  if (feedbacks.length === 0) return [];
  const employeeIds = feedbacks.map((f) => f.employeeId);
  const plans = await db
    .select()
    .from(impactPlans)
    .where(
      and(
        eq(impactPlans.cycleId, cycleId),
        sql`${impactPlans.employeeId} IN (${employeeIds.join(",")})`
      )
    );
  return plans;
}

export async function upsertImpactPlan(data: {
  cycleId: number;
  employeeId: number;
  feedbackId: number;
  valorDesenvolver?: string | null;
  valorAcoes?: string | null;
  competenciaTecnica?: string | null;
  comoDesenvolver?: string | null;
  prazoDias?: number | null;
  resultadoEsperado?: string | null;
  status?: "draft" | "submitted";
  submittedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getImpactPlan(data.cycleId, data.employeeId);
  if (existing) {
    await db
      .update(impactPlans)
      .set({ ...data })
      .where(eq(impactPlans.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(impactPlans).values({ ...data });
    return { id: Number((result as any).insertId), ...data };
  }
}

// ─── PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL) ───────────────────────────────



export async function getPdiForEmployee(cycleId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(pdis)
    .where(and(eq(pdis.cycleId, cycleId), eq(pdis.employeeId, employeeId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPdiWithBlocks(pdiId: number) {
  const db = await getDb();
  if (!db) return null;
  const pdiRows = await db.select().from(pdis).where(eq(pdis.id, pdiId)).limit(1);
  if (!pdiRows[0]) return null;
  const blocks = await db.select().from(pdiBlocks).where(eq(pdiBlocks.pdiId, pdiId));
  return { ...pdiRows[0], blocks };
}

export async function createPdi(data: {
  cycleId: number;
  employeeId: number;
  leaderId: number;
  valorStellar?: string | null;
  valorEmpate?: boolean;
  valorEmpateJustificativa?: string | null;
  competenciaTecnica?: string | null;
  iaCompetenciaSugestao?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pdis).values({
    ...data,
    status: "draft",
  });
  return { id: Number((result as any).insertId), ...data };
}

export async function updatePdi(pdiId: number, data: Partial<typeof pdis.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pdis).set(data).where(eq(pdis.id, pdiId));
}

export async function upsertPdiBlock(data: {
  pdiId: number;
  blockType: "valor_stellar" | "competencia_tecnica";
  competencia: string;
  iaAcoes70?: string | null;
  iaAcoes20?: string | null;
  iaAcoes10?: string | null;
  acoes70?: string | null;
  acoes70Justificativa?: string | null;
  acoes20?: string | null;
  acoes10?: string | null;
  preenchidoPeloColaborador?: boolean;
  validadoPeloLider?: boolean;
  liderComentario?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db
    .select()
    .from(pdiBlocks)
    .where(and(eq(pdiBlocks.pdiId, data.pdiId), eq(pdiBlocks.blockType, data.blockType)))
    .limit(1);
  if (existing[0]) {
    await db.update(pdiBlocks).set(data).where(eq(pdiBlocks.id, existing[0].id));
    return { ...existing[0], ...data };
  } else {
    const result = await db.insert(pdiBlocks).values(data);
    return { id: Number((result as any).insertId), ...data };
  }
}

export async function getPdiBlocksForPdi(pdiId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pdiBlocks).where(eq(pdiBlocks.pdiId, pdiId));
}

export async function listPdisForManager(leaderId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pdis)
    .where(and(eq(pdis.leaderId, leaderId), eq(pdis.cycleId, cycleId)));
}

export async function listAllPdis(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pdis).where(eq(pdis.cycleId, cycleId));
}
