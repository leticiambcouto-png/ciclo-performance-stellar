// ─── 9BOX DATA: QUADRANT DEFINITIONS ────────────────────────────────────────
//
// Grid layout (renumbered):
//
//   Performance ↑
//   Alta  │ Q7  Q8  Q9
//   Média │ Q4  Q5  Q6
//   Baixa │ Q1  Q2  Q3
//          ──────────────→ Potencial
//            Baixo Médio Alto
//
// Swaps applied vs original numbering:
//   Q3 ↔ Q7  (low-perf/high-pot  ↔  high-perf/low-pot)
//   Q6 ↔ Q8  (mid-perf/high-pot  ↔  high-perf/mid-pot)

export type AxisValue = "below" | "within" | "above";
export type PotencialLevel = "low" | "medium" | "high";
export type PerformanceLevel = "low" | "medium" | "high";
export type NineboxQuadrant = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9";

export interface QuadrantInfo {
  id: NineboxQuadrant;
  name: string;
  description: string;
  zone: "critical" | "maintainer" | "talent";
  potencial: PotencialLevel;
  performance: PerformanceLevel;
  merito: boolean;
  promocao: boolean;
  bonus: "yes" | "no" | "by_goal";
  color: string;
  bgClass: string;
  actionPlan: string;
}

export const NINEBOX_QUADRANTS: Record<NineboxQuadrant, QuadrantInfo> = {
  // ── Row 1 (Performance Baixa) ─────────────────────────────────────────────
  Q1: {
    id: "Q1",
    name: "Crítico",
    description:
      "Performance baixa e potencial baixo. Essa pessoa não está entregando o esperado e não demonstra os comportamentos e valores da Stellar. Requer atenção imediata, plano de melhoria estruturado e decisão clara sobre continuidade.",
    zone: "critical",
    potencial: "low",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "no",
    color: "#ef4444",
    bgClass: "quadrant-critical",
    actionPlan:
      "Plano de Desenvolvimento Individual (PDI) com metas claras e prazos definidos. Reuniões semanais de acompanhamento. Decisão sobre continuidade em até 90 dias.",
  },
  Q2: {
    id: "Q2",
    name: "Crítico Comportamental",
    description:
      "Performance baixa e potencial médio. Tem capacidade de entregar mais, mas algo está bloqueando. Pode ser falta de clareza, engajamento, recursos ou fit com o papel. Requer diagnóstico antes de qualquer decisão.",
    zone: "critical",
    potencial: "medium",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "by_goal",
    color: "#f97316",
    bgClass: "quadrant-behavioral-critical",
    actionPlan:
      "Conversa de diagnóstico para entender o bloqueio. Verificar se o papel está alinhado com as capacidades. Plano de ação com suporte do gestor nos próximos 60 dias.",
  },
  Q3: {
    id: "Q3",
    name: "Talento Bloqueado",
    description:
      "Alto potencial, mas performance baixa. Tem os valores e a capacidade, mas não está entregando. O bloqueio pode ser o papel, o contexto, a liderança ou falta de clareza. Requer atenção urgente para não perder esse talento.",
    zone: "maintainer",
    potencial: "high",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "by_goal",
    color: "#a855f7",
    bgClass: "quadrant-blocked-talent",
    actionPlan:
      "Conversa profunda para entender o bloqueio. Considerar mudança de papel ou área. Plano de desbloqueio com suporte intensivo nos próximos 90 dias.",
  },

  // ── Row 2 (Performance Média) ─────────────────────────────────────────────
  Q4: {
    id: "Q4",
    name: "Risco Silencioso",
    description:
      "Potencial baixo e performance média. Entrega resultado dentro do escopo, mas não demonstra os valores e comportamentos esperados pela Stellar. O risco está na cultura: essa pessoa pode contaminar o time.",
    zone: "critical",
    potencial: "low",
    performance: "medium",
    merito: false,
    promocao: false,
    bonus: "by_goal",
    color: "#f97316",
    bgClass: "quadrant-silent-risk",
    actionPlan:
      "Conversa direta sobre comportamentos específicos com exemplos concretos. Plano de ajuste comportamental com prazo de 60 dias. Monitoramento próximo do gestor.",
  },
  Q5: {
    id: "Q5",
    name: "Core / Mantenedor",
    description:
      "Potencial médio e performance média. É o coração do time: entrega de forma consistente, demonstra os valores, mas não busca expandir além do seu escopo. Fundamental para a operação.",
    zone: "maintainer",
    potencial: "medium",
    performance: "medium",
    merito: true,
    promocao: false,
    bonus: "by_goal",
    color: "#3b82f6",
    bgClass: "quadrant-core",
    actionPlan:
      "Reconhecer a consistência. Desafiar com projetos que ampliem o escopo. Explorar o que motiva essa pessoa a crescer.",
  },
  Q6: {
    id: "Q6",
    name: "Talento a Acelerar",
    description:
      "Alto potencial e performance média. Tem tudo para ser um top performer. Está crescendo, mas ainda não atingiu o máximo. Precisa de desafios, exposição e aceleração.",
    zone: "talent",
    potencial: "high",
    performance: "medium",
    merito: true,
    promocao: true,
    bonus: "by_goal",
    color: "#d9f22a",
    bgClass: "quadrant-accelerate",
    actionPlan:
      "Acelerar com projetos estratégicos. Mentoria com liderança sênior. Plano de carreira acelerado. Considerar promoção no próximo ciclo.",
  },

  // ── Row 3 (Performance Alta) ──────────────────────────────────────────────
  Q7: {
    id: "Q7",
    name: "Resultado sem Cultura",
    description:
      "Alta performance, mas potencial baixo. Entrega muito bem, mas não demonstra os valores Stellar. É um risco cultural: pode gerar resultados no curto prazo, mas corrói a cultura no longo prazo.",
    zone: "maintainer",
    potencial: "low",
    performance: "high",
    merito: false,
    promocao: false,
    bonus: "yes",
    color: "#eab308",
    bgClass: "quadrant-result-no-culture",
    actionPlan:
      "Reconhecer a entrega, mas ser direto sobre os gaps comportamentais. Definir comportamentos específicos a desenvolver. Sem promoção até alinhamento cultural.",
  },
  Q8: {
    id: "Q8",
    name: "Alto Entregador",
    description:
      "Potencial médio e alta performance. Entrega muito bem e de forma consistente. Tem capacidade de crescer, mas ainda não demonstrou expansão de potencial. Candidato a desafios maiores.",
    zone: "talent",
    potencial: "medium",
    performance: "high",
    merito: true,
    promocao: false,
    bonus: "by_goal",
    color: "#22c55e",
    bgClass: "quadrant-high-performer",
    actionPlan:
      "Dar projetos de maior complexidade. Explorar interesse em liderança ou especialização técnica. Plano de carreira claro.",
  },
  Q9: {
    id: "Q9",
    name: "Top Talent",
    description:
      "Alto potencial e alta performance. É o melhor que a Stellar tem. Entrega acima do esperado, demonstra todos os valores e tem capacidade de crescer ainda mais. Deve ser retido, reconhecido e acelerado.",
    zone: "talent",
    potencial: "high",
    performance: "high",
    merito: true,
    promocao: true,
    bonus: "by_goal",
    color: "#d9f22a",
    bgClass: "quadrant-top-talent",
    actionPlan:
      "Reconhecimento público e financeiro. Projetos de maior impacto e visibilidade. Plano de sucessão. Mentoria reversa. Retenção como prioridade.",
  },
};

// ─── CALCULATION LOGIC ───────────────────────────────────────────────────────

export function calculatePotencial(
  ambicao: AxisValue,
  sonharGrande: AxisValue,
  accountability: AxisValue,
  juntosSomosMaisFortes: AxisValue
): PotencialLevel {
  // Rule: Any "below" in Accountability OR Ambição → Potencial Baixo
  if (accountability === "below" || ambicao === "below") {
    return "low";
  }

  const values = [ambicao, sonharGrande, accountability, juntosSomosMaisFortes];
  const aboveCount = values.filter((v) => v === "above").length;

  // Rule: 3 or 4 "above" → Potencial Alto
  if (aboveCount >= 3) {
    return "high";
  }

  // Rule: Mix of "within" and "above", no "below" → Potencial Médio
  return "medium";
}

export function calculatePerformance(
  qualidade: AxisValue,
  contribuicao: AxisValue,
  adaptacao: AxisValue,
  usoDeIA: AxisValue
): PerformanceLevel {
  const values = [qualidade, contribuicao, adaptacao, usoDeIA];
  const aboveCount = values.filter((v) => v === "above").length;

  // Rule: 3 or 4 "above" → Performance Alta
  if (aboveCount >= 3) {
    return "high";
  }

  // Rule: Any "below" in dimensions 1 or 2 (qualidade or contribuicao) → Performance Baixa
  if (qualidade === "below" || contribuicao === "below") {
    return "low";
  }

  // Rule: Any "below" in dimensions 3 or 4 → Performance Média (with attention flag)
  if (adaptacao === "below" || usoDeIA === "below") {
    return "medium";
  }

  // Rule: Majority "within", no "below" → Performance Média
  return "medium";
}

export function calculateNineboxQuadrant(
  potencial: PotencialLevel,
  performance: PerformanceLevel
): NineboxQuadrant {
  // Grid (renumbered):
  //   Performance ↑
  //   Alta  │ Q7  Q8  Q9
  //   Média │ Q4  Q5  Q6
  //   Baixa │ Q1  Q2  Q3
  //          ──────────────→ Potencial
  //            Baixo Médio Alto
  const map: Record<PotencialLevel, Record<PerformanceLevel, NineboxQuadrant>> = {
    low:    { low: "Q1", medium: "Q4", high: "Q7" },
    medium: { low: "Q2", medium: "Q5", high: "Q8" },
    high:   { low: "Q3", medium: "Q6", high: "Q9" },
  };
  return map[potencial][performance];
}

// ─── CURVE ANALYSIS ──────────────────────────────────────────────────────────

export const STELLAR_EXPECTED_CURVE = {
  critical: 10,   // Q1 + Q2 + Q4
  maintainer: 60, // Q3 + Q5 + Q7
  talent: 30,     // Q6 + Q8 + Q9
};

export function getCurveZone(quadrant: NineboxQuadrant): "critical" | "maintainer" | "talent" {
  return NINEBOX_QUADRANTS[quadrant].zone;
}

export function calculateCurveDistribution(quadrants: NineboxQuadrant[]): {
  critical: number;
  maintainer: number;
  talent: number;
} {
  const total = quadrants.length;
  if (total === 0) return { critical: 0, maintainer: 0, talent: 0 };

  const counts = { critical: 0, maintainer: 0, talent: 0 };
  for (const q of quadrants) {
    counts[getCurveZone(q)]++;
  }

  return {
    critical: Math.round((counts.critical / total) * 100),
    maintainer: Math.round((counts.maintainer / total) * 100),
    talent: Math.round((counts.talent / total) * 100),
  };
}
