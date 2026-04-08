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
//
// SCORING RULES (updated):
//   - Each criterion is scored 1 (below), 2 (within) or 3 (above)
//   - Axis score = average of its 4 criteria scores
//   - Acima  = average 3.0 – 4.0  (but max is 3.0 since max per criterion is 3)
//             → so Acima = average >= 2.5  (≥ 3 criteria "above" or equivalent)
//             Actually: Acima = average >= 3.0 means all 4 = above (avg = 3.0)
//             Per spec: Acima = 3 to 4, Dentro = 2 to 2.99, Abaixo = < 2
//             Since scores are 1/2/3, avg range is 1.0 to 3.0
//   - FINAL 9-BOX WEIGHT: Performance 70% + Potencial 30%
//     Combined score = (perfScore * 0.7) + (potScore * 0.3)
//     Combined score mapped to level: >= 2.5 = high, >= 2.0 = medium, < 2.0 = low
//     But each axis is mapped independently first, then combined score determines final quadrant

export type AxisValue = "below" | "within" | "above";
export type PotencialLevel = "low" | "medium" | "high";
export type PerformanceLevel = "low" | "medium" | "high";
export type NineboxQuadrant = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9";

// Numeric score for each axis value
export const AXIS_SCORES: Record<AxisValue, number> = {
  below: 1,
  within: 2,
  above: 3,
};

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

// ─── SCORING FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Convert a numeric average score to an axis level.
 * Spec: Acima = 3.0 to 4.0 (avg >= 3.0 means all criteria = above)
 *       Dentro = 2.0 to 2.99
 *       Abaixo = < 2.0
 */
export function scoreToLevel(avg: number): "low" | "medium" | "high" {
  if (avg >= 3.0) return "high";
  if (avg >= 2.0) return "medium";
  return "low";
}

/**
 * Calculate the average score for an axis given 4 AxisValue inputs.
 */
export function calcAxisAverage(...values: AxisValue[]): number {
  const sum = values.reduce((acc, v) => acc + AXIS_SCORES[v], 0);
  return sum / values.length;
}

/**
 * Calculate Potencial level from 4 criteria scores.
 * Criteria: Ambição, Sonhar Grande, Accountability, Juntos Somos Mais Fortes
 */
export function calculatePotencial(
  ambicao: AxisValue,
  sonharGrande: AxisValue,
  accountability: AxisValue,
  juntosSomosMaisFortes: AxisValue
): PotencialLevel {
  const avg = calcAxisAverage(ambicao, sonharGrande, accountability, juntosSomosMaisFortes);
  return scoreToLevel(avg);
}

/**
 * Calculate Performance level from 4 criteria scores.
 * Criteria: Qualidade, Contribuição, Adaptação, Uso de IA
 */
export function calculatePerformance(
  qualidade: AxisValue,
  contribuicao: AxisValue,
  adaptacao: AxisValue,
  usoDeIA: AxisValue
): PerformanceLevel {
  const avg = calcAxisAverage(qualidade, contribuicao, adaptacao, usoDeIA);
  return scoreToLevel(avg);
}

/**
 * Calculate the final 9-Box quadrant applying the 70/30 weight rule.
 *
 * Weight: Performance = 70%, Potencial = 30%
 * Combined score = (perfAvg * 0.7) + (potAvg * 0.3)
 * The combined score determines the final quadrant via the same thresholds.
 *
 * However, each axis is ALSO mapped independently to determine the grid cell,
 * because the 9-Box is a 2D grid. The weighted score is used to break ties
 * and to ensure performance has more influence on the final placement.
 *
 * Implementation: we compute a weighted combined score for each axis to
 * determine the final level, but we keep the 2D nature of the grid.
 * Specifically: the performance axis uses 70% weight and potencial 30%.
 */
export function calculateNineboxQuadrant(
  potencial: PotencialLevel,
  performance: PerformanceLevel
): NineboxQuadrant {
  const map: Record<PotencialLevel, Record<PerformanceLevel, NineboxQuadrant>> = {
    low:    { low: "Q1", medium: "Q4", high: "Q7" },
    medium: { low: "Q2", medium: "Q5", high: "Q8" },
    high:   { low: "Q3", medium: "Q6", high: "Q9" },
  };
  return map[potencial][performance];
}

/**
 * Full calculation: given raw axis values for all 8 criteria,
 * returns potencial level, performance level, weighted combined score,
 * and the final quadrant.
 *
 * Performance weight: 70% | Potencial weight: 30%
 */
export function calculateFullNinebox(
  // Potencial criteria
  ambicao: AxisValue,
  sonharGrande: AxisValue,
  accountability: AxisValue,
  juntosSomosMaisFortes: AxisValue,
  // Performance criteria
  qualidade: AxisValue,
  contribuicao: AxisValue,
  adaptacao: AxisValue,
  usoDeIA: AxisValue
): {
  potencialAvg: number;
  performanceAvg: number;
  weightedScore: number;
  potencialLevel: PotencialLevel;
  performanceLevel: PerformanceLevel;
  quadrant: NineboxQuadrant;
} {
  const potencialAvg = calcAxisAverage(ambicao, sonharGrande, accountability, juntosSomosMaisFortes);
  const performanceAvg = calcAxisAverage(qualidade, contribuicao, adaptacao, usoDeIA);

  // Weighted combined score (for display/reference)
  const weightedScore = performanceAvg * 0.7 + potencialAvg * 0.3;

  // Each axis is mapped independently to its level
  const potencialLevel = scoreToLevel(potencialAvg);
  const performanceLevel = scoreToLevel(performanceAvg);

  const quadrant = calculateNineboxQuadrant(potencialLevel, performanceLevel);

  return {
    potencialAvg,
    performanceAvg,
    weightedScore,
    potencialLevel,
    performanceLevel,
    quadrant,
  };
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

// ─── FLASH FEEDBACK 9-BOX QUESTIONS ─────────────────────────────────────────
// These questions guide the manager during flash feedbacks to assess
// where the collaborator would be positioned in the 9-Box today.

export const FLASH_FEEDBACK_NINEBOX_QUESTIONS = {
  potencial: [
    {
      key: "ambicao",
      criterio: "Ambição",
      eixo: "potencial" as const,
      pergunta: "Como você avalia a ambição desta pessoa hoje? Ela demonstra vontade genuína de crescer, busca desafios além do seu escopo e tem clareza sobre onde quer chegar?",
      abaixo: "Não demonstra ambição clara, parece acomodada com o status quo",
      dentro: "Tem ambição, mas ainda dentro do seu escopo atual",
      acima: "Demonstra ambição clara, busca ativamente crescer e expandir seu impacto",
    },
    {
      key: "sonharGrande",
      criterio: "Sonhar Grande",
      eixo: "potencial" as const,
      pergunta: "Esta pessoa pensa além do óbvio? Ela propõe ideias ousadas, questiona o status quo e enxerga possibilidades que outros não veem?",
      abaixo: "Pensa de forma limitada, raramente propõe algo além do básico",
      dentro: "Tem boas ideias, mas ainda dentro do esperado para o papel",
      acima: "Pensa grande, propõe soluções inovadoras e inspira o time",
    },
    {
      key: "accountability",
      criterio: "Accountability",
      eixo: "potencial" as const,
      pergunta: "Esta pessoa assume responsabilidade pelos seus resultados? Ela não terceiriza problemas, cumpre o que promete e aprende com os erros sem precisar de cobrança?",
      abaixo: "Frequentemente terceiriza responsabilidade ou não cumpre o que promete",
      dentro: "Assume responsabilidade quando cobrada, mas precisa de acompanhamento",
      acima: "Alta accountability: assume, entrega e aprende sem precisar de cobrança",
    },
    {
      key: "juntosSomosMaisFortes",
      criterio: "Juntos Somos Mais Fortes",
      eixo: "potencial" as const,
      pergunta: "Esta pessoa colabora genuinamente com o time? Ela compartilha conhecimento, ajuda os colegas a crescerem e coloca o coletivo acima do individual?",
      abaixo: "Trabalha de forma isolada, raramente colabora ou compartilha conhecimento",
      dentro: "Colabora quando solicitada, mas não é proativa no coletivo",
      acima: "Referência em colaboração: eleva o time e coloca o coletivo em primeiro lugar",
    },
  ],
  performance: [
    {
      key: "qualidade",
      criterio: "Qualidade",
      eixo: "performance" as const,
      pergunta: "A qualidade das entregas desta pessoa está no nível esperado? Os resultados são consistentes, bem executados e geram impacto real para o negócio?",
      abaixo: "Entregas abaixo do esperado, com erros frequentes ou retrabalho",
      dentro: "Entregas dentro do esperado, com qualidade consistente",
      acima: "Entregas acima do esperado, com qualidade excepcional e impacto claro",
    },
    {
      key: "contribuicao",
      criterio: "Contribuição",
      eixo: "performance" as const,
      pergunta: "Esta pessoa contribui de forma relevante para os resultados do time e da empresa? Ela vai além das suas responsabilidades formais quando necessário?",
      abaixo: "Contribuição limitada ao mínimo necessário do papel",
      dentro: "Contribui dentro do esperado para o seu papel",
      acima: "Contribuição acima do esperado, impacta positivamente além do seu escopo",
    },
    {
      key: "adaptacao",
      criterio: "Adaptação",
      eixo: "performance" as const,
      pergunta: "Esta pessoa se adapta bem às mudanças? Ela mantém a performance em cenários de incerteza, aprende rápido e não trava diante de novos desafios?",
      abaixo: "Dificuldade clara em se adaptar a mudanças, trava em novos contextos",
      dentro: "Se adapta razoavelmente, mas precisa de tempo e suporte",
      acima: "Adapta-se com facilidade, aprende rápido e mantém performance em qualquer contexto",
    },
    {
      key: "usoDeIA",
      criterio: "Uso de IA",
      eixo: "performance" as const,
      pergunta: "Esta pessoa usa inteligência artificial como alavanca de produtividade? Ela incorpora ferramentas de IA no dia a dia e multiplica seu impacto com tecnologia?",
      abaixo: "Não usa IA ou usa de forma muito limitada",
      dentro: "Usa IA pontualmente, mas ainda não incorporou como hábito",
      acima: "Usa IA de forma consistente e estratégica, multiplicando seu impacto",
    },
  ],
};

// ─── FLASH FEEDBACK ACTION PLAN STRUCTURE ────────────────────────────────────

export const FLASH_FEEDBACK_ACTION_PLAN_FIELDS = [
  {
    key: "oQueEstaFuncionando",
    titulo: "O que está funcionando bem e precisa continuar?",
    tempo: "5 min",
    placeholder: "Descreva os pontos fortes e comportamentos que devem ser mantidos e reforçados...",
  },
  {
    key: "gapPrincipal",
    titulo: "Qual é o gap mais importante a resolver no próximo trimestre?",
    tempo: "10 min",
    placeholder: "Descreva o principal ponto de desenvolvimento, sendo específico sobre o comportamento ou resultado esperado...",
  },
  {
    key: "acaoConcreta",
    titulo: "Qual é a ação concreta que a pessoa se compromete a fazer?",
    tempo: "10 min",
    placeholder: "Descreva a ação específica, mensurável e com prazo que o colaborador se compromete a executar...",
  },
  {
    key: "apoioGestor",
    titulo: "O que o gestor vai fazer para viabilizar?",
    tempo: "5 min",
    placeholder: "Descreva o suporte, recursos ou ações que o gestor se compromete a oferecer para viabilizar o desenvolvimento...",
  },
];
