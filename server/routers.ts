import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addCalibrationParticipant,
  createCalibrationRoom,
  createFlashFeedback,
  createNotification,
  getAllCalibrationRooms,
  getAllCycles,
  getAllEmployees,
  getAllEmployeesWithManager,
  getAllNineboxPositions,
  getAllUsers,
  deactivateEmployee,
  getActiveCycle,
  getCalibrationParticipants,
  getDirectReports,
  getEmployeeByUserId,
  getFeedbackReport,
  getFeedbackReportsForManager,
  getFlashFeedbacksForEmployee,
  getFlashFeedbacksForManager,
  getManagerEvaluation,
  getManagerEvaluationsForTeam,
  getNineboxPosition,
  getNineboxPositionsForTeam,
  getNotificationsForUser,
  getSelfEvaluation,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateCalibrationRoom,
  createEmployee,
  updateEmployee,
  updateFlashFeedback,
  updateOverdueFlashFeedbacks,
  updateUserPlatformRole,
  upsertFeedbackReport,
  upsertManagerEvaluation,
  upsertNineboxPosition,
  upsertSelfEvaluation,
  getCyclePhases,
  updateCyclePhase,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  calculateNineboxQuadrant,
  calculatePerformance,
  calculatePotencial,
  calculateFullNinebox,
  NINEBOX_QUADRANTS,
  FLASH_FEEDBACK_NINEBOX_QUESTIONS,
  FLASH_FEEDBACK_ACTION_PLAN_FIELDS,
} from "@shared/nineboxData";

// ─── AXIS VALUE SCHEMA ───────────────────────────────────────────────────────
const axisValueSchema = z.enum(["below", "within", "above"]);
const potencialLevelSchema = z.enum(["low", "medium", "high"]);
const performanceLevelSchema = z.enum(["low", "medium", "high"]);

// ─── RH GUARD ────────────────────────────────────────────────────────────────
const rhProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.platformRole !== "rh" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao RH." });
  }
  return next({ ctx });
});

// ─── GESTOR GUARD ────────────────────────────────────────────────────────────
const gestorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (
    ctx.user.platformRole !== "gestor" &&
    ctx.user.platformRole !== "rh" &&
    ctx.user.role !== "admin"
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── AUTH ────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── USERS ───────────────────────────────────────────────────────────────
  users: router({
    all: rhProcedure.query(() => getAllUsers()),
    updateRole: rhProcedure
      .input(
        z.object({
          userId: z.number(),
          platformRole: z.enum(["rh", "gestor", "colaborador"]),
        })
      )
      .mutation(({ input }) => updateUserPlatformRole(input.userId, input.platformRole)),
  }),

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────
  employees: router({
    all: protectedProcedure.query(() => getAllEmployees()),
    allWithManager: rhProcedure.query(() => getAllEmployeesWithManager()),
    deactivate: rhProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deactivateEmployee(input.id)),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return getEmployeeByUserId(ctx.user.id);
    }),
    directReports: gestorProcedure.query(async ({ ctx }) => {
      const me = await getEmployeeByUserId(ctx.user.id);
      if (!me) return [];
      return getDirectReports(me.id);
    }),
    update: rhProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          jobTitle: z.string().optional(),
          department: z.string().optional(),
          area: z.string().optional(),
          diretoria: z.string().optional(),
          accessPassword: z.string().optional(),
          managerId: z.number().nullable().optional(),
          userId: z.number().nullable().optional(),
          platformRole: z.enum(["rh", "gestor", "colaborador"]).optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateEmployee(id, data);
      }),
    create: rhProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().optional(),
          jobTitle: z.string().optional(),
          department: z.string().optional(),
          area: z.string().optional(),
          diretoria: z.string().optional(),
          accessPassword: z.string().optional(),
          managerId: z.number().optional(),
          platformRole: z.enum(["rh", "gestor", "colaborador"]).default("colaborador"),
        })
      )
      .mutation(({ input }) => createEmployee(input)),
    updateRole: rhProcedure
      .input(
        z.object({
          employeeId: z.number(),
          platformRole: z.enum(["rh", "gestor", "colaborador"]),
        })
      )
      .mutation(({ input }) => updateEmployee(input.employeeId, { platformRole: input.platformRole })),
    updateMyProfile: protectedProcedure
      .input(
        z.object({
          jobTitle: z.string().optional(),
          department: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });
        return updateEmployee(me.id, input);
      }),
  }),

  // ─── CYCLES ──────────────────────────────────────────────────────────────
  cycles: router({
    active: protectedProcedure.query(() => getActiveCycle()),
    all: protectedProcedure.query(() => getAllCycles()),
  }),

  // ─── CYCLE PHASES ────────────────────────────────────────────────────────────
  cyclePhases: router({
    list: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(({ input }) => getCyclePhases(input.cycleId)),

    update: rhProcedure
      .input(
        z.object({
          id: z.number(),
          startDate: z.string(), // ISO date string from frontend
          endDate: z.string(),
          titulo: z.string().optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateCyclePhase(
          input.id,
          {
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            titulo: input.titulo,
            descricao: input.descricao,
          },
          ctx.user.id
        );
        return { success: true };
      }),
  }),

  // ─── SELF EVALUATION ─────────────────────────────────────────────────────
  selfEvaluation: router({
    get: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return null;
        return getSelfEvaluation(me.id, input.cycleId);
      }),
    save: protectedProcedure
      .input(
        z.object({
          cycleId: z.number(),
          ambicao: axisValueSchema.optional(),
          ambicaoComment: z.string().optional(),
          sonharGrande: axisValueSchema.optional(),
          sonharGrandeComment: z.string().optional(),
          accountability: axisValueSchema.optional(),
          accountabilityComment: z.string().optional(),
          juntosSomosMaisFortes: axisValueSchema.optional(),
          juntosSomosMaisfortesComment: z.string().optional(),
          qualidade: axisValueSchema.optional(),
          qualidadeComment: z.string().optional(),
          contribuicao: axisValueSchema.optional(),
          contribuicaoComment: z.string().optional(),
          adaptacao: axisValueSchema.optional(),
          adaptacaoComment: z.string().optional(),
          usoDeIA: axisValueSchema.optional(),
          usoDeIAComment: z.string().optional(),
          status: z.enum(["draft", "submitted"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado." });

        let potencialAxis: "low" | "medium" | "high" | undefined;
        let performanceAxis: "low" | "medium" | "high" | undefined;
        let nineboxQuadrant: string | undefined;

        if (
          input.ambicao &&
          input.sonharGrande &&
          input.accountability &&
          input.juntosSomosMaisFortes
        ) {
          potencialAxis = calculatePotencial(
            input.ambicao,
            input.sonharGrande,
            input.accountability,
            input.juntosSomosMaisFortes
          );
        }

        if (input.qualidade && input.contribuicao && input.adaptacao && input.usoDeIA) {
          performanceAxis = calculatePerformance(
            input.qualidade,
            input.contribuicao,
            input.adaptacao,
            input.usoDeIA
          );
        }

        if (potencialAxis && performanceAxis) {
          nineboxQuadrant = calculateNineboxQuadrant(potencialAxis, performanceAxis);
        }

        const submittedAt =
          input.status === "submitted" ? new Date() : undefined;

        return upsertSelfEvaluation({
          ...input,
          employeeId: me.id,
          potencialAxis,
          performanceAxis,
          nineboxQuadrant,
          submittedAt,
        });
      }),
  }),

  // ─── MANAGER EVALUATION ──────────────────────────────────────────────────
  managerEvaluation: router({
    getForEmployee: gestorProcedure
      .input(z.object({ employeeId: z.number(), cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return null;
        return getManagerEvaluation(me.id, input.employeeId, input.cycleId);
      }),
    teamEvaluations: gestorProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return [];
        return getManagerEvaluationsForTeam(me.id, input.cycleId);
      }),
    save: gestorProcedure
      .input(
        z.object({
          employeeId: z.number(),
          cycleId: z.number(),
          ambicao: axisValueSchema.optional(),
          ambicaoComment: z.string().optional(),
          sonharGrande: axisValueSchema.optional(),
          sonharGrandeComment: z.string().optional(),
          accountability: axisValueSchema.optional(),
          accountabilityComment: z.string().optional(),
          juntosSomosMaisFortes: axisValueSchema.optional(),
          juntosSomosMaisfortesComment: z.string().optional(),
          qualidade: axisValueSchema.optional(),
          qualidadeComment: z.string().optional(),
          contribuicao: axisValueSchema.optional(),
          contribuicaoComment: z.string().optional(),
          adaptacao: axisValueSchema.optional(),
          adaptacaoComment: z.string().optional(),
          usoDeIA: axisValueSchema.optional(),
          usoDeIAComment: z.string().optional(),
          status: z.enum(["draft", "submitted"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });

        let potencialAxis: "low" | "medium" | "high" | undefined;
        let performanceAxis: "low" | "medium" | "high" | undefined;
        let nineboxQuadrant: string | undefined;

        if (
          input.ambicao &&
          input.sonharGrande &&
          input.accountability &&
          input.juntosSomosMaisFortes
        ) {
          potencialAxis = calculatePotencial(
            input.ambicao,
            input.sonharGrande,
            input.accountability,
            input.juntosSomosMaisFortes
          );
        }

        if (input.qualidade && input.contribuicao && input.adaptacao && input.usoDeIA) {
          performanceAxis = calculatePerformance(
            input.qualidade,
            input.contribuicao,
            input.adaptacao,
            input.usoDeIA
          );
        }

        if (potencialAxis && performanceAxis) {
          nineboxQuadrant = calculateNineboxQuadrant(potencialAxis, performanceAxis);
          // Auto-update ninebox position
          await upsertNineboxPosition({
            cycleId: input.cycleId,
            employeeId: input.employeeId,
            quadrant: nineboxQuadrant,
            potencialAxis,
            performanceAxis,
            isManuallyAdjusted: false,
          });
        }

        const submittedAt = input.status === "submitted" ? new Date() : undefined;

        return upsertManagerEvaluation({
          ...input,
          managerId: me.id,
          potencialAxis,
          performanceAxis,
          nineboxQuadrant,
          submittedAt,
        });
      }),
    // Gestor self-evaluation (same form but for themselves)
    saveSelf: gestorProcedure
      .input(
        z.object({
          cycleId: z.number(),
          ambicao: axisValueSchema.optional(),
          ambicaoComment: z.string().optional(),
          sonharGrande: axisValueSchema.optional(),
          sonharGrandeComment: z.string().optional(),
          accountability: axisValueSchema.optional(),
          accountabilityComment: z.string().optional(),
          juntosSomosMaisFortes: axisValueSchema.optional(),
          juntosSomosMaisfortesComment: z.string().optional(),
          qualidade: axisValueSchema.optional(),
          qualidadeComment: z.string().optional(),
          contribuicao: axisValueSchema.optional(),
          contribuicaoComment: z.string().optional(),
          adaptacao: axisValueSchema.optional(),
          adaptacaoComment: z.string().optional(),
          usoDeIA: axisValueSchema.optional(),
          usoDeIAComment: z.string().optional(),
          status: z.enum(["draft", "submitted"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });

        let potencialAxis: "low" | "medium" | "high" | undefined;
        let performanceAxis: "low" | "medium" | "high" | undefined;
        let nineboxQuadrant: string | undefined;

        if (
          input.ambicao &&
          input.sonharGrande &&
          input.accountability &&
          input.juntosSomosMaisFortes
        ) {
          potencialAxis = calculatePotencial(
            input.ambicao,
            input.sonharGrande,
            input.accountability,
            input.juntosSomosMaisFortes
          );
        }

        if (input.qualidade && input.contribuicao && input.adaptacao && input.usoDeIA) {
          performanceAxis = calculatePerformance(
            input.qualidade,
            input.contribuicao,
            input.adaptacao,
            input.usoDeIA
          );
        }

        if (potencialAxis && performanceAxis) {
          nineboxQuadrant = calculateNineboxQuadrant(potencialAxis, performanceAxis);
        }

        const submittedAt = input.status === "submitted" ? new Date() : undefined;

        return upsertSelfEvaluation({
          ...input,
          employeeId: me.id,
          potencialAxis,
          performanceAxis,
          nineboxQuadrant,
          submittedAt,
        });
      }),
  }),

  // ─── NINEBOX ─────────────────────────────────────────────────────────────
  ninebox: router({
    teamPositions: gestorProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return [];
        const reports = await getDirectReports(me.id);
        const reportIds = new Set(reports.map((r) => r.id));
        const positions = await getNineboxPositionsForTeam(me.id, input.cycleId);
        return positions.filter((p) => reportIds.has(p.employeeId));
      }),
    allPositions: rhProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(({ input }) => getAllNineboxPositions(input.cycleId)),
    myPosition: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return null;
        return getNineboxPosition(me.id, input.cycleId);
      }),
    // RH/calibration: move employee to a quadrant
    moveEmployee: rhProcedure
      .input(
        z.object({
          employeeId: z.number(),
          quadrant: z.string(),
          cycleId: z.number(),
          roomId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Determine axes from quadrant
        const qInfo = NINEBOX_QUADRANTS[input.quadrant as keyof typeof NINEBOX_QUADRANTS];
        const potencialMap: Record<string, "low" | "medium" | "high"> = {
          Q1: "low", Q2: "medium", Q3: "high",
          Q4: "low", Q5: "medium", Q6: "high",
          Q7: "low", Q8: "medium", Q9: "high",
        };
        const performanceMap: Record<string, "low" | "medium" | "high"> = {
          Q1: "low", Q2: "low", Q3: "low",
          Q4: "medium", Q5: "medium", Q6: "medium",
          Q7: "high", Q8: "high", Q9: "high",
        };
        return upsertNineboxPosition({
          employeeId: input.employeeId,
          cycleId: input.cycleId,
          quadrant: input.quadrant,
          potencialAxis: potencialMap[input.quadrant] ?? "medium",
          performanceAxis: performanceMap[input.quadrant] ?? "medium",
          isManuallyAdjusted: true,
          adjustedBy: ctx.user.id,
        });
      }),
    // RH can manually move people
    manualMove: rhProcedure
      .input(
        z.object({
          employeeId: z.number(),
          cycleId: z.number(),
          quadrant: z.string(),
          potencialAxis: potencialLevelSchema,
          performanceAxis: performanceLevelSchema,
          adjustmentNote: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return upsertNineboxPosition({
          ...input,
          isManuallyAdjusted: true,
          adjustedBy: ctx.user.id,
        });
      }),
    // Simulation: calculate where someone would be based on hypothetical answers
    simulate: protectedProcedure
      .input(
        z.object({
          ambicao: axisValueSchema,
          sonharGrande: axisValueSchema,
          accountability: axisValueSchema,
          juntosSomosMaisFortes: axisValueSchema,
          qualidade: axisValueSchema,
          contribuicao: axisValueSchema,
          adaptacao: axisValueSchema,
          usoDeIA: axisValueSchema,
        })
      )
      .query(({ input }) => {
        const potencial = calculatePotencial(
          input.ambicao,
          input.sonharGrande,
          input.accountability,
          input.juntosSomosMaisFortes
        );
        const performance = calculatePerformance(
          input.qualidade,
          input.contribuicao,
          input.adaptacao,
          input.usoDeIA
        );
        const quadrant = calculateNineboxQuadrant(potencial, performance);
        return {
          potencial,
          performance,
          quadrant,
          quadrantInfo: NINEBOX_QUADRANTS[quadrant],
        };
      }),
  }),

  // ─── FLASH FEEDBACKS ─────────────────────────────────────────────────────
  flashFeedback: router({
    myFeedbacks: protectedProcedure.query(async ({ ctx }) => {
      await updateOverdueFlashFeedbacks();
      const me = await getEmployeeByUserId(ctx.user.id);
      if (!me) return [];
      return getFlashFeedbacksForEmployee(me.id);
    }),
    teamFeedbacks: gestorProcedure.query(async ({ ctx }) => {
      await updateOverdueFlashFeedbacks();
      const me = await getEmployeeByUserId(ctx.user.id);
      if (!me) return [];
      return getFlashFeedbacksForManager(me.id);
    }),
    schedule: protectedProcedure
      .input(
        z.object({
          receiverId: z.number(),
          scheduledAt: z.string().datetime(),
          agenda: z.string().optional(),
          cycleId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });

        const id = await createFlashFeedback({
          requesterId: me.id,
          receiverId: input.receiverId,
          scheduledAt: new Date(input.scheduledAt),
          agenda: input.agenda,
          cycleId: input.cycleId,
          status: "scheduled",
        });

        // Notify receiver
        const receiver = (await getAllEmployees()).find((e) => e.id === input.receiverId);
        if (receiver?.userId) {
          await createNotification({
            userId: receiver.userId,
            type: "flash_feedback_scheduled",
            title: "Flash Feedback agendado",
            message: `${me.name} agendou um flash feedback com você para ${new Date(input.scheduledAt).toLocaleDateString("pt-BR")}.`,
            relatedId: id ?? undefined,
            relatedType: "flash_feedback",
          });
        }

        return id;
      }),
    formalize: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          feedbackContent: z.string(),
          actionPlan: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return updateFlashFeedback(input.id, {
          status: "completed",
          formalizedAt: new Date(),
          feedbackContent: input.feedbackContent,
          actionPlan: input.actionPlan,
        });
      }),
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => updateFlashFeedback(input.id, { status: "cancelled" })),
  }),

  // ─── FEEDBACK REPORTS ────────────────────────────────────────────────────
  feedbackReport: router({
    myReport: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return null;
        const report = await getFeedbackReport(me.id, input.cycleId);
        if (report && !report.viewedAt) {
          await upsertFeedbackReport({ ...report, viewedAt: new Date(), status: "viewed" });
        }
        return report;
      }),
    teamReports: gestorProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) return [];
        return getFeedbackReportsForManager(me.id, input.cycleId);
      }),
    saveDraft: gestorProcedure
      .input(
        z.object({
          employeeId: z.number(),
          cycleId: z.number(),
          finalContent: z.string(),
          finalActionPlan: z.string().optional(),
          aiFeedbackContent: z.string().optional(),
          aiActionPlan: z.string().optional(),
          evaluationId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });
        return upsertFeedbackReport({
          ...input,
          managerId: me.id,
          status: "draft",
        });
      }),
    send: gestorProcedure
      .input(z.object({ employeeId: z.number(), cycleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const me = await getEmployeeByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });
        const report = await getFeedbackReport(input.employeeId, input.cycleId);
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado." });

        await upsertFeedbackReport({ ...report, status: "sent", sentAt: new Date() });

        // Notify employee
        const emp = (await getAllEmployees()).find((e) => e.id === input.employeeId);
        if (emp?.userId) {
          await createNotification({
            userId: emp.userId,
            type: "report_sent",
            title: "Sua devolutiva está disponível",
            message: "Seu gestor enviou o resultado da sua avaliação. Acesse para visualizar.",
            relatedId: report.id,
            relatedType: "report",
          });
        }

        return true;
      }),
  }),

  // ─── AI FEATURES ─────────────────────────────────────────────────────────
  ai: router({
    // Gestor: generate structured feedback from evaluation data
    generateFeedback: gestorProcedure
      .input(
        z.object({
          employeeName: z.string(),
          evaluation: z.object({
            ambicao: axisValueSchema.optional(),
            ambicaoComment: z.string().optional(),
            sonharGrande: axisValueSchema.optional(),
            sonharGrandeComment: z.string().optional(),
            accountability: axisValueSchema.optional(),
            accountabilityComment: z.string().optional(),
            juntosSomosMaisFortes: axisValueSchema.optional(),
            juntosSomosMaisfortesComment: z.string().optional(),
            qualidade: axisValueSchema.optional(),
            qualidadeComment: z.string().optional(),
            contribuicao: axisValueSchema.optional(),
            contribuicaoComment: z.string().optional(),
            adaptacao: axisValueSchema.optional(),
            adaptacaoComment: z.string().optional(),
            usoDeIA: axisValueSchema.optional(),
            usoDeIAComment: z.string().optional(),
          }),
          quadrant: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const quadrantInfo = NINEBOX_QUADRANTS[input.quadrant as keyof typeof NINEBOX_QUADRANTS];

        const evalSummary = `
Eixo de Potencial:
- Ambição: ${input.evaluation.ambicao ?? "não avaliado"} ${input.evaluation.ambicaoComment ? `— "${input.evaluation.ambicaoComment}"` : ""}
- Sonhar Grande: ${input.evaluation.sonharGrande ?? "não avaliado"} ${input.evaluation.sonharGrandeComment ? `— "${input.evaluation.sonharGrandeComment}"` : ""}
- Accountability: ${input.evaluation.accountability ?? "não avaliado"} ${input.evaluation.accountabilityComment ? `— "${input.evaluation.accountabilityComment}"` : ""}
- Juntos Somos Mais Fortes: ${input.evaluation.juntosSomosMaisFortes ?? "não avaliado"} ${input.evaluation.juntosSomosMaisfortesComment ? `— "${input.evaluation.juntosSomosMaisfortesComment}"` : ""}

Eixo de Performance:
- Qualidade e Consistência: ${input.evaluation.qualidade ?? "não avaliado"} ${input.evaluation.qualidadeComment ? `— "${input.evaluation.qualidadeComment}"` : ""}
- Contribuição para o Negócio: ${input.evaluation.contribuicao ?? "não avaliado"} ${input.evaluation.contribuicaoComment ? `— "${input.evaluation.contribuicaoComment}"` : ""}
- Adaptação e Velocidade: ${input.evaluation.adaptacao ?? "não avaliado"} ${input.evaluation.adaptacaoComment ? `— "${input.evaluation.adaptacaoComment}"` : ""}
- Uso de IA e Automação: ${input.evaluation.usoDeIA ?? "não avaliado"} ${input.evaluation.usoDeIAComment ? `— "${input.evaluation.usoDeIAComment}"` : ""}

Posicionamento no 9-Box: ${quadrantInfo?.name ?? input.quadrant}
Descrição do quadrante: ${quadrantInfo?.description ?? ""}
Gestão de Consequência: Mérito: ${quadrantInfo?.merito ? "Sim" : "Não"} | Promoção: ${quadrantInfo?.promocao ? "Sim" : "Não"} | Bônus: ${quadrantInfo?.bonus === "yes" ? "Sim" : quadrantInfo?.bonus === "no" ? "Não" : "Por meta"}
Plano de ação do quadrante: ${quadrantInfo?.actionPlan ?? ""}
`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em gestão de pessoas da Stellar Gaming. Seu papel é ajudar gestores a estruturar feedbacks de performance claros, diretos e acionáveis.

Tom de voz Stellar Gaming:
- Direto, claro e sem rodeios
- Energético, mas não exagerado
- Próximo e humano (como um colega falando com o time)
- Confiante e objetivo
- Sem formalidade excessiva
- Sem travessões (—)
- Use listas curtas para facilitar leitura
- Destaque informações importantes
- Seja específico
- Priorize clareza sobre sofisticação

Valores da empresa: ambição, accountability, sonhar grande e juntos somos mais fortes.`,
            },
            {
              role: "user",
              content: `Estruture um feedback completo para ${input.evaluation.ambicao ? `${input.employeeName}` : "o colaborador"} com base nos dados abaixo. Inclua: (1) resumo da avaliação por eixo, (2) pontos fortes, (3) pontos de desenvolvimento, (4) plano de ação com ações específicas e prazos, (5) próximos passos claros.

${evalSummary}`,
            },
          ],
        });

        return response.choices[0]?.message?.content ?? "";
      }),

    // Colaborador: help structure flash feedback agenda
    generateAgenda: protectedProcedure
      .input(
        z.object({
          context: z.string(),
          previousFeedbacks: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um assistente de desenvolvimento pessoal da Stellar Gaming. Ajuda colaboradores a se preparar para flash feedbacks com seus gestores.

Tom de voz Stellar Gaming:
- Direto, claro e sem rodeios
- Energético, mas não exagerado
- Próximo e humano
- Confiante e objetivo
- Sem formalidade excessiva
- Sem travessões (—)
- Use listas curtas
- Sempre deixe claro "o que fazer agora"

Valores: ambição, accountability, sonhar grande e juntos somos mais fortes.`,
            },
            {
              role: "user",
              content: `Me ajude a estruturar uma pauta para meu próximo flash feedback com meu gestor.

Contexto que quero abordar: ${input.context}
${input.previousFeedbacks?.length ? `\nFeedbacks anteriores que recebi:\n${input.previousFeedbacks.join("\n")}` : ""}

Estruture uma pauta clara com: (1) objetivo da conversa, (2) pontos que quero levantar, (3) perguntas que posso fazer ao gestor, (4) o que quero sair com ao final da conversa.`,
            },
          ],
        });

        return response.choices[0]?.message?.content ?? "";
      }),

    // Gestor: analyze team curve with AI
    analyzeCurve: gestorProcedure
      .input(
        z.object({
          critical: z.number(),
          maintainer: z.number(),
          talent: z.number(),
          teamSize: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em gestão de performance da Stellar Gaming. Analisa a distribuição do time no 9-box e gera insights acionáveis.

Tom de voz Stellar Gaming: direto, claro, sem rodeios, energético mas não exagerado, próximo e humano. Sem travessões.`,
            },
            {
              role: "user",
              content: `Analise a curva de performance do meu time e gere insights acionáveis.

Distribuição atual do time (${input.teamSize} pessoas):
- Zona Crítica (Q1+Q2+Q4): ${input.critical}%
- Mantenedores (Q3+Q5+Q7): ${input.maintainer}%
- Talentos (Q6+Q8+Q9): ${input.talent}%

Curva esperada pela Stellar Gaming:
- Zona Crítica: 10%
- Mantenedores: 60%
- Talentos: 30%

Gere uma análise com: (1) diagnóstico do cenário atual vs esperado, (2) principais riscos identificados, (3) ações prioritárias recomendadas, (4) próximos passos concretos. Seja direto e específico.`,
            },
          ],
        });

        return response.choices[0]?.message?.content ?? "";
      }),

    // Gestor: generate flash feedback plan (quadrant prediction + 4-field action plan suggestions)
    generateFlashFeedbackPlan: gestorProcedure
      .input(
        z.object({
          employeeName: z.string(),
          answers: z.object({
            ambicao: axisValueSchema,
            sonharGrande: axisValueSchema,
            accountability: axisValueSchema,
            juntosSomosMaisFortes: axisValueSchema,
            qualidade: axisValueSchema,
            contribuicao: axisValueSchema,
            adaptacao: axisValueSchema,
            usoDeIA: axisValueSchema,
          }),
        })
      )
      .mutation(async ({ input }) => {
        const result = calculateFullNinebox(
          input.answers.ambicao,
          input.answers.sonharGrande,
          input.answers.accountability,
          input.answers.juntosSomosMaisFortes,
          input.answers.qualidade,
          input.answers.contribuicao,
          input.answers.adaptacao,
          input.answers.usoDeIA
        );
        const quadrantInfo = NINEBOX_QUADRANTS[result.quadrant];

        const criteriaLabels: Record<string, string> = {
          ambicao: "Ambição",
          sonharGrande: "Sonhar Grande",
          accountability: "Accountability",
          juntosSomosMaisFortes: "Juntos Somos Mais Fortes",
          qualidade: "Qualidade",
          contribuicao: "Contribuição",
          adaptacao: "Adaptação",
          usoDeIA: "Uso de IA",
        };
        const levelLabels: Record<string, string> = { below: "Abaixo", within: "Dentro", above: "Acima" };

        const criteriaText = Object.entries(input.answers)
          .map(([k, v]) => `${criteriaLabels[k]}: ${levelLabels[v]}`)
          .join("\n");

        const prompt = `Você é um especialista em gestão de pessoas da Stellar Gaming.

O gestor acabou de avaliar ${input.employeeName} no contexto de um Flash Feedback.

Resultado da avaliação:
${criteriaText}

Posicionamento calculado: ${quadrantInfo.name} (${result.quadrant})
Descrição do quadrante: ${quadrantInfo.description}
Plano de ação do quadrante: ${quadrantInfo.actionPlan}

Com base nessa avaliação, gere sugestões para o gestor preencher os 4 campos do plano de ação do Flash Feedback. Para cada campo, seja específico, direto e baseado nos critérios avaliados.

Responda em JSON com exatamente estas chaves:
{
  "feeling": "frase curta explicando onde a pessoa estaria hoje no 9-Box e por quê (ex: Hoje você estaria no Q5 porque...)",
  "oQueEstaFuncionando": "sugestão para o campo 'O que está funcionando bem'",
  "gapPrincipal": "sugestão para o campo 'Qual é o gap mais importante'",
  "acaoConcreta": "sugestão para o campo 'Qual é a ação concreta'",
  "apoioGestor": "sugestão para o campo 'O que o gestor vai fazer'"
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em gestão de pessoas da Stellar Gaming. Tom de voz: direto, claro, humano, sem travessões. Responda sempre em JSON válido.`,
            },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "flash_feedback_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  feeling: { type: "string" },
                  oQueEstaFuncionando: { type: "string" },
                  gapPrincipal: { type: "string" },
                  acaoConcreta: { type: "string" },
                  apoioGestor: { type: "string" },
                },
                required: ["feeling", "oQueEstaFuncionando", "gapPrincipal", "acaoConcreta", "apoioGestor"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
        return {
          quadrant: result.quadrant,
          quadrantInfo,
          potencialLevel: result.potencialLevel,
          performanceLevel: result.performanceLevel,
          weightedScore: result.weightedScore,
          ...parsed,
        };
      }),

    // Colaborador: platform assistant chat
    chat: protectedProcedure
      .input(
        z.object({
          message: z.string(),
          history: z
            .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é a Stella, assistente de desenvolvimento pessoal da plataforma Ciclo de Performance 2.0 da Stellar Gaming.

Seu papel: ajudar colaboradores a usar a plataforma, estruturar pautas para flash feedbacks, entender o processo de avaliação e se desenvolver.

Tom de voz Stellar Gaming:
- Direto, claro e sem rodeios
- Energético, mas não exagerado
- Próximo e humano (como um colega falando com o time)
- Confiante e objetivo
- Sem formalidade excessiva
- Sem travessões (—)
- Use listas curtas para facilitar leitura
- Sempre deixe claro "o que fazer agora"

Sobre a plataforma:
- Ciclo de Performance 2.0 com avaliação semestral
- 9-box com dois eixos: Potencial (valores) e Performance (entrega)
- Flash Feedbacks: conversas rápidas e frequentes com o gestor
- Autoavaliação: você reflete sobre sua performance e potencial
- Devolutiva: seu gestor compartilha o resultado da avaliação

Valores da Stellar: ambição, accountability, sonhar grande e juntos somos mais fortes.`,
            },
            ...(input.history ?? []),
            { role: "user", content: input.message },
          ],
        });

        return response.choices[0]?.message?.content ?? "";
      }),
  }),

  // ─── CALIBRATION (RH) ────────────────────────────────────────────────────
  calibration: router({
    rooms: rhProcedure
      .input(z.object({ cycleId: z.number().optional() }))
      .query(({ input }) => getAllCalibrationRooms(input.cycleId)),
    createRoom: rhProcedure
      .input(
        z.object({
          cycleId: z.number().optional(),
          name: z.string(),
          description: z.string().optional(),
          scheduledAt: z.string().datetime().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCalibrationRoom({
          ...input,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          createdBy: ctx.user.id,
        });
      }),
    updateRoom: rhProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["draft", "active", "completed"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateCalibrationRoom(id, data);
      }),
    addParticipant: rhProcedure
      .input(z.object({ roomId: z.number(), employeeId: z.number() }))
      .mutation(({ input }) => addCalibrationParticipant(input.roomId, input.employeeId)),
    participants: rhProcedure
      .input(z.object({ roomId: z.number() }))
      .query(({ input }) => getCalibrationParticipants(input.roomId)),
  }),

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsForUser(ctx.user.id);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markNotificationRead(input.id)),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      markAllNotificationsRead(ctx.user.id)
    ),
  }),
});

export type AppRouter = typeof appRouter;
