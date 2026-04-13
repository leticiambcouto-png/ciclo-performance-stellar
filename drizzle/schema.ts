import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  tinyint,
} from "drizzle-orm/mysql-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Platform-specific role
  platformRole: mysqlEnum("platformRole", ["rh", "gestor", "colaborador"]).default("colaborador").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
// Represents all employees in the company with their hierarchy
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  department: varchar("department", { length: 255 }),
  managerId: int("managerId"), // references employees.id (self-referential)
  area: varchar("area", { length: 255 }), // Nome da área
  diretoria: varchar("diretoria", { length: 255 }), // Nome da diretoria
  accessPassword: varchar("accessPassword", { length: 255 }), // Senha de acesso à plataforma (hashed)
  mustChangePassword: boolean("mustChangePassword").default(true).notNull(), // Força troca de senha no primeiro acesso
  platformRole: mysqlEnum("platformRole", ["rh", "gestor", "colaborador"]).default("colaborador").notNull(),
  secondaryPlatformRole: mysqlEnum("secondaryPlatformRole", ["rh", "gestor", "colaborador"]), // Optional secondary role (e.g., RH who is also a manager)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── EVALUATION CYCLES ───────────────────────────────────────────────────────
export const evaluationCycles = mysqlTable("evaluation_cycles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  semester: varchar("semester", { length: 10 }).notNull(), // e.g. "S1/26"
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["draft", "open", "closed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationCycle = typeof evaluationCycles.$inferSelect;

// ─── SELF EVALUATIONS ────────────────────────────────────────────────────────
// Both manager and employee can do self-evaluation
export const selfEvaluations = mysqlTable("self_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  // Potencial axis (values: 'below' | 'within' | 'above')
  ambicao: mysqlEnum("ambicao", ["below", "within", "above"]),
  ambicaoComment: text("ambicaoComment"),
  sonharGrande: mysqlEnum("sonharGrande", ["below", "within", "above"]),
  sonharGrandeComment: text("sonharGrandeComment"),
  accountability: mysqlEnum("accountability", ["below", "within", "above"]),
  accountabilityComment: text("accountabilityComment"),
  juntosSomosMaisFortes: mysqlEnum("juntosSomosMaisFortes", ["below", "within", "above"]),
  juntosSomosMaisfortesComment: text("juntosSomosMaisfortesComment"),
  // Performance axis
  qualidade: mysqlEnum("qualidade", ["below", "within", "above"]),
  qualidadeComment: text("qualidadeComment"),
  contribuicao: mysqlEnum("contribuicao", ["below", "within", "above"]),
  contribuicaoComment: text("contribuicaoComment"),
  adaptacao: mysqlEnum("adaptacao", ["below", "within", "above"]),
  adaptacaoComment: text("adaptacaoComment"),
  usoDeIA: mysqlEnum("usoDeIA", ["below", "within", "above"]),
  usoDeIAComment: text("usoDeIAComment"),
  // Calculated positions
  potencialAxis: mysqlEnum("potencialAxis", ["low", "medium", "high"]),
  performanceAxis: mysqlEnum("performanceAxis", ["low", "medium", "high"]),
  nineboxQuadrant: varchar("nineboxQuadrant", { length: 5 }), // Q1-Q9
  status: mysqlEnum("status", ["draft", "submitted"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SelfEvaluation = typeof selfEvaluations.$inferSelect;

// ─── MANAGER EVALUATIONS ─────────────────────────────────────────────────────
// Manager evaluates each direct report
export const managerEvaluations = mysqlTable("manager_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  managerId: int("managerId").references(() => employees.id).notNull(),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  // Potencial axis
  ambicao: mysqlEnum("ambicao", ["below", "within", "above"]),
  ambicaoComment: text("ambicaoComment"),
  sonharGrande: mysqlEnum("sonharGrande", ["below", "within", "above"]),
  sonharGrandeComment: text("sonharGrandeComment"),
  accountability: mysqlEnum("accountability", ["below", "within", "above"]),
  accountabilityComment: text("accountabilityComment"),
  juntosSomosMaisFortes: mysqlEnum("juntosSomosMaisFortes", ["below", "within", "above"]),
  juntosSomosMaisfortesComment: text("juntosSomosMaisfortesComment"),
  // Performance axis
  qualidade: mysqlEnum("qualidade", ["below", "within", "above"]),
  qualidadeComment: text("qualidadeComment"),
  contribuicao: mysqlEnum("contribuicao", ["below", "within", "above"]),
  contribuicaoComment: text("contribuicaoComment"),
  adaptacao: mysqlEnum("adaptacao", ["below", "within", "above"]),
  adaptacaoComment: text("adaptacaoComment"),
  usoDeIA: mysqlEnum("usoDeIA", ["below", "within", "above"]),
  usoDeIAComment: text("usoDeIAComment"),
  // Feedback geral (habilitado após preencher todas as 8 dimensões)
  feedbackGeral: text("feedbackGeral"),
  // Calculated positions
  potencialAxis: mysqlEnum("potencialAxis", ["low", "medium", "high"]),
  performanceAxis: mysqlEnum("performanceAxis", ["low", "medium", "high"]),
  nineboxQuadrant: varchar("nineboxQuadrant", { length: 5 }), // Q1-Q9
  status: mysqlEnum("status", ["draft", "submitted"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManagerEvaluation = typeof managerEvaluations.$inferSelect;

// ─── NINEBOX POSITIONS ───────────────────────────────────────────────────────
// Official 9box position after calibration (can be manually adjusted by RH)
export const nineboxPositions = mysqlTable("ninebox_positions", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  quadrant: varchar("quadrant", { length: 5 }).notNull(), // Q1-Q9
  potencialAxis: mysqlEnum("potencialAxis", ["low", "medium", "high"]).notNull(),
  performanceAxis: mysqlEnum("performanceAxis", ["low", "medium", "high"]).notNull(),
  isManuallyAdjusted: boolean("isManuallyAdjusted").default(false).notNull(),
  adjustedBy: int("adjustedBy").references(() => users.id),
  adjustmentNote: text("adjustmentNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NineboxPosition = typeof nineboxPositions.$inferSelect;

// ─── FLASH FEEDBACKS ─────────────────────────────────────────────────────────
export const flashFeedbacks = mysqlTable("flash_feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  requesterId: int("requesterId").references(() => employees.id).notNull(),
  receiverId: int("receiverId").references(() => employees.id).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  agenda: text("agenda"), // pauta da reunião
  status: mysqlEnum("status", ["scheduled", "completed", "overdue", "cancelled"]).default("scheduled").notNull(),
  // Formalization after meeting
  formalizedAt: timestamp("formalizedAt"),
  feedbackContent: text("feedbackContent"),
  actionPlan: text("actionPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlashFeedback = typeof flashFeedbacks.$inferSelect;

// ─── FEEDBACK REPORTS (DEVOLUTIVAS) ──────────────────────────────────────────
export const feedbackReports = mysqlTable("feedback_reports", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  managerId: int("managerId").references(() => employees.id).notNull(),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  evaluationId: int("evaluationId").references(() => managerEvaluations.id),
  // AI-generated feedback content
  aiFeedbackContent: text("aiFeedbackContent"),
  aiActionPlan: text("aiActionPlan"),
  // Final content sent to employee
  finalContent: text("finalContent"),
  finalActionPlan: text("finalActionPlan"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  status: mysqlEnum("status", ["draft", "sent", "viewed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedbackReport = typeof feedbackReports.$inferSelect;

// ─── CALIBRATION ROOMS ───────────────────────────────────────────────────────
export const calibrationRooms = mysqlTable("calibration_rooms", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  status: mysqlEnum("status", ["draft", "active", "completed"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalibrationRoom = typeof calibrationRooms.$inferSelect;

// ─── CALIBRATION PARTICIPANTS ─────────────────────────────────────────────────
export const calibrationParticipants = mysqlTable("calibration_participants", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").references(() => calibrationRooms.id).notNull(),
  managerId: int("managerId").references(() => employees.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CALIBRATION SCOPE (employees to be calibrated in each room) ──────────────
// Defines which employees are calibrated in each room (filtered by job title/area)
export const calibrationScope = mysqlTable("calibration_scope", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").references(() => calibrationRooms.id).notNull(),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CalibrationScope = typeof calibrationScope.$inferSelect;

// ─── CALIBRATION CONSEQUENCES ─────────────────────────────────────────────────
// Stores the consequence decision for each employee in a calibration room
export const calibrationConsequences = mysqlTable("calibration_consequences", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").references(() => calibrationRooms.id).notNull(),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  cycleId: int("cycleId").references(() => evaluationCycles.id),
  consequence: mysqlEnum("consequence", ["merito", "promocao", "desligamento", "plano_recuperacao", "nenhuma"]).default("nenhuma").notNull(),
  notes: text("notes"),
  decidedBy: int("decidedBy").references(() => users.id),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CalibrationConsequence = typeof calibrationConsequences.$inferSelect;

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  type: mysqlEnum("type", [
    "flash_feedback_scheduled",
    "flash_feedback_due_soon",
    "flash_feedback_overdue",
    "evaluation_available",
    "report_sent",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: int("relatedId"), // ID of the related entity
  relatedType: varchar("relatedType", { length: 50 }), // 'flash_feedback' | 'evaluation' | 'report'
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── CYCLE PHASES ────────────────────────────────────────────────────────────
// Stores the configurable start/end dates for each phase of the performance cycle
export const cyclePhases = mysqlTable("cycle_phases", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").references(() => evaluationCycles.id).notNull(),
  phaseNumber: int("phaseNumber").notNull(), // 1-7
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isContinuous: boolean("isContinuous").default(false).notNull(), // e.g. Flash Feedbacks
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CyclePhase = typeof cyclePhases.$inferSelect;
export type InsertCyclePhase = typeof cyclePhases.$inferInsert;

// ─── PASSWORD RESET TOKENS ───────────────────────────────────────────────────
// Stores one-time tokens for password reset via email link
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").references(() => employees.id).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
