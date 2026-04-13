import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  Clock,
  Save,
  Send,
  User,
  Users,
  ArrowLeft,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useViewMode, type ViewMode } from "@/hooks/useViewMode";
import { ViewModeTabs } from "@/components/ViewModeTabs";

type AxisValue = "below" | "within" | "above";

interface Criterion {
  key: string;
  label: string;
  description: string;
  anchors: { below: string; within: string; above: string };
}

const POTENCIAL_CRITERIA: Criterion[] = [
  {
    key: "ambicao",
    label: "Ambição",
    description: "Busca crescer, se desafiar e expandir seu impacto continuamente.",
    anchors: {
      below: "Não demonstra interesse em crescer além do escopo atual. Confortável com o status quo.",
      within: "Busca crescimento quando estimulado. Aceita desafios, mas raramente os provoca.",
      above: "Proativamente busca desafios maiores. Quer impactar além do seu papel atual.",
    },
  },
  {
    key: "sonharGrande",
    label: "Sonhar Grande",
    description: "Pensa além do óbvio e propõe soluções que ampliam o horizonte do time.",
    anchors: {
      below: "Foco no operacional. Raramente propõe ideias que vão além do escopo imediato.",
      within: "Contribui com ideias dentro do escopo. Às vezes propõe melhorias incrementais.",
      above: "Constantemente traz perspectivas novas. Desafia o time a pensar maior.",
    },
  },
  {
    key: "accountability",
    label: "Accountability",
    description: "Assume responsabilidade pelos resultados, erros e aprendizados.",
    anchors: {
      below: "Tende a atribuir falhas a fatores externos. Dificuldade em assumir erros.",
      within: "Assume responsabilidade quando diretamente envolvido. Pode minimizar impacto.",
      above: "Dono dos resultados, bons ou ruins. Aprende com erros e compartilha aprendizados.",
    },
  },
  {
    key: "juntosSomosMaisFortes",
    label: "Juntos Somos Mais Fortes",
    description: "Colabora, compartilha conhecimento e eleva o nível do time.",
    anchors: {
      below: "Trabalha de forma isolada. Raramente compartilha conhecimento ou ajuda o time.",
      within: "Colabora quando solicitado. Contribui com o time dentro do seu escopo.",
      above: "Multiplica o time. Compartilha proativamente, mentora e eleva o nível coletivo.",
    },
  },
];

const PERFORMANCE_CRITERIA: Criterion[] = [
  {
    key: "qualidade",
    label: "Qualidade e Consistência",
    description: "Entrega com excelência, atenção aos detalhes e de forma consistente.",
    anchors: {
      below: "Entregas com qualidade abaixo do esperado. Retrabalho frequente.",
      within: "Entrega dentro do padrão esperado. Qualidade consistente no escopo definido.",
      above: "Entrega acima do padrão. Referência de qualidade para o time.",
    },
  },
  {
    key: "contribuicao",
    label: "Contribuição para o Negócio",
    description: "Gera impacto real e mensurável nos resultados da empresa.",
    anchors: {
      below: "Contribuição abaixo do esperado para o papel. Impacto limitado nos resultados.",
      within: "Contribui conforme esperado. Entrega o que é necessário para o negócio.",
      above: "Contribuição acima do esperado. Gera impacto além do seu papel.",
    },
  },
  {
    key: "adaptacao",
    label: "Adaptação e Velocidade",
    description: "Adapta-se rapidamente a mudanças e aprende com agilidade.",
    anchors: {
      below: "Dificuldade em se adaptar a mudanças. Lento para incorporar novos aprendizados.",
      within: "Adapta-se quando necessário. Aprende no ritmo esperado para o papel.",
      above: "Abraça mudanças proativamente. Aprende rápido e ajuda o time a se adaptar.",
    },
  },
  {
    key: "usoDeIA",
    label: "Uso de IA e Automação",
    description: "Utiliza ferramentas de IA para ampliar produtividade e qualidade.",
    anchors: {
      below: "Não utiliza IA no trabalho. Resiste ou ignora ferramentas disponíveis.",
      within: "Usa IA quando orientado. Incorpora ferramentas básicas no dia a dia.",
      above: "Usa IA de forma estratégica. Encontra novas formas de ampliar impacto com tecnologia.",
    },
  },
];

const AXIS_LABELS: Record<AxisValue, { label: string; color: string; bg: string }> = {
  below: { label: "Abaixo", color: "#ef4444", bg: "#ef444415" },
  within: { label: "Dentro", color: "#f59e0b", bg: "#f59e0b15" },
  above: { label: "Acima", color: "#22c55e", bg: "#22c55e15" },
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: "#0a306020", color: "#8aa3c0" }}
      >
        <Circle size={8} />
        Não iniciado
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: "#f59e0b15", color: "#f59e0b" }}
      >
        <Clock size={8} />
        Em andamento
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: "#22c55e15", color: "#22c55e" }}
    >
      <CheckCircle size={8} />
      Enviado
    </span>
  );
}

function CriterionCard({
  criterion,
  value,
  comment,
  onChange,
  onCommentChange,
}: {
  criterion: Criterion;
  value?: AxisValue;
  comment?: string;
  onChange: (v: AxisValue) => void;
  onCommentChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: "#001830",
        borderColor: value ? "#d9f22a30" : "#0a3060",
      }}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {value ? (
            <CheckCircle size={18} style={{ color: "#d9f22a" }} />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: "#0a3060" }} />
          )}
          <div>
            <p className="font-semibold text-sm" style={{ color: "#fdffdf" }}>{criterion.label}</p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>{criterion.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {value && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: AXIS_LABELS[value].bg,
                color: AXIS_LABELS[value].color,
              }}
            >
              {AXIS_LABELS[value].label}
            </span>
          )}
          {expanded ? <ChevronUp size={16} style={{ color: "#8aa3c0" }} /> : <ChevronDown size={16} style={{ color: "#8aa3c0" }} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#0a3060" }}>
          <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2 pt-3">
            {(["below", "within", "above"] as AxisValue[]).map((v) => (
              <button
                key={v}
                onClick={() => onChange(v)}
                className="p-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: value === v ? AXIS_LABELS[v].bg : "#001023",
                  borderColor: value === v ? AXIS_LABELS[v].color : "#0a3060",
                }}
              >
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: value === v ? AXIS_LABELS[v].color : "#8aa3c0" }}
                >
                  {AXIS_LABELS[v].label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#8aa3c0" }}>
                  {criterion.anchors[v]}
                </p>
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Adicione um comentário ou exemplo específico (opcional)..."
            value={comment ?? ""}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            style={{
              backgroundColor: "#001023",
              borderColor: "#0a3060",
              color: "#fdffdf",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── EVALUATION FORM ─────────────────────────────────────────────────────────

function EvaluationForm({
  cycleId,
  isSelfEval,
  employeeId,
  employeeName,
  onBack,
}: {
  cycleId: number;
  isSelfEval: boolean;
  employeeId?: number;
  employeeName?: string;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, AxisValue | string>>({});
  const utils = trpc.useUtils();

  const { data: selfEval } = trpc.selfEvaluation.get.useQuery(
    { cycleId },
    { enabled: isSelfEval && cycleId > 0 }
  );

  const { data: managerEval } = trpc.managerEvaluation.getForEmployee.useQuery(
    { employeeId: employeeId ?? 0, cycleId },
    { enabled: !isSelfEval && !!employeeId && cycleId > 0 }
  );

  const { data: cyclePhases } = trpc.cyclePhases.list.useQuery(
    { cycleId },
    { enabled: cycleId > 0 }
  );

  const now = Date.now();
  const selfEvalPhase = cyclePhases?.find((p) => p.phaseNumber === 2);
  const managerEvalPhase = cyclePhases?.find((p) => p.phaseNumber === 3);
  const selfEvalOpen = !selfEvalPhase || new Date(selfEvalPhase.startDate).getTime() <= now;
  const managerEvalOpen = !managerEvalPhase || new Date(managerEvalPhase.startDate).getTime() <= now;
  const isPhaseBlocked = isSelfEval ? !selfEvalOpen : !managerEvalOpen;
  const blockedPhase = isSelfEval ? selfEvalPhase : managerEvalPhase;

  const saveSelf = trpc.selfEvaluation.save.useMutation({
    onSuccess: () => {
      toast.success("Autoavaliação salva com sucesso!");
      utils.selfEvaluation.get.invalidate();
      utils.cycles.evaluationSummary.invalidate();
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  const saveManager = trpc.managerEvaluation.save.useMutation({
    onSuccess: () => {
      toast.success("Avaliação salva com sucesso!");
      utils.managerEvaluation.getForEmployee.invalidate();
      utils.cycles.evaluationSummary.invalidate();
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  useEffect(() => {
    const source = isSelfEval ? selfEval : managerEval;
    if (source) {
      const data: Record<string, AxisValue | string> = {};
      // Map field keys to their actual DB comment field names (some have irregular casing)
      const fieldCommentMap: Record<string, string> = {
        ambicao: "ambicaoComment",
        sonharGrande: "sonharGrandeComment",
        accountability: "accountabilityComment",
        juntosSomosMaisFortes: "juntosSomosMaisfortesComment", // lowercase 'f' in DB
        qualidade: "qualidadeComment",
        contribuicao: "contribuicaoComment",
        adaptacao: "adaptacaoComment",
        usoDeIA: "usoDeIAComment",
      };
      for (const [f, commentKey] of Object.entries(fieldCommentMap)) {
        if ((source as any)[f]) data[f] = (source as any)[f];
        if ((source as any)[commentKey]) data[commentKey] = (source as any)[commentKey];
      }
      if ((source as any).feedbackGeral) data.feedbackGeral = (source as any).feedbackGeral;
      setFormData(data);
    } else {
      setFormData({});
    }
  }, [selfEval, managerEval, isSelfEval]);

  const setField = (key: string, value: AxisValue) => setFormData((p) => ({ ...p, [key]: value }));
  // Map field key to DB comment field name (handles irregular casing)
  const COMMENT_FIELD: Record<string, string> = {
    juntosSomosMaisFortes: "juntosSomosMaisfortesComment",
  };
  const setComment = (key: string, value: string) => {
    const commentKey = COMMENT_FIELD[key] ?? `${key}Comment`;
    setFormData((p) => ({ ...p, [commentKey]: value }));
  };

  const allKeys = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes", "qualidade", "contribuicao", "adaptacao", "usoDeIA"];
  const completion = allKeys.filter((k) => formData[k]).length;
  const isSubmitted = isSelfEval ? selfEval?.status === "submitted" : managerEval?.status === "submitted";

  const handleSave = (submit = false) => {
    if (!cycleId) return toast.error("Nenhum ciclo ativo.");
    const payload = {
      cycleId,
      ambicao: formData.ambicao as AxisValue,
      ambicaoComment: formData.ambicaoComment as string,
      sonharGrande: formData.sonharGrande as AxisValue,
      sonharGrandeComment: formData.sonharGrandeComment as string,
      accountability: formData.accountability as AxisValue,
      accountabilityComment: formData.accountabilityComment as string,
      juntosSomosMaisFortes: formData.juntosSomosMaisFortes as AxisValue,
      juntosSomosMaisfortesComment: formData.juntosSomosMaisfortesComment as string,
      qualidade: formData.qualidade as AxisValue,
      qualidadeComment: formData.qualidadeComment as string,
      contribuicao: formData.contribuicao as AxisValue,
      contribuicaoComment: formData.contribuicaoComment as string,
      adaptacao: formData.adaptacao as AxisValue,
      adaptacaoComment: formData.adaptacaoComment as string,
      usoDeIA: formData.usoDeIA as AxisValue,
      usoDeIAComment: formData.usoDeIAComment as string,
      feedbackGeral: formData.feedbackGeral as string,
      status: submit ? ("submitted" as const) : ("draft" as const),
    };

    if (isSelfEval) {
      saveSelf.mutate(payload);
    } else if (employeeId) {
      saveManager.mutate({ ...payload, employeeId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: "#8aa3c0" }}
      >
        <ArrowLeft size={16} />
        Voltar para os ciclos
      </button>

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
            {isSelfEval ? "Autoavaliação" : `Avaliando: ${employeeName}`}
          </p>
          <p className="text-xs" style={{ color: "#8aa3c0" }}>
            {isSelfEval ? "Sua avaliação sobre si mesmo" : "Avaliação do gestor sobre o liderado"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: "#d9f22a" }}>{completion}/8</p>
          <p className="text-xs" style={{ color: "#8aa3c0" }}>critérios preenchidos</p>
        </div>
      </div>

      {/* Phase gating banner */}
      {isPhaseBlocked && blockedPhase && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }}
        >
          <span style={{ color: "#f59e0b", fontSize: 20 }}>🔒</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
              Esta etapa ainda não está disponível
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
              A fase <strong style={{ color: "#fdffdf" }}>{blockedPhase.titulo}</strong> abre em{" "}
              <strong style={{ color: "#fdffdf" }}>
                {new Date(blockedPhase.startDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </strong>. Fique de olho!
            </p>
          </div>
        </div>
      )}

      {!isPhaseBlocked && (
        <>
          {isSubmitted && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: "#22c55e10", borderColor: "#22c55e30" }}
            >
              <CheckCircle size={18} style={{ color: "#22c55e" }} />
              <p className="text-sm" style={{ color: "#22c55e" }}>
                Esta avaliação já foi enviada. Você pode visualizar mas não editar.
              </p>
            </div>
          )}

          {/* Cultura */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 rounded-full" style={{ backgroundColor: "#1840eb" }} />
              <h3 className="font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Eixo de Cultura
              </h3>
              <span className="text-xs" style={{ color: "#8aa3c0" }}>Valores e comportamentos</span>
            </div>
            <div className="space-y-2">
              {POTENCIAL_CRITERIA.map((c) => (
                <CriterionCard
                  key={c.key}
                  criterion={c}
                  value={formData[c.key] as AxisValue}
                  comment={formData[`${c.key}Comment`] as string}
                  onChange={(v) => !isSubmitted && setField(c.key, v)}
                  onCommentChange={(v) => !isSubmitted && setComment(c.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Performance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 rounded-full" style={{ backgroundColor: "#d9f22a" }} />
              <h3 className="font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Eixo de Performance
              </h3>
              <span className="text-xs" style={{ color: "#8aa3c0" }}>Entregas e resultados</span>
            </div>
            <div className="space-y-2">
              {PERFORMANCE_CRITERIA.map((c) => (
                <CriterionCard
                  key={c.key}
                  criterion={c}
                  value={formData[c.key] as AxisValue}
                  comment={formData[`${c.key}Comment`] as string}
                  onChange={(v) => !isSubmitted && setField(c.key, v)}
                  onCommentChange={(v) => !isSubmitted && setComment(c.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Feedback Geral — apenas para gestor avaliando liderado */}
          {!isSelfEval && (
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: completion === 8 ? "#001830" : "#001023",
                borderColor: completion === 8 ? "#d9f22a40" : "#0a3060",
                opacity: completion === 8 ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 rounded-full" style={{ backgroundColor: "#d9f22a" }} />
                <h3 className="font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                  Feedback Geral
                </h3>
                {completion < 8 && (
                  <span className="text-xs" style={{ color: "#8aa3c0" }}>
                    Preencha todas as {8 - completion} dimensões restantes para habilitar
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Escreva um feedback geral consolidado sobre o desempenho e cultura deste colaborador no semestre. Este texto será exibido na devolutiva junto com as notas por dimensão..."
                value={(formData.feedbackGeral as string) ?? ""}
                onChange={(e) => !isSubmitted && completion === 8 && setFormData((p) => ({ ...p, feedbackGeral: e.target.value }))}
                rows={5}
                disabled={completion < 8 || isSubmitted}
                className="text-sm resize-none"
                style={{
                  backgroundColor: "#001023",
                  borderColor: completion === 8 ? "#d9f22a30" : "#0a3060",
                  color: "#fdffdf",
                }}
              />
            </div>
          )}

          {/* Actions */}
          {!isSubmitted && (
            <div className="flex gap-3 pb-6">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saveSelf.isPending || saveManager.isPending}
                className="flex items-center gap-2"
                style={{ borderColor: "#0a3060", color: "#fdffdf", backgroundColor: "transparent" }}
              >
                <Save size={16} />
                Salvar rascunho
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={completion < 8 || saveSelf.isPending || saveManager.isPending}
                className="flex items-center gap-2"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                <Send size={16} />
                Enviar avaliação
              </Button>
              {completion < 8 && (
                <p className="text-xs self-center" style={{ color: "#8aa3c0" }}>
                  Preencha todos os {8 - completion} critérios restantes para enviar.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── CYCLE CARD ───────────────────────────────────────────────────────────────

function CycleCard({
  cycle,
  isSelfView,
  isGestor,
  onOpenSelf,
  onOpenTeam,
}: {
  cycle: {
    cycleId: number;
    cycleName: string;
    cycleStatus: string;
    selfEvalStatus: string | null;
    selfEvalSubmittedAt: Date | string | null;
    teamEvals: { employeeId: number; employeeName: string; status: string | null; submittedAt: Date | string | null }[];
  };
  isSelfView: boolean;
  isGestor: boolean;
  onOpenSelf: (cycleId: number) => void;
  onOpenTeam: (cycleId: number, employeeId: number, employeeName: string) => void;
}) {
  const [expanded, setExpanded] = useState(cycle.cycleStatus === "open");

  const teamDone = cycle.teamEvals.filter((e) => e.status === "submitted").length;
  const teamTotal = cycle.teamEvals.length;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
    >
      {/* Cycle header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cycle.cycleStatus === "open" ? "#22c55e" : "#8aa3c0" }}
          />
          <div>
            <p className="font-semibold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
              {cycle.cycleName}
            </p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              {cycle.cycleStatus === "open" ? "Ciclo ativo" : "Ciclo encerrado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp size={16} style={{ color: "#8aa3c0" }} /> : <ChevronDown size={16} style={{ color: "#8aa3c0" }} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 space-y-3 pt-3" style={{ borderColor: "#0a3060" }}>
          {/* Self evaluation row */}
          {(isSelfView || !isGestor) && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#8aa3c0" }}>
                <User size={10} className="inline mr-1" />
                Autoavaliação
              </p>
              <button
                onClick={() => onOpenSelf(cycle.cycleId)}
                className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:border-opacity-60"
                style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}
              >
                <span className="text-sm font-medium" style={{ color: "#fdffdf" }}>
                  Minha autoavaliação
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={cycle.selfEvalStatus} />
                  <ChevronRight size={14} style={{ color: "#8aa3c0" }} />
                </div>
              </button>
            </div>
          )}

          {/* Team evaluations */}
          {!isSelfView && isGestor && cycle.teamEvals.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#8aa3c0" }}>
                <Users size={10} className="inline mr-1" />
                Avaliação dos Liderados — {teamDone}/{teamTotal} enviados
              </p>
              <div className="space-y-2">
                {cycle.teamEvals.map((emp) => (
                  <button
                    key={emp.employeeId}
                    onClick={() => onOpenTeam(cycle.cycleId, emp.employeeId, emp.employeeName)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all"
                    style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}
                  >
                    <div className="flex items-center gap-2">
                      <User size={14} style={{ color: "#8aa3c0" }} />
                      <span className="text-sm font-medium" style={{ color: "#fdffdf" }}>
                        {emp.employeeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={emp.status} />
                      <ChevronRight size={14} style={{ color: "#8aa3c0" }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSelfView && isGestor && cycle.teamEvals.length === 0 && (
            <p className="text-sm" style={{ color: "#8aa3c0" }}>
              Nenhum liderado direto encontrado. Configure no Painel RH.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Avaliacao() {
  const { viewMode, setViewMode, showTabs, isGestor } = useViewMode();
  const isSelfView = viewMode === "self";

  // Drill-down state: null = show cycle list, otherwise show form
  const [activeForm, setActiveForm] = useState<{
    cycleId: number;
    isSelfEval: boolean;
    employeeId?: number;
    employeeName?: string;
  } | null>(null);

  const { data: summary, isLoading } = trpc.cycles.evaluationSummary.useQuery();

  const handleOpenSelf = (cycleId: number) => {
    setActiveForm({ cycleId, isSelfEval: true });
  };

  const handleOpenTeam = (cycleId: number, employeeId: number, employeeName: string) => {
    setActiveForm({ cycleId, isSelfEval: false, employeeId, employeeName });
  };

  const handleBack = () => {
    setActiveForm(null);
  };

  // Reset active form when switching view mode
  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setActiveForm(null);
  };

  return (
    <StellarLayout title="Avaliação">
      <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6">
        {/* Role tabs */}
        <ViewModeTabs
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          showTabs={showTabs}
        />

        {/* Drill-down: evaluation form */}
        {activeForm ? (
          <EvaluationForm
            cycleId={activeForm.cycleId}
            isSelfEval={activeForm.isSelfEval}
            employeeId={activeForm.employeeId}
            employeeName={activeForm.employeeName}
            onBack={handleBack}
          />
        ) : (
          <>
            {/* Cycle list */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl animate-pulse"
                    style={{ backgroundColor: "#001830" }}
                  />
                ))}
              </div>
            )}

            {!isLoading && (!summary || summary.length === 0) && (
              <div
                className="p-8 rounded-xl border text-center"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
              >
                <p className="text-sm" style={{ color: "#8aa3c0" }}>
                  Nenhum ciclo de avaliação encontrado.
                </p>
              </div>
            )}

            {!isLoading && summary && summary.length > 0 && (
              <div className="space-y-3">
                {summary.map((cycle) => (
                  <CycleCard
                    key={cycle.cycleId}
                    cycle={cycle}
                    isSelfView={isSelfView}
                    isGestor={isGestor}
                    onOpenSelf={handleOpenSelf}
                    onOpenTeam={handleOpenTeam}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StellarLayout>
  );
}
