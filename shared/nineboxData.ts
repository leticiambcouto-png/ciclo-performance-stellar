// ─── 9BOX DATA: QUADRANT DEFINITIONS ────────────────────────────────────────
//
// Grid layout (new orientation):
//
//   Cultura ↑
//   Alta  │ Q3  Q8  Q9
//   Média │ Q2  Q5  Q6
//   Baixa │ Q1  Q4  Q7
//          ──────────────→ Performance
//            Baixa Média Alta
//
// Axes:
//   X (horizontal) = Performance (Baixa → Alta)
//   Y (vertical)   = Cultura (Baixa → Alta)
//
// SCORING RULES:
//   - Each criterion is scored 1 (below), 2 (within) or 3 (above)
//   - Axis score = average of its 4 criteria scores
//   - Acima  = average >= 3.0
//   - Dentro = average >= 2.0 and < 3.0
//   - Abaixo = average < 2.0
//   - FINAL 9-BOX WEIGHT: Performance 70% + Cultura 30%
//     Combined score = (perfScore * 0.7) + (cultScore * 0.3)

export type AxisValue = "below" | "within" | "above";
export type CulturaLevel = "low" | "medium" | "high";
export type PerformanceLevel = "low" | "medium" | "high";
export type NineboxQuadrant = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9";

// Keep PotencialLevel as alias for backward compatibility
export type PotencialLevel = CulturaLevel;

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
  cultura: CulturaLevel;
  performance: PerformanceLevel;
  merito: boolean;
  promocao: boolean;
  bonus: "yes" | "no" | "by_goal";
  color: string;
  bgClass: string;
  actionPlan: string;
}

export const NINEBOX_QUADRANTS: Record<NineboxQuadrant, QuadrantInfo> = {
  // ── Row 1 (Cultura Baixa) ─────────────────────────────────────────────────
  Q1: {
    id: "Q1",
    name: "Crítico",
    description:
      "Performance baixa e cultura baixa. Essa pessoa não está entregando o esperado e não demonstra os comportamentos e valores da Stellar. Requer atenção imediata, plano de melhoria estruturado e decisão clara sobre continuidade.",
    zone: "critical",
    cultura: "low",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "no",
    color: "#ef4444",
    bgClass: "quadrant-critical",
    actionPlan:
      "Plano de Desenvolvimento Individual (PDI) com metas claras e prazos definidos. Reuniões semanais de acompanhamento. Decisão sobre continuidade em até 90 dias.",
  },
  Q4: {
    id: "Q4",
    name: "Resultado sem Cultura",
    description:
      "Performance média, mas cultura baixa. Entrega resultado dentro do escopo, mas não demonstra os valores e comportamentos esperados pela Stellar. O risco está na cultura: essa pessoa pode contaminar o time.",
    zone: "critical",
    cultura: "low",
    performance: "medium",
    merito: false,
    promocao: false,
    bonus: "yes",
    color: "#f97316",
    bgClass: "quadrant-silent-risk",
    actionPlan:
      "Conversa direta sobre comportamentos específicos com exemplos concretos. Plano de ajuste comportamental com prazo de 60 dias. Monitoramento próximo do gestor.",
  },
  Q7: {
    id: "Q7",
    name: "Alta Entrega, Baixa Cultura",
    description:
      "Alta performance, mas cultura baixa. Entrega muito bem, mas não demonstra os valores Stellar. É um risco cultural: pode gerar resultados no curto prazo, mas corrói a cultura no longo prazo.",
    zone: "maintainer",
    cultura: "low",
    performance: "high",
    merito: false,
    promocao: false,
    bonus: "yes",
    color: "#eab308",
    bgClass: "quadrant-result-no-culture",
    actionPlan:
      "Reconhecer a entrega, mas ser direto sobre os gaps comportamentais. Definir comportamentos específicos a desenvolver. Sem promoção até alinhamento cultural.",
  },

  // ── Row 2 (Cultura Média) ─────────────────────────────────────────────────
  Q2: {
    id: "Q2",
    name: "Crítico Comportamental",
    description:
      "Performance baixa e cultura média. Tem os valores, mas não está entregando. Pode ser falta de clareza, engajamento, recursos ou fit com o papel. Requer diagnóstico antes de qualquer decisão.",
    zone: "critical",
    cultura: "medium",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "yes",
    color: "#f97316",
    bgClass: "quadrant-behavioral-critical",
    actionPlan:
      "Conversa de diagnóstico para entender o bloqueio. Verificar se o papel está alinhado com as capacidades. Plano de ação com suporte do gestor nos próximos 60 dias.",
  },
  Q5: {
    id: "Q5",
    name: "Core / Mantenedor",
    description:
      "Cultura média e performance média. É o coração do time: entrega de forma consistente, demonstra os valores, mas não busca expandir além do seu escopo. Fundamental para a operação.",
    zone: "maintainer",
    cultura: "medium",
    performance: "medium",
    merito: true,
    promocao: false,
    bonus: "yes",
    color: "#3b82f6",
    bgClass: "quadrant-core",
    actionPlan:
      "Reconhecer a consistência. Desafiar com projetos que ampliem o escopo. Explorar o que motiva essa pessoa a crescer.",
  },
  Q6: {
    id: "Q6",
    name: "Alto Entregador",
    description:
      "Alta performance e cultura média. Entrega muito bem e de forma consistente. Tem capacidade de crescer, mas ainda não demonstrou expansão de cultura. Candidato a desafios maiores.",
    zone: "talent",
    cultura: "medium",
    performance: "high",
    merito: true,
    promocao: false,
    bonus: "yes",
    color: "#22c55e",
    bgClass: "quadrant-high-performer",
    actionPlan:
      "Dar projetos de maior complexidade. Explorar interesse em liderança ou especialização técnica. Plano de carreira claro.",
  },

  // ── Row 3 (Cultura Alta) ──────────────────────────────────────────────────
  Q3: {
    id: "Q3",
    name: "Talento Bloqueado",
    description:
      "Alta cultura, mas performance baixa. Tem os valores e a capacidade, mas não está entregando. O bloqueio pode ser o papel, o contexto, a liderança ou falta de clareza. Requer atenção urgente para não perder esse talento.",
    zone: "maintainer",
    cultura: "high",
    performance: "low",
    merito: false,
    promocao: false,
    bonus: "yes",
    color: "#a855f7",
    bgClass: "quadrant-blocked-talent",
    actionPlan:
      "Conversa profunda para entender o bloqueio. Considerar mudança de papel ou área. Plano de desbloqueio com suporte intensivo nos próximos 90 dias.",
  },
  Q8: {
    id: "Q8",
    name: "Talento a Acelerar",
    description:
      "Alta cultura e performance média. Tem tudo para ser um top performer. Está crescendo, mas ainda não atingiu o máximo. Precisa de desafios, exposição e aceleração.",
    zone: "talent",
    cultura: "high",
    performance: "medium",
    merito: true,
    promocao: true,
    bonus: "yes",
    color: "#d9f22a",
    bgClass: "quadrant-accelerate",
    actionPlan:
      "Acelerar com projetos estratégicos. Mentoria com liderança sênior. Plano de carreira acelerado. Considerar promoção no próximo ciclo.",
  },
  Q9: {
    id: "Q9",
    name: "Top Talent",
    description:
      "Alta cultura e alta performance. É o melhor que a Stellar tem. Entrega acima do esperado, demonstra todos os valores e tem capacidade de crescer ainda mais. Deve ser retido, reconhecido e acelerado.",
    zone: "talent",
    cultura: "high",
    performance: "high",
    merito: true,
    promocao: true,
    bonus: "yes",
    color: "#d9f22a",
    bgClass: "quadrant-top-talent",
    actionPlan:
      "Reconhecimento público e financeiro. Projetos de maior impacto e visibilidade. Plano de sucessão. Mentoria reversa. Retenção como prioridade.",
  },
};

// ─── SCORING FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Convert a numeric average score to an axis level.
 * Spec: Acima = avg >= 3.0, Dentro = 2.0 to 2.99, Abaixo = < 2.0
 */
export function scoreToLevel(avg: number): "low" | "medium" | "high" {
  if (avg >= 3.0) return "high";
  if (avg >= 2.0) return "medium";
  return "low";
}

/**
 * Calculate the average score for an axis given AxisValue inputs.
 */
export function calcAxisAverage(...values: AxisValue[]): number {
  const sum = values.reduce((acc, v) => acc + AXIS_SCORES[v], 0);
  return sum / values.length;
}

/**
 * Calculate Cultura level from 4 criteria scores.
 * Criteria: Ambição, Sonhar Grande, Accountability, Juntos Somos Mais Fortes
 * (Previously called "Potencial" — renamed to "Cultura")
 */
export function calculateCultura(
  ambicao: AxisValue,
  sonharGrande: AxisValue,
  accountability: AxisValue,
  juntosSomosMaisFortes: AxisValue
): CulturaLevel {
  const avg = calcAxisAverage(ambicao, sonharGrande, accountability, juntosSomosMaisFortes);
  return scoreToLevel(avg);
}

/**
 * Backward-compatible alias: calculatePotencial → calculateCultura
 */
export function calculatePotencial(
  ambicao: AxisValue,
  sonharGrande: AxisValue,
  accountability: AxisValue,
  juntosSomosMaisFortes: AxisValue
): PotencialLevel {
  return calculateCultura(ambicao, sonharGrande, accountability, juntosSomosMaisFortes);
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
 * Calculate the final 9-Box quadrant.
 *
 * Grid: X = Performance, Y = Cultura
 *   Cultura ↑
 *   Alta  │ Q3  Q8  Q9
 *   Média │ Q2  Q5  Q6
 *   Baixa │ Q1  Q4  Q7
 *          ──────────────→ Performance
 *            Baixa Média Alta
 *
 * Weight: Performance = 70%, Cultura = 30%
 * Each axis is mapped independently to determine the grid cell.
 */
export function calculateNineboxQuadrant(
  cultura: CulturaLevel,
  performance: PerformanceLevel
): NineboxQuadrant {
  const map: Record<CulturaLevel, Record<PerformanceLevel, NineboxQuadrant>> = {
    low:    { low: "Q1", medium: "Q4", high: "Q7" },
    medium: { low: "Q2", medium: "Q5", high: "Q6" },
    high:   { low: "Q3", medium: "Q8", high: "Q9" },
  };
  return map[cultura][performance];
}

/**
 * Full calculation: given raw axis values for all 8 criteria,
 * returns cultura level, performance level, weighted combined score,
 * and the final quadrant.
 *
 * Performance weight: 70% | Cultura weight: 30%
 */
export function calculateFullNinebox(
  // Cultura criteria (previously "Potencial")
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
  culturaAvg: number;
  performanceAvg: number;
  weightedScore: number;
  culturaLevel: CulturaLevel;
  performanceLevel: PerformanceLevel;
  quadrant: NineboxQuadrant;
  // Backward-compat aliases
  potencialAvg: number;
  potencialLevel: PotencialLevel;
} {
  const culturaAvg = calcAxisAverage(ambicao, sonharGrande, accountability, juntosSomosMaisFortes);
  const performanceAvg = calcAxisAverage(qualidade, contribuicao, adaptacao, usoDeIA);

  // Weighted combined score (for display/reference)
  const weightedScore = performanceAvg * 0.7 + culturaAvg * 0.3;

  // Each axis is mapped independently to its level
  const culturaLevel = scoreToLevel(culturaAvg);
  const performanceLevel = scoreToLevel(performanceAvg);

  const quadrant = calculateNineboxQuadrant(culturaLevel, performanceLevel);

  return {
    culturaAvg,
    performanceAvg,
    weightedScore,
    culturaLevel,
    performanceLevel,
    quadrant,
    // Backward-compat aliases
    potencialAvg: culturaAvg,
    potencialLevel: culturaLevel,
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
  cultura: [
    {
      key: "ambicao",
      criterio: "Ambição",
      eixo: "cultura" as const,
      pergunta: "Como você avalia a ambição desta pessoa hoje? Ela demonstra vontade genuína de crescer, busca desafios além do seu escopo e tem clareza sobre onde quer chegar?",
      abaixo: "Não demonstra ambição clara, parece acomodada com o status quo",
      dentro: "Tem ambição, mas ainda dentro do seu escopo atual",
      acima: "Demonstra ambição clara, busca ativamente crescer e expandir seu impacto",
    },
    {
      key: "sonharGrande",
      criterio: "Sonhar Grande",
      eixo: "cultura" as const,
      pergunta: "Esta pessoa pensa além do óbvio? Ela propõe ideias ousadas, questiona o status quo e enxerga possibilidades que outros não veem?",
      abaixo: "Pensa de forma limitada, raramente propõe algo além do básico",
      dentro: "Tem boas ideias, mas ainda dentro do esperado para o papel",
      acima: "Pensa grande, propõe soluções inovadoras e inspira o time",
    },
    {
      key: "accountability",
      criterio: "Accountability",
      eixo: "cultura" as const,
      pergunta: "Esta pessoa assume responsabilidade pelos seus resultados? Ela não terceiriza problemas, cumpre o que promete e aprende com os erros sem precisar de cobrança?",
      abaixo: "Frequentemente terceiriza responsabilidade ou não cumpre o que promete",
      dentro: "Assume responsabilidade quando cobrada, mas precisa de acompanhamento",
      acima: "Alta accountability: assume, entrega e aprende sem precisar de cobrança",
    },
    {
      key: "juntosSomosMaisFortes",
      criterio: "Juntos Somos Mais Fortes",
      eixo: "cultura" as const,
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
  // Backward-compat alias
  get potencial() { return this.cultura; },
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
