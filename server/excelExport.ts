import type { Express } from "express";
import * as XLSX from "xlsx";
import { getActiveCycle, getEvaluationReportData } from "./db";
import { sdk } from "./_core/sdk";

const SCORE_LABEL: Record<string, string> = {
  acima: "Acima das expectativas",
  dentro: "Dentro das expectativas",
  abaixo: "Abaixo das expectativas",
};

export function registerExcelExportRoute(app: Express) {
  app.get("/api/export/avaliacoes", async (req, res) => {
    // Authenticate — only RH can download
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
    try {
      user = await sdk.authenticateRequest(req as any);
    } catch {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }

    if (!user || (user as any).platformRole !== "rh") {
      res.status(403).json({ error: "Acesso restrito ao perfil RH" });
      return;
    }

    // Get active cycle
    const cycle = await getActiveCycle();
    if (!cycle) {
      res.status(404).json({ error: "Nenhum ciclo ativo encontrado" });
      return;
    }

    const data = await getEvaluationReportData(cycle.id);

    // Build worksheet rows
    const rows = data.map((row) => ({
      "Nome do Colaborador": row.employeeName ?? "",
      "E-mail": row.employeeEmail ?? "",
      "Cargo": row.jobTitle ?? "",
      "Departamento": row.department ?? "",
      "Líder Direto": row.managerName ?? "",
      // Potencial axis
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
      "Eixo Potencial": row.potencialAxis ?? "",
      "Eixo Performance": row.performanceAxis ?? "",
      "Quadrante 9-Box": row.nineboxQuadrant ?? "",
      "Status Avaliação": row.evalStatus ?? "",
      "Data de Envio": row.submittedAt
        ? new Date(row.submittedAt).toLocaleDateString("pt-BR")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, 20),
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Avaliações");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = `avaliacoes_${cycle.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
}
