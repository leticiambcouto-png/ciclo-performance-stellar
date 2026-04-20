import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import StellarLayout from "@/components/StellarLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Target,
  TrendingUp,
  Eye,
  Zap,
  BarChart2,
  MessageSquare,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_LABEL: Record<string, string> = {
  below: "Abaixo",
  within: "Dentro",
  above: "Acima",
};
const RATING_COLOR: Record<string, string> = {
  below: "#ef4444",
  within: "#eab308",
  above: "#22c55e",
};
const RATING_BG: Record<string, string> = {
  below: "#ef444415",
  within: "#eab30815",
  above: "#22c55e15",
};

const VALOR_LABELS: Record<string, string> = {
  ambicao: "Ambição",
  sonharGrande: "Sonhar Grande",
  accountability: "Accountability",
  juntosSomosMaisFortes: "Juntos Somos Mais Fortes",
};
const PERF_LABELS: Record<string, string> = {
  qualidade: "Qualidade",
  contribuicao: "Contribuição",
  adaptacao: "Adaptação",
  usoDeIA: "Uso de IA",
};

function ratingScore(v: string | null | undefined): number {
  if (v === "above") return 3;
  if (v === "within") return 2;
  if (v === "below") return 1;
  return 0;
}

function getLowestValues(eval_: Record<string, string | null | undefined> | null | undefined): string[] {
  if (!eval_) return [];
  const valores = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];
  const scored = valores.map((v) => ({ key: v, score: ratingScore(eval_[v] as string) }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 2).map((s) => VALOR_LABELS[s.key] || s.key);
}

function metaAtingida(eval_: Record<string, string | null | undefined> | null | undefined): boolean {
  if (!eval_) return false;
  const perf = ["qualidade", "contribuicao", "adaptacao", "usoDeIA"];
  const scores = perf.map((p) => ratingScore(eval_[p] as string));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return avg >= 2;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | undefined }) {
  if (status === "submitted")
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Enviado
      </Badge>
    );
  if (status === "draft")
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
        <Clock className="w-3 h-3" /> Rascunho
      </Badge>
    );
  return (
    <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 gap-1">
      <AlertCircle className="w-3 h-3" /> Não iniciado
    </Badge>
  );
}

// ─── Eval Summary Panel ───────────────────────────────────────────────────────

function EvalSummaryPanel({
  managerEval,
}: {
  managerEval: Record<string, string | null | undefined> | null | undefined;
}) {
  if (!managerEval)
    return (
      <div
        className="rounded-xl p-4 text-sm"
        style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#8aa3c0" }}
      >
        Avaliação do gestor não encontrada para este ciclo.
      </div>
    );

  const valores = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];
  const perfs = ["qualidade", "contribuicao", "adaptacao", "usoDeIA"];
  const metaOk = metaAtingida(managerEval);

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8aa3c0" }}>
        Dados da Avaliação
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#7ba7ff" }}>
            Cultura (30%)
          </p>
          {valores.map((v) => {
            const val = managerEval[v] as string;
            return (
              <div key={v} className="flex justify-between items-center text-xs py-1">
                <span style={{ color: "#8aa3c0" }}>{VALOR_LABELS[v]}</span>
                {val ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: RATING_BG[val] || "#0a3060",
                      color: RATING_COLOR[val] || "#8aa3c0",
                    }}
                  >
                    {RATING_LABEL[val]}
                  </span>
                ) : (
                  <span style={{ color: "#4a6080" }}>—</span>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#d9f22a" }}>
            Performance (70%)
          </p>
          {perfs.map((p) => {
            const val = managerEval[p] as string;
            return (
              <div key={p} className="flex justify-between items-center text-xs py-1">
                <span style={{ color: "#8aa3c0" }}>{PERF_LABELS[p]}</span>
                {val ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: RATING_BG[val] || "#0a3060",
                      color: RATING_COLOR[val] || "#8aa3c0",
                    }}
                  >
                    {RATING_LABEL[val]}
                  </span>
                ) : (
                  <span style={{ color: "#4a6080" }}>—</span>
                )}
              </div>
            );
          })}
          <div
            className="flex justify-between items-center text-xs py-1 mt-1 pt-2"
            style={{ borderTop: "1px solid #0a3060" }}
          >
            <span className="font-semibold" style={{ color: "#fdffdf" }}>
              Meta atingida?
            </span>
            <span className="font-bold" style={{ color: metaOk ? "#22c55e" : "#ef4444" }}>
              {metaOk ? "✓ Sim" : "✗ Não"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Block ───────────────────────────────────────────────────────────

interface FeedbackBlockProps {
  icon: React.ReactNode;
  color: string;
  number: number;
  title: string;
  subtitle: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  aiSuggestion?: string;
  onApplySuggestion?: () => void;
  minLength?: number;
}

function FeedbackBlock({
  icon,
  color,
  number,
  title,
  subtitle,
  hint,
  value,
  onChange,
  disabled,
  aiSuggestion,
  onApplySuggestion,
  minLength,
}: FeedbackBlockProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const hasEdited = value.length > 0 && value !== aiSuggestion;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}30` }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: `${color}12`, borderBottom: `1px solid ${color}20` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}25`, color }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
              {number}. {title}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
            {subtitle}
          </p>
        </div>
        {hasEdited && !disabled && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
            Editado ✓
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3" style={{ backgroundColor: "#000d1a" }}>
        <p className="text-xs" style={{ color: "#4a6080" }}>
          {hint}
        </p>

        {/* AI Suggestion toggle */}
        {aiSuggestion && !disabled && (
          <div>
            <button
              onClick={() => setShowSuggestion((s) => !s)}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: "#d9f22a" }}
            >
              <Sparkles size={12} />
              {showSuggestion ? "Ocultar sugestão da Stella" : "Ver sugestão da Stella"}
            </button>
            {showSuggestion && (
              <div
                className="mt-2 p-3 rounded-lg text-xs leading-relaxed"
                style={{ backgroundColor: "#d9f22a08", border: "1px solid #d9f22a25", color: "#c8e820" }}
              >
                <p className="mb-2">{aiSuggestion}</p>
                <button
                  onClick={() => {
                    onApplySuggestion?.();
                    setShowSuggestion(false);
                  }}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: "#d9f22a20", color: "#d9f22a", border: "1px solid #d9f22a40" }}
                >
                  Usar como base (edite depois) <ArrowRight size={11} />
                </button>
              </div>
            )}
          </div>
        )}

        <Textarea
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Escreva aqui...`}
          rows={4}
          className="text-sm resize-none"
          style={{
            backgroundColor: "#001023",
            border: `1px solid ${value.length > 0 ? color + "40" : "#0a3060"}`,
            color: "#fdffdf",
          }}
        />
        {minLength && value.length > 0 && value.length < minLength && (
          <p className="text-xs" style={{ color: "#f97316" }}>
            Faltam {minLength - value.length} caracteres para o mínimo
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Feedback Form ────────────────────────────────────────────────────────────

interface FeedbackFormProps {
  cycleId: number;
  employee: { id: number; name: string; jobTitle?: string | null };
  managerEval: Record<string, string | null | undefined> | null | undefined;
  existing: Record<string, unknown> | null | undefined;
  quadrant?: string | null;
  onBack: () => void;
}

function FeedbackForm({ cycleId, employee, managerEval, existing, quadrant, onBack }: FeedbackFormProps) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const lowestValues = useMemo(() => getLowestValues(managerEval), [managerEval]);
  const metaOk = useMemo(() => metaAtingida(managerEval), [managerEval]);

  // Map existing data: new fields first, fallback to old field names
  const [form, setForm] = useState({
    resultadoEntrega: (existing?.entregasRelevantes as string) || "",
    comportamentoCultura: (existing?.valorConsistenteDesc as string) || "",
    pontoCego: (existing?.valorEvoluirComportamento as string) || "",
    proximos90Dias: (existing?.proximoCicloDiferente as string) || "",
    comentariosLider: "",
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    resultado_entrega?: string;
    comportamento_cultura?: string;
    ponto_cego?: string;
    proximos_90_dias?: string;
  } | null>(null);

  const generateMutation = trpc.feedback.generateWithStella.useMutation({
    onSuccess: (data) => {
      setAiSuggestions(data);
      toast.success("Stella gerou as sugestões! Revise e edite antes de enviar.");
    },
    onError: (e) => toast.error("Erro ao gerar sugestões: " + e.message),
  });

  const saveMutation = trpc.feedback.save.useMutation({
    onSuccess: () => {
      toast.success("Rascunho salvo");
      utils.feedback.listForManager.invalidate();
      utils.feedback.getForEmployee.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback enviado com sucesso!");
      utils.feedback.listForManager.invalidate();
      utils.feedback.getForEmployee.invalidate();
      onBack();
    },
    onError: (e) => toast.error(e.message),
  });

  const isSubmitted = existing?.status === "submitted";

  const handleGenerate = () => {
    generateMutation.mutate({
      employeeName: employee.name,
      jobTitle: employee.jobTitle ?? undefined,
      quadrant: quadrant ?? undefined,
      qualidade: managerEval?.qualidade as string | undefined,
      contribuicao: managerEval?.contribuicao as string | undefined,
      adaptacao: managerEval?.adaptacao as string | undefined,
      usoDeIA: managerEval?.usoDeIA as string | undefined,
      ambicao: managerEval?.ambicao as string | undefined,
      sonharGrande: managerEval?.sonharGrande as string | undefined,
      accountability: managerEval?.accountability as string | undefined,
      juntosSomosMaisFortes: managerEval?.juntosSomosMaisFortes as string | undefined,
      comentariosLider: form.comentariosLider || undefined,
    });
  };

  const handleSave = () => {
    saveMutation.mutate({
      cycleId,
      employeeId: employee.id,
      resultadoEntrega: form.resultadoEntrega,
      comportamentoCultura: form.comportamentoCultura,
      pontoCego: form.pontoCego,
      proximos90Dias: form.proximos90Dias,
      metaAtingidaAuto: metaOk,
      valorEvoluir: lowestValues[0] || "",
    });
  };

  const handleSubmit = () => {
    if (!form.resultadoEntrega.trim() || !form.comportamentoCultura.trim() || !form.pontoCego.trim() || !form.proximos90Dias.trim()) {
      toast.error("Preencha todos os 4 blocos antes de enviar.");
      return;
    }
    submitMutation.mutate({
      cycleId,
      employeeId: employee.id,
      resultadoEntrega: form.resultadoEntrega,
      comportamentoCultura: form.comportamentoCultura,
      pontoCego: form.pontoCego,
      proximos90Dias: form.proximos90Dias,
      metaAtingidaAuto: metaOk,
      valorEvoluir: lowestValues[0] || "",
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-white"
          style={{ color: "#8aa3c0" }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={{ color: "#fdffdf" }}>
            {employee.name}
          </h2>
          <p className="text-sm" style={{ color: "#8aa3c0" }}>
            {employee.jobTitle || "—"}
            {quadrant && (
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#d9f22a15", color: "#d9f22a", border: "1px solid #d9f22a30" }}
              >
                {quadrant}
              </span>
            )}
          </p>
        </div>
        {isSubmitted && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enviado</Badge>
        )}
      </div>

      {/* Eval Summary */}
      <EvalSummaryPanel managerEval={managerEval} />

      {/* Lowest values info */}
      {lowestValues.length > 0 && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl text-xs"
          style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}
        >
          <AlertCircle size={14} style={{ color: "#f97316", flexShrink: 0 }} />
          <span style={{ color: "#8aa3c0" }}>
            Valores com menor nota:{" "}
            {lowestValues.map((v, i) => (
              <span key={v}>
                <strong style={{ color: "#f97316" }}>{v}</strong>
                {i < lowestValues.length - 1 ? " e " : ""}
              </span>
            ))}
            {" — "}estes serão a base do PDI.
          </span>
        </div>
      )}

      {isSubmitted && (
        <div
          className="p-3 rounded-xl text-sm flex items-center gap-2"
          style={{ backgroundColor: "#22c55e10", border: "1px solid #22c55e30", color: "#22c55e" }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Feedback já enviado. Você pode visualizar mas não editar.
        </div>
      )}

      {/* Stella AI Generator */}
      {!isSubmitted && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ backgroundColor: "#001830", border: "1px solid #d9f22a30" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#d9f22a" }} />
            <p className="text-sm font-bold" style={{ color: "#d9f22a" }}>
              Gerar com Stella
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#d9f22a15", color: "#d9f22a", border: "1px solid #d9f22a30" }}
            >
              IA First
            </span>
          </div>
          <p className="text-xs" style={{ color: "#8aa3c0" }}>
            A Stella analisa as notas da avaliação, o quadrante no 9-Box e gera uma sugestão de feedback estruturado.
            Você deve revisar e editar antes de enviar — o feedback precisa ter a sua voz.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: "#8aa3c0" }}>
              Contexto adicional (opcional):
            </p>
            <textarea
              value={form.comentariosLider}
              onChange={(e) => setForm((f) => ({ ...f, comentariosLider: e.target.value }))}
              placeholder="Ex: passou por uma mudança de squad no meio do ciclo, liderou um projeto crítico, está em período de onboarding..."
              rows={2}
              className="w-full text-xs rounded-lg px-3 py-2 resize-none"
              style={{
                backgroundColor: "#001023",
                border: "1px solid #0a3060",
                color: "#fdffdf",
              }}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full font-bold"
            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? "Stella está pensando..." : "Gerar sugestão de feedback"}
          </Button>
          {aiSuggestions && (
            <p className="text-xs text-center" style={{ color: "#8aa3c0" }}>
              ✓ Sugestões geradas. Clique em "Ver sugestão da Stella" em cada bloco para aplicar.
            </p>
          )}
        </div>
      )}

      {/* Block 1: Resultado e Entrega */}
      <FeedbackBlock
        number={1}
        icon={<TrendingUp size={14} />}
        color="#d9f22a"
        title="Resultado e Entrega"
        subtitle="O que foi entregue e qual foi o impacto concreto"
        hint="Seja específico. Cite entregas, projetos ou resultados mensuráveis. Inclua também o que ficou abaixo do esperado — sem omitir."
        value={form.resultadoEntrega}
        onChange={(v) => setForm((f) => ({ ...f, resultadoEntrega: v }))}
        disabled={isSubmitted}
        aiSuggestion={aiSuggestions?.resultado_entrega}
        onApplySuggestion={() => setForm((f) => ({ ...f, resultadoEntrega: aiSuggestions?.resultado_entrega || f.resultadoEntrega }))}
      />

      {/* Block 2: Comportamento e Cultura */}
      <FeedbackBlock
        number={2}
        icon={<BarChart2 size={14} />}
        color="#7ba7ff"
        title="Comportamento e Cultura"
        subtitle="Valores demonstrados com consistência e o que precisa evoluir"
        hint="Cite comportamentos reais observados, não intenções. Qual valor essa pessoa viveu? Qual precisa desenvolver?"
        value={form.comportamentoCultura}
        onChange={(v) => setForm((f) => ({ ...f, comportamentoCultura: v }))}
        disabled={isSubmitted}
        aiSuggestion={aiSuggestions?.comportamento_cultura}
        onApplySuggestion={() => setForm((f) => ({ ...f, comportamentoCultura: aiSuggestions?.comportamento_cultura || f.comportamentoCultura }))}
      />

      {/* Block 3: Ponto Cego */}
      <FeedbackBlock
        number={3}
        icon={<Eye size={14} />}
        color="#f97316"
        title="Ponto Cego e Oportunidade"
        subtitle="O padrão limitante que essa pessoa provavelmente não vê"
        hint="Este é o bloco mais valioso do feedback. Seja honesto e direto, mas cuidadoso. Foque no padrão, não no evento isolado."
        value={form.pontoCego}
        onChange={(v) => setForm((f) => ({ ...f, pontoCego: v }))}
        disabled={isSubmitted}
        aiSuggestion={aiSuggestions?.ponto_cego}
        onApplySuggestion={() => setForm((f) => ({ ...f, pontoCego: aiSuggestions?.ponto_cego || f.pontoCego }))}
        minLength={100}
      />

      {/* Block 4: Próximos 90 dias */}
      <FeedbackBlock
        number={4}
        icon={<Zap size={14} />}
        color="#a855f7"
        title="Próximos 90 Dias"
        subtitle="O que essa pessoa precisa fazer diferente para crescer aqui"
        hint="Máximo 3 ações objetivas e mensuráveis. Evite genéricos como 'melhorar comunicação'. Seja específico: o quê, como e quando."
        value={form.proximos90Dias}
        onChange={(v) => setForm((f) => ({ ...f, proximos90Dias: v }))}
        disabled={isSubmitted}
        aiSuggestion={aiSuggestions?.proximos_90_dias}
        onApplySuggestion={() => setForm((f) => ({ ...f, proximos90Dias: aiSuggestions?.proximos_90_dias || f.proximos90Dias }))}
      />

      {/* PDI Link */}
      <div
        className="p-4 rounded-xl flex items-center justify-between gap-4"
        style={{ backgroundColor: "#001023", border: "1px solid #d9f22a30" }}
      >
        <div className="flex items-center gap-3">
          <Target size={18} style={{ color: "#d9f22a", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>
              Plano de Ação → PDI
            </p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              O plano de desenvolvimento é gerenciado no PDI com a metodologia 70/20/10.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/pdi")}
          className="flex-shrink-0 font-semibold"
          style={{ borderColor: "#d9f22a40", color: "#d9f22a", backgroundColor: "transparent" }}
        >
          Ir para PDI <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Actions */}
      {!isSubmitted && (
        <div className="flex gap-3 justify-end pb-6">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
            className="font-semibold"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Colaborador View ─────────────────────────────────────────────────────────

function ColaboradorFeedbackView({ cycleId }: { cycleId: number }) {
  const { data: myFeedback } = trpc.feedback.getMyFeedback.useQuery({ cycleId });
  const [, navigate] = useLocation();

  if (!myFeedback || myFeedback.status !== "submitted") {
    return (
      <div className="text-center py-16 space-y-3">
        <MessageSquare size={40} style={{ color: "#0a3060", margin: "0 auto" }} />
        <p className="font-semibold" style={{ color: "#fdffdf" }}>
          Feedback ainda não disponível
        </p>
        <p className="text-sm" style={{ color: "#8aa3c0" }}>
          Seu gestor ainda não enviou o feedback deste ciclo. Você será notificado quando estiver disponível.
        </p>
      </div>
    );
  }

  const blocks = [
    {
      icon: <TrendingUp size={14} />,
      color: "#d9f22a",
      title: "Resultado e Entrega",
      content: myFeedback.entregasRelevantes,
    },
    {
      icon: <BarChart2 size={14} />,
      color: "#7ba7ff",
      title: "Comportamento e Cultura",
      content: myFeedback.valorConsistenteDesc,
    },
    {
      icon: <Eye size={14} />,
      color: "#f97316",
      title: "Ponto Cego e Oportunidade",
      content: myFeedback.valorEvoluirComportamento,
    },
    {
      icon: <Zap size={14} />,
      color: "#a855f7",
      title: "Próximos 90 Dias",
      content: myFeedback.proximoCicloDiferente,
    },
  ];

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-xl flex items-center gap-2 text-sm"
        style={{ backgroundColor: "#22c55e10", border: "1px solid #22c55e30", color: "#22c55e" }}
      >
        <CheckCircle2 size={16} className="flex-shrink-0" />
        Feedback recebido do seu gestor
      </div>

      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${b.color}25` }}>
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: `${b.color}10`, borderBottom: `1px solid ${b.color}15` }}
          >
            <span style={{ color: b.color }}>{b.icon}</span>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: b.color }}>
              {i + 1}. {b.title}
            </p>
          </div>
          <div className="p-4" style={{ backgroundColor: "#000d1a" }}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#fdffdf" }}>
              {(b.content as string) || "—"}
            </p>
          </div>
        </div>
      ))}

      {/* PDI Link */}
      <div
        className="p-4 rounded-xl flex items-center justify-between gap-4"
        style={{ backgroundColor: "#001023", border: "1px solid #d9f22a30" }}
      >
        <div className="flex items-center gap-3">
          <Target size={18} style={{ color: "#d9f22a", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>
              Use este feedback para construir seu PDI
            </p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              Plano de desenvolvimento com metodologia 70/20/10
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/pdi")}
          className="flex-shrink-0 font-semibold"
          style={{ borderColor: "#d9f22a40", color: "#d9f22a", backgroundColor: "transparent" }}
        >
          Ver PDI <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Employee Row ─────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  employee: { id: number; name: string; jobTitle?: string | null };
  feedback: Record<string, unknown> | null | undefined;
  onSelect: () => void;
}

function EmployeeRow({ employee, feedback, onSelect }: EmployeeRowProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
      style={{
        backgroundColor: "#001023",
        border: "1px solid #0a3060",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1840eb60")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#0a3060")}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#0a3060" }}
      >
        <User className="w-4 h-4" style={{ color: "#8aa3c0" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "#fdffdf" }}>
          {employee.name}
        </p>
        <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>
          {employee.jobTitle || "—"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={feedback?.status as string | undefined} />
        <ChevronRight className="w-4 h-4" style={{ color: "#4a6080" }} />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedbackEstruturado() {
  const { user } = useStellarAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const { data: activeCycle } = trpc.cycles.active.useQuery();
  const { data: allCycles } = trpc.cycles.all.useQuery();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  const cycleId = selectedCycleId ?? activeCycle?.id ?? null;

  const { data: directReports } = trpc.employees.directReports.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: feedbackList } = trpc.feedback.listForManager.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  const selectedEmployee = directReports?.find((e) => e.id === selectedEmployeeId);

  const { data: managerEval } = trpc.managerEvaluation.getForEmployee.useQuery(
    { cycleId: cycleId!, employeeId: selectedEmployeeId! },
    { enabled: !!cycleId && !!selectedEmployeeId }
  );

  const { data: existingFeedback } = trpc.feedback.getForEmployee.useQuery(
    { cycleId: cycleId!, employeeId: selectedEmployeeId! },
    { enabled: !!cycleId && !!selectedEmployeeId }
  );

  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const secondaryRole = (user as any)?.secondaryPlatformRole ?? null;
  const isGestor =
    platformRole === "gestor" || platformRole === "rh" || secondaryRole === "gestor" || secondaryRole === "rh";

  const cycles = allCycles ?? [];

  return (
    <StellarLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#fdffdf" }}>
              <MessageSquare className="w-6 h-6" style={{ color: "#3b82f6" }} />
              Feedback
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8aa3c0" }}>
              {isGestor
                ? "Estruture feedbacks de alta qualidade com apoio da IA Stella"
                : "Feedback do seu gestor para este ciclo"}
            </p>
          </div>
          {cycles.length > 1 && (
            <select
              value={selectedCycleId ?? cycleId ?? ""}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="text-sm rounded-lg px-3 py-2"
              style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
            >
              {cycles.map((c) => (
                <option key={(c as { id: number }).id} value={(c as { id: number }).id}>
                  {(c as { name: string; status: string }).name}{" "}
                  {(c as { status: string }).status === "open" ? "(ativo)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {!cycleId ? (
          <div className="text-center py-12" style={{ color: "#8aa3c0" }}>
            Nenhum ciclo ativo encontrado. Configure um ciclo no Painel RH.
          </div>
        ) : isGestor ? (
          selectedEmployee ? (
            <FeedbackForm
              cycleId={cycleId}
              employee={selectedEmployee}
              managerEval={managerEval as Record<string, string | null | undefined> | null | undefined}
              existing={existingFeedback as Record<string, unknown> | null | undefined}
              quadrant={null}
              onBack={() => setSelectedEmployeeId(null)}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: "#8aa3c0" }}>
                Selecione um liderado para estruturar o feedback.
              </p>
              {!directReports || directReports.length === 0 ? (
                <div className="text-center py-8" style={{ color: "#4a6080" }}>
                  Nenhum liderado encontrado.
                </div>
              ) : (
                directReports.map((emp) => {
                  const fb = feedbackList?.find((f) => f.employeeId === emp.id);
                  return (
                    <EmployeeRow
                      key={emp.id}
                      employee={emp}
                      feedback={fb as Record<string, unknown> | null | undefined}
                      onSelect={() => setSelectedEmployeeId(emp.id)}
                    />
                  );
                })
              )}
            </div>
          )
        ) : (
          <ColaboradorFeedbackView cycleId={cycleId} />
        )}
      </div>
    </StellarLayout>
  );
}
