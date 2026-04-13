import type { Express } from "express";
import * as XLSX from "xlsx";
import {
  getActiveCycle,
  getConsequencesWithEmployeeData,
  getEvaluationReportData,
  getCollaboratorsReportData,
  getNineboxReportData,
  getFlashFeedbacksReportData,
  getConsolidatedPanelData,
} from "./db";
import { verifyStellarToken } from "./customAuth";

const STELLAR_COOKIE = "stellar_session";

async function authenticateRH(req: any): Promise<boolean> {
  try {
    const cookies = req.cookies ?? {};
    const token = cookies[STELLAR_COOKIE];
    if (!token) return false;
    const payload = await verifyStellarToken(token);
    return payload?.platformRole === "rh";
  } catch {
    return false;
  }
}

const SCORE_LABEL: Record<string, string> = {
  acima: "Acima das expectativas",
  dentro: "Dentro das expectativas",
  abaixo: "Abaixo das expectativas",
};

const AXIS_LABEL: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

const ROLE_LABEL: Record<string, string> = {
  colaborador: "Colaborador",
  gestor: "Gestor",
  rh: "RH",
};

const CONSEQUENCE_LABEL: Record<string, string> = {
  merito: "Mérito",
  promocao: "Promoção",
  desligamento: "Desligamento",
  plano_recuperacao: "Plano de Recuperação",
  nenhuma: "Nenhuma decisão",
};

const FF_STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Realizado",
  overdue: "Atrasado",
  cancelled: "Cancelado",
};

function makeWorkbook(sheetName: string, rows: Record<string, any>[]): Buffer {
  const fallback = [{ Mensagem: "Nenhum dado encontrado" }];
  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : fallback);
  const colWidths = Object.keys((rows[0] ?? fallback[0])).map((key) => ({
    wch: Math.max(key.length + 2, 22),
  }));
  worksheet["!cols"] = colWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function sendXlsx(res: any, buffer: Buffer, filename: string) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export function registerExcelExportRoute(app: Express) {
  const today = () => new Date().toISOString().slice(0, 10);

  // ── Relatório 1: Colaboradores ─────────────────────────────────────────────
  app.get("/api/export/colaboradores", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const data = await getCollaboratorsReportData();
    const rows = data.map((e) => ({
      "Nome": e.name ?? "",
      "E-mail": e.email ?? "",
      "Cargo": e.jobTitle ?? "",
      "Departamento": e.department ?? "",
      "Área": e.area ?? "",
      "Diretoria": e.diretoria ?? "",
      "Líder Direto": e.managerName ?? "",
      "Perfil Principal": ROLE_LABEL[e.platformRole ?? ""] ?? e.platformRole ?? "",
      "Perfil Secundário": e.secondaryPlatformRole ? (ROLE_LABEL[e.secondaryPlatformRole] ?? e.secondaryPlatformRole) : "",
      "Status": e.isActive ? "Ativo" : "Inativo",
      "Cadastrado em": e.createdAt ? new Date(e.createdAt).toLocaleDateString("pt-BR") : "",
    }));
    sendXlsx(res, makeWorkbook("Colaboradores", rows), `colaboradores_${today()}.xlsx`);
  });

  // ── Relatório 2: Avaliações ────────────────────────────────────────────────
  app.get("/api/export/avaliacoes", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const cycle = await getActiveCycle();
    if (!cycle) { res.status(404).json({ error: "Nenhum ciclo ativo" }); return; }
    const data = await getEvaluationReportData(cycle.id);
    const rows = data.map((row) => ({
      "Nome do Colaborador": row.employeeName ?? "",
      "E-mail": row.employeeEmail ?? "",
      "Cargo": row.jobTitle ?? "",
      "Departamento": row.department ?? "",
      "Líder Direto": row.managerName ?? "",
      // Cultura axis
      "Ambição": SCORE_LABEL[row.ambicao ?? ""] ?? row.ambicao ?? "",
      "Comentário Ambição": row.ambicaoComment ?? "",
      "Sonhar Grande": SCORE_LABEL[row.sonharGrande ?? ""] ?? row.sonharGrande ?? "",
      "Comentário Sonhar Grande": row.sonharGrandeComment ?? "",
      "Accountability": SCORE_LABEL[row.accountability ?? ""] ?? row.accountability ?? "",
      "Comentário Accountability": row.accountabilityComment ?? "",
      "Juntos Somos Mais Fortes": SCORE_LABEL[row.juntosSomosMaisFortes ?? ""] ?? row.juntosSomosMaisFortes ?? "",
      "Comentário Juntos Somos Mais Fortes": row.juntosSomosMaisfortesComment ?? "",
      // Performance axis
      "Qualidade": SCORE_LABEL[row.qualidade ?? ""] ?? row.qualidade ?? "",
      "Comentário Qualidade": row.qualidadeComment ?? "",
      "Contribuição": SCORE_LABEL[row.contribuicao ?? ""] ?? row.contribuicao ?? "",
      "Comentário Contribuição": row.contribuicaoComment ?? "",
      "Adaptação": SCORE_LABEL[row.adaptacao ?? ""] ?? row.adaptacao ?? "",
      "Comentário Adaptação": row.adaptacaoComment ?? "",
      "Uso de IA": SCORE_LABEL[row.usoDeIA ?? ""] ?? row.usoDeIA ?? "",
      "Comentário Uso de IA": row.usoDeIAComment ?? "",
      // Summary
      "Eixo Cultura": AXIS_LABEL[row.potencialAxis ?? ""] ?? row.potencialAxis ?? "",
      "Eixo Performance": AXIS_LABEL[row.performanceAxis ?? ""] ?? row.performanceAxis ?? "",
      "Quadrante 9-Box": row.nineboxQuadrant ?? "",
      "Status Avaliação": row.evalStatus ?? "",
      "Data de Envio": row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("pt-BR") : "",
    }));
    sendXlsx(res, makeWorkbook("Avaliações", rows), `avaliacoes_${cycle.name.replace(/\s+/g, "_")}_${today()}.xlsx`);
  });

  // ── Relatório 3: 9-Box ─────────────────────────────────────────────────────
  app.get("/api/export/ninebox", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const cycle = await getActiveCycle();
    const data = await getNineboxReportData(cycle?.id);
    const rows = data.map((p) => ({
      "Nome do Colaborador": p.employeeName ?? "",
      "E-mail": p.employeeEmail ?? "",
      "Cargo": p.jobTitle ?? "",
      "Área": p.area ?? "",
      "Diretoria": p.diretoria ?? "",
      "Líder Direto": p.managerName ?? "",
      "Eixo Performance": AXIS_LABEL[p.performanceAxis ?? ""] ?? p.performanceAxis ?? "",
      "Eixo Cultura": AXIS_LABEL[p.potencialAxis ?? ""] ?? p.potencialAxis ?? "",
      "Quadrante": p.quadrant ?? "",
      "Ajustado Manualmente": p.isManuallyAdjusted ? "Sim" : "Não",
      "Observação do Ajuste": p.adjustmentNote ?? "",
      "Última Atualização": p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("pt-BR") : "",
    }));
    const cycleName = cycle?.name?.replace(/\s+/g, "_") ?? "ciclo";
    sendXlsx(res, makeWorkbook("9-Box", rows), `ninebox_${cycleName}_${today()}.xlsx`);
  });

  // ── Relatório 4: Flash Feedbacks ───────────────────────────────────────────
  app.get("/api/export/flash-feedbacks", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const data = await getFlashFeedbacksReportData();
    const rows = data.map((f) => ({
      "Gestor (Solicitante)": f.requesterName ?? "",
      "E-mail Gestor": f.requesterEmail ?? "",
      "Colaborador (Receptor)": f.receiverName ?? "",
      "E-mail Colaborador": f.receiverEmail ?? "",
      "Cargo Colaborador": f.receiverJobTitle ?? "",
      "Data Agendada": f.scheduledAt ? new Date(f.scheduledAt).toLocaleDateString("pt-BR") : "",
      "Status": FF_STATUS_LABEL[f.status ?? ""] ?? f.status ?? "",
      "Pauta": f.agenda ?? "",
      "Conteúdo do Feedback": f.feedbackContent ?? "",
      "Plano de Ação": f.actionPlan ?? "",
      "Realizado em": f.formalizedAt ? new Date(f.formalizedAt).toLocaleDateString("pt-BR") : "",
    }));
    sendXlsx(res, makeWorkbook("Flash Feedbacks", rows), `flash_feedbacks_${today()}.xlsx`);
  });

  // ── Relatório 5: Gestão de Consequência ───────────────────────────────────
  app.get("/api/export/consequencias", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const cycle = await getActiveCycle();
    const data = await getConsequencesWithEmployeeData(cycle?.id);
    const rows = data.map((row) => ({
      "Nome do Colaborador": row.employeeName,
      "E-mail": row.employeeEmail,
      "Cargo": row.jobTitle,
      "Área": row.area,
      "Diretoria": row.diretoria,
      "Líder Direto": row.managerName,
      "Sala de Calibração": row.roomName,
      "Quadrante 9-Box": row.quadrant,
      "Decisão": CONSEQUENCE_LABEL[row.consequence] ?? row.consequence,
      "Observações": row.notes,
      "Data da Decisão": row.decidedAt ? new Date(row.decidedAt).toLocaleDateString("pt-BR") : "",
    }));
    const cycleName = cycle?.name?.replace(/\s+/g, "_") ?? "ciclo";
    sendXlsx(res, makeWorkbook("Consequências", rows), `consequencias_${cycleName}_${today()}.xlsx`);
  });

  // ── Relatório 6: Painel Geral Consolidado ──────────────────────────────────
  app.get("/api/export/painel-geral", async (req, res) => {
    if (!(await authenticateRH(req))) { res.status(403).json({ error: "Acesso restrito ao perfil RH" }); return; }
    const cycle = await getActiveCycle();
    const data = await getConsolidatedPanelData(cycle?.id);
    const rows = data.map((row) => ({
      "Nome do Colaborador": row.employeeName ?? "",
      "E-mail": row.employeeEmail ?? "",
      "Cargo": row.jobTitle ?? "",
      "Área": row.area ?? "",
      "Diretoria": row.diretoria ?? "",
      "Líder Direto": row.managerName ?? "",
      "Perfil": ROLE_LABEL[row.platformRole ?? ""] ?? row.platformRole ?? "",
      // 9-Box
      "Quadrante Inicial": row.quadranteInicial ?? "",
      "Quadrante Calibrado": row.quadranteCalibracao ?? "",
      "Eixo Performance (9-Box)": AXIS_LABEL[row.performanceAxis ?? ""] ?? row.performanceAxis ?? "",
      "Eixo Cultura (9-Box)": AXIS_LABEL[row.potencialAxis ?? ""] ?? row.potencialAxis ?? "",
      // Avaliação
      "Status Avaliação": row.statusAvaliacao ?? "",
      "Nota Performance": AXIS_LABEL[row.notaPerformance ?? ""] ?? row.notaPerformance ?? "",
      "Nota Cultura": AXIS_LABEL[row.notaCultura ?? ""] ?? row.notaCultura ?? "",
      "Feedback Geral do Gestor": row.feedbackGeral ?? "",
      // Consequência
      "Consequência Definida": CONSEQUENCE_LABEL[row.consequencia ?? ""] ?? row.consequencia ?? "",
      "Sala de Calibração": row.salaCalibração ?? "",
      "Observações Consequência": row.observacoesConsequencia ?? "",
    }));
    const cycleName = cycle?.name?.replace(/\s+/g, "_") ?? "ciclo";
    sendXlsx(res, makeWorkbook("Painel Geral", rows), `painel_geral_${cycleName}_${today()}.xlsx`);
  });
}
