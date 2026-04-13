import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  BrainCircuit,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Streamdown } from "streamdown";
import {
  FLASH_FEEDBACK_NINEBOX_QUESTIONS,
  FLASH_FEEDBACK_ACTION_PLAN_FIELDS,
  NINEBOX_QUADRANTS,
  type AxisValue,
  type NineboxQuadrant,
} from "@shared/nineboxData";

const STATUS_CONFIG = {
  scheduled: { label: "Agendado", color: "#3b82f6", bg: "#3b82f615", icon: <Calendar size={14} /> },
  completed: { label: "Realizado", color: "#22c55e", bg: "#22c55e15", icon: <CheckCircle size={14} /> },
  overdue: { label: "Atrasado", color: "#ef4444", bg: "#ef444415", icon: <AlertTriangle size={14} /> },
  cancelled: { label: "Cancelado", color: "#8aa3c0", bg: "#8aa3c015", icon: <X size={14} /> },
};

const ALL_QUESTIONS = [
  ...FLASH_FEEDBACK_NINEBOX_QUESTIONS.cultura,
  ...FLASH_FEEDBACK_NINEBOX_QUESTIONS.performance,
];

type AnswerMap = Record<string, AxisValue>;

const LEVEL_OPTIONS: { value: AxisValue; label: string; desc: string }[] = [
  { value: "below", label: "Abaixo", desc: "Não atinge o esperado" },
  { value: "within", label: "Dentro", desc: "Atinge o esperado" },
  { value: "above", label: "Acima", desc: "Supera o esperado" },
];

const ZONE_CONFIG = {
  critical: { label: "Zona Crítica", color: "#ef4444" },
  maintainer: { label: "Mantenedor", color: "#3b82f6" },
  talent: { label: "Talento", color: "#d9f22a" },
};

export default function FlashFeedback() {
  const { user } = useStellarAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({ receiverId: 0, scheduledAt: "", agenda: "" });
  // Structured agenda fields
  const [agendaFields, setAgendaFields] = useState({
    oQueEstaFuncionando: "",
    gapPrioritario: "",
    compromisso: "",
    apoioGestor: "",
  });

  // Formalize state (multi-step for manager)
  const [showFormalize, setShowFormalize] = useState<number | null>(null);
  const [formalizeStep, setFormalizeStep] = useState<"questions" | "plan">("questions");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [aiPlan, setAiPlan] = useState<null | {
    quadrant: NineboxQuadrant;
    feeling: string;
    oQueEstaFuncionando: string;
    gapPrincipal: string;
    acaoConcreta: string;
    apoioGestor: string;
  }>(null);
  const [planFields, setPlanFields] = useState({
    oQueEstaFuncionando: "",
    gapPrincipal: "",
    acaoConcreta: "",
    apoioGestor: "",
  });
  const [feedbackContent, setFeedbackContent] = useState("");

  // Collaborator AI agenda state
  const [showAI, setShowAI] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [aiResult, setAiResult] = useState("");

  const [activeFilter, setActiveFilter] = useState<"all" | "scheduled" | "completed" | "overdue">("all");

  const utils = trpc.useUtils();
  const { data: cycle } = trpc.cycles.active.useQuery();
  const { data: employees } = trpc.employees.all.useQuery();
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const { data: directReports } = trpc.employees.directReports.useQuery(undefined, {
    enabled: platformRole === "gestor" || platformRole === "rh",
  });

  const { data: myFeedbacks } = trpc.flashFeedback.myFeedbacks.useQuery();
  const { data: teamFeedbacks } = trpc.flashFeedback.teamFeedbacks.useQuery(undefined, {
    enabled: platformRole === "gestor" || platformRole === "rh",
  });

  const feedbacks = platformRole === "colaborador" ? myFeedbacks : teamFeedbacks;
  const filteredFeedbacks = feedbacks?.filter((f) =>
    activeFilter === "all" ? true : f.status === activeFilter
  ) ?? [];

  const scheduleMutation = trpc.flashFeedback.schedule.useMutation({
    onSuccess: () => {
      toast.success("Flash feedback agendado!");
      setShowSchedule(false);
      setScheduleData({ receiverId: 0, scheduledAt: "", agenda: "" });
      setAgendaFields({ oQueEstaFuncionando: "", gapPrioritario: "", compromisso: "", apoioGestor: "" });
      utils.flashFeedback.myFeedbacks.invalidate();
      utils.flashFeedback.teamFeedbacks.invalidate();
    },
    onError: () => toast.error("Erro ao agendar. Tente novamente."),
  });

  const formalizeMutation = trpc.flashFeedback.formalize.useMutation({
    onSuccess: () => {
      toast.success("Feedback formalizado com sucesso!");
      resetFormalize();
      utils.flashFeedback.myFeedbacks.invalidate();
      utils.flashFeedback.teamFeedbacks.invalidate();
    },
    onError: () => toast.error("Erro ao formalizar. Tente novamente."),
  });

  const generatePlanMutation = trpc.ai.generateFlashFeedbackPlan.useMutation({
    onSuccess: (data) => {
      setAiPlan(data as any);
      setPlanFields({
        oQueEstaFuncionando: (data as any).oQueEstaFuncionando ?? "",
        gapPrincipal: (data as any).gapPrincipal ?? "",
        acaoConcreta: (data as any).acaoConcreta ?? "",
        apoioGestor: (data as any).apoioGestor ?? "",
      });
      setFormalizeStep("plan");
    },
    onError: () => toast.error("Erro ao gerar análise. Tente novamente."),
  });

  const generateAgenda = trpc.ai.generateAgenda.useMutation({
    onSuccess: (data) => setAiResult(typeof data === "string" ? data : ""),
    onError: () => toast.error("Erro ao gerar pauta. Tente novamente."),
  });

  const getEmployeeName = (id: number) => employees?.find((e) => e.id === id)?.name ?? "Colaborador";

  const counts = {
    all: feedbacks?.length ?? 0,
    scheduled: feedbacks?.filter((f) => f.status === "scheduled").length ?? 0,
    completed: feedbacks?.filter((f) => f.status === "completed").length ?? 0,
    overdue: feedbacks?.filter((f) => f.status === "overdue").length ?? 0,
  };

  const resetFormalize = () => {
    setShowFormalize(null);
    setFormalizeStep("questions");
    setCurrentQuestion(0);
    setAnswers({});
    setAiPlan(null);
    setPlanFields({ oQueEstaFuncionando: "", gapPrincipal: "", acaoConcreta: "", apoioGestor: "" });
    setFeedbackContent("");
  };

  const allAnswered = ALL_QUESTIONS.every((q) => answers[q.key]);
  const currentQ = ALL_QUESTIONS[currentQuestion];

  const formalizeTarget = useMemo(() => {
    if (!showFormalize) return null;
    return feedbacks?.find((f) => f.id === showFormalize) ?? null;
  }, [showFormalize, feedbacks]);

  const targetName = formalizeTarget ? getEmployeeName(formalizeTarget.receiverId) : "";

  const handleAnalyzeWithAI = () => {
    if (!allAnswered) return toast.error("Responda todas as perguntas antes de continuar.");
    generatePlanMutation.mutate({
      employeeName: targetName,
      answers: {
        ambicao: answers.ambicao as AxisValue,
        sonharGrande: answers.sonharGrande as AxisValue,
        accountability: answers.accountability as AxisValue,
        juntosSomosMaisFortes: answers.juntosSomosMaisFortes as AxisValue,
        qualidade: answers.qualidade as AxisValue,
        contribuicao: answers.contribuicao as AxisValue,
        adaptacao: answers.adaptacao as AxisValue,
        usoDeIA: answers.usoDeIA as AxisValue,
      },
    });
  };

  const handleFinalize = () => {
    const actionPlanText = FLASH_FEEDBACK_ACTION_PLAN_FIELDS.map(
      (f) => `**${f.titulo}**\n${planFields[f.key as keyof typeof planFields]}`
    ).join("\n\n");

    formalizeMutation.mutate({
      id: showFormalize!,
      feedbackContent: feedbackContent || `Feedback estruturado com base na avaliação 9-Box. Posicionamento: ${aiPlan?.quadrant ?? ""}`,
      actionPlan: actionPlanText,
    });
  };

  return (
    <StellarLayout title="Flash Feedbacks">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl">
        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "scheduled", "completed", "overdue"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                style={{
                  backgroundColor: activeFilter === filter ? "#d9f22a15" : "#001830",
                  borderColor: activeFilter === filter ? "#d9f22a40" : "#0a3060",
                  color: activeFilter === filter ? "#d9f22a" : "#8aa3c0",
                }}
              >
                {filter === "all" ? "Todos" : STATUS_CONFIG[filter].label}
                {counts[filter] > 0 && <span className="ml-1.5 font-bold">{counts[filter]}</span>}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {platformRole === "colaborador" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAI(true)}
                className="flex items-center gap-2"
                style={{ borderColor: "#1840eb40", color: "#7ba7ff", backgroundColor: "transparent" }}
              >
                <BrainCircuit size={14} />
                Preparar pauta com IA
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-2"
              style={{ backgroundColor: "#d9f22a", color: "#001023" }}
            >
              <Plus size={14} />
              Agendar
            </Button>
          </div>
        </div>

        {/* Stats for manager */}
        {(platformRole === "gestor" || platformRole === "rh") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Agendados", count: counts.scheduled, color: "#3b82f6" },
              { label: "Realizados", count: counts.completed, color: "#22c55e" },
              { label: "Atrasados", count: counts.overdue, color: "#ef4444" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border text-center"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
              >
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.count}</p>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Feedback list */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
          {filteredFeedbacks.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Zap size={40} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
              <p className="font-semibold mb-1" style={{ color: "#fdffdf" }}>Nenhum flash feedback encontrado</p>
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                {platformRole === "colaborador"
                  ? "Agende um flash feedback com seu gestor para começar."
                  : "Nenhum feedback agendado ainda."}
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((fb, i) => {
              const status = STATUS_CONFIG[fb.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
              const canFormalize = (platformRole === "gestor" || platformRole === "rh") && fb.status === "scheduled";

              return (
                <div
                  key={fb.id}
                  className="p-4"
                  style={{ borderBottom: i < filteredFeedbacks.length - 1 ? "1px solid #0a3060" : "none" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${status.color}15`, color: status.color }}
                      >
                        {status.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
                            {getEmployeeName(fb.requesterId)} para {getEmployeeName(fb.receiverId)}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full border"
                            style={{ backgroundColor: status.bg, borderColor: `${status.color}30`, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
                          {format(new Date(fb.scheduledAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {fb.agenda && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: "#8aa3c0" }}>
                            Pauta: {fb.agenda}
                          </p>
                        )}
                        {fb.feedbackContent && (
                          <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: "#001023", color: "#8aa3c0" }}>
                            <p className="font-semibold mb-0.5" style={{ color: "#fdffdf" }}>Feedback formalizado:</p>
                            <p className="line-clamp-2">{fb.feedbackContent}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {canFormalize && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowFormalize(fb.id);
                          setFormalizeStep("questions");
                          setCurrentQuestion(0);
                          setAnswers({});
                          setAiPlan(null);
                        }}
                        className="flex-shrink-0 flex items-center gap-1"
                        style={{ borderColor: "#d9f22a40", color: "#d9f22a", backgroundColor: "transparent" }}
                      >
                        <MessageSquare size={12} />
                        Formalizar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── SCHEDULE DIALOG ── */}
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Agendar Flash Feedback
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  {platformRole === "colaborador" ? "Gestor" : "Liderado"}
                </label>
                <select
                  value={scheduleData.receiverId}
                  onChange={(e) => setScheduleData((p) => ({ ...p, receiverId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                >
                  <option value={0}>Selecionar...</option>
                  {(platformRole === "colaborador" ? employees : directReports)?.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={scheduleData.scheduledAt}
                  onChange={(e) => setScheduleData((p) => ({ ...p, scheduledAt: e.target.value }))}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              {/* Structured agenda fields */}
              <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} style={{ color: "#d9f22a" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d9f22a" }}>Pauta do Flash Feedback</p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                    O que está funcionando e precisa continuar? <span style={{ color: "#4a6080" }}>(5 min)</span>
                  </label>
                  <Textarea
                    placeholder="Descreva os pontos positivos que devem ser mantidos..."
                    value={agendaFields.oQueEstaFuncionando}
                    onChange={(e) => setAgendaFields((p) => ({ ...p, oQueEstaFuncionando: e.target.value }))}
                    rows={2}
                    style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                    Qual é o gap prioritário do próximo trimestre? <span style={{ color: "#4a6080" }}>(10 min)</span>
                  </label>
                  <Textarea
                    placeholder="Identifique o principal gap a ser trabalhado..."
                    value={agendaFields.gapPrioritario}
                    onChange={(e) => setAgendaFields((p) => ({ ...p, gapPrioritario: e.target.value }))}
                    rows={2}
                    style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                    Qual compromisso concreto a pessoa assume? <span style={{ color: "#4a6080" }}>(10 min)</span>
                  </label>
                  <Textarea
                    placeholder="Descreva o compromisso específico que será assumido..."
                    value={agendaFields.compromisso}
                    onChange={(e) => setAgendaFields((p) => ({ ...p, compromisso: e.target.value }))}
                    rows={2}
                    style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                    O que o gestor vai fazer para viabilizar? <span style={{ color: "#4a6080" }}>(5 min)</span>
                  </label>
                  <Textarea
                    placeholder="Descreva o suporte que o gestor vai oferecer..."
                    value={agendaFields.apoioGestor}
                    onChange={(e) => setAgendaFields((p) => ({ ...p, apoioGestor: e.target.value }))}
                    rows={2}
                    style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!scheduleData.receiverId || !scheduleData.scheduledAt)
                    return toast.error("Preencha todos os campos obrigatórios.");
                  // Build structured agenda string
                  const structuredAgenda = [
                    agendaFields.oQueEstaFuncionando ? `O que está funcionando: ${agendaFields.oQueEstaFuncionando}` : "",
                    agendaFields.gapPrioritario ? `Gap prioritário: ${agendaFields.gapPrioritario}` : "",
                    agendaFields.compromisso ? `Compromisso: ${agendaFields.compromisso}` : "",
                    agendaFields.apoioGestor ? `Apoio do gestor: ${agendaFields.apoioGestor}` : "",
                  ].filter(Boolean).join("\n\n");
                  scheduleMutation.mutate({
                    receiverId: scheduleData.receiverId,
                    scheduledAt: new Date(scheduleData.scheduledAt).toISOString(),
                    agenda: structuredAgenda || undefined,
                    cycleId: cycle?.id,
                  });
                }}
                disabled={scheduleMutation.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {scheduleMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Confirmar agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── FORMALIZE DIALOG (multi-step for manager) ── */}
        <Dialog open={showFormalize !== null} onOpenChange={resetFormalize}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                <MessageSquare size={18} style={{ color: "#d9f22a" }} />
                Formalizar Flash Feedback
                {targetName && <span className="text-sm font-normal" style={{ color: "#8aa3c0" }}>com {targetName}</span>}
              </DialogTitle>
            </DialogHeader>

            {formalizeStep === "questions" && (
              <div className="space-y-5 mt-2">
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#0a3060" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: "#d9f22a",
                        width: `${((currentQuestion + 1) / ALL_QUESTIONS.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#8aa3c0" }}>
                    {currentQuestion + 1} / {ALL_QUESTIONS.length}
                  </span>
                </div>

                {/* Axis badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                    style={
                      currentQ.eixo === "cultura"
                        ? { backgroundColor: "#1840eb15", borderColor: "#1840eb40", color: "#7ba7ff" }
                        : { backgroundColor: "#d9f22a15", borderColor: "#d9f22a40", color: "#d9f22a" }
                    }
                  >
                    {currentQ.eixo === "cultura" ? "Cultura" : "Performance"}: {currentQ.criterio}
                  </span>
                </div>

                {/* Question */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#001023" }}>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: "#fdffdf" }}>
                    {currentQ.pergunta}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.key]: opt.value }))}
                      className="w-full p-3 rounded-xl border text-left transition-all"
                      style={{
                        backgroundColor: answers[currentQ.key] === opt.value ? "#d9f22a10" : "#001023",
                        borderColor: answers[currentQ.key] === opt.value ? "#d9f22a60" : "#0a3060",
                        color: "#fdffdf",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                          style={{
                            borderColor: answers[currentQ.key] === opt.value ? "#d9f22a" : "#0a3060",
                            backgroundColor: answers[currentQ.key] === opt.value ? "#d9f22a" : "transparent",
                          }}
                        >
                          {answers[currentQ.key] === opt.value && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#001023" }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: answers[currentQ.key] === opt.value ? "#d9f22a" : "#fdffdf" }}>
                            {opt.label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
                            {currentQ[opt.value as keyof typeof currentQ] as string}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-1"
                    style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </Button>

                  {currentQuestion < ALL_QUESTIONS.length - 1 ? (
                    <Button
                      onClick={() => {
                        if (!answers[currentQ.key]) return toast.error("Selecione uma opção antes de continuar.");
                        setCurrentQuestion((p) => p + 1);
                      }}
                      className="flex-1 flex items-center justify-center gap-1"
                      style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                    >
                      Próxima
                      <ChevronRight size={14} />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAnalyzeWithAI}
                      disabled={!allAnswered || generatePlanMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                    >
                      {generatePlanMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      {generatePlanMutation.isPending ? "Analisando com IA..." : "Analisar com IA"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {formalizeStep === "plan" && aiPlan && (
              <div className="space-y-5 mt-2">
                {/* Quadrant result */}
                {(() => {
                  const qInfo = NINEBOX_QUADRANTS[aiPlan.quadrant];
                  const zoneConf = ZONE_CONFIG[qInfo.zone];
                  return (
                    <div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "#001023", borderColor: `${qInfo.color}40` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
                          style={{ backgroundColor: `${qInfo.color}20`, color: qInfo.color, border: `2px solid ${qInfo.color}40` }}
                        >
                          {aiPlan.quadrant}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: "#fdffdf" }}>{qInfo.name}</p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: `${zoneConf.color}15`, color: zoneConf.color }}
                          >
                            {zoneConf.label}
                          </span>
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-lg border-l-2 text-sm"
                        style={{ backgroundColor: "#001830", borderLeftColor: "#d9f22a", color: "#fdffdf" }}
                      >
                        <p className="font-semibold text-xs mb-1" style={{ color: "#d9f22a" }}>
                          <Sparkles size={12} className="inline mr-1" />
                          Feeling para o colaborador
                        </p>
                        <p className="leading-relaxed">{aiPlan.feeling}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 4 action plan fields */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
                    Plano de Ação do Flash Feedback
                  </p>
                  {FLASH_FEEDBACK_ACTION_PLAN_FIELDS.map((field) => {
                    const fieldKey = field.key as keyof typeof planFields;
                    return (
                      <div key={field.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold" style={{ color: "#8aa3c0" }}>
                            {field.titulo}
                          </label>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#1840eb15", color: "#7ba7ff" }}
                          >
                            <Clock size={10} className="inline mr-1" />
                            {field.tempo}
                          </span>
                        </div>
                        <Textarea
                          placeholder={field.placeholder}
                          value={planFields[fieldKey]}
                          onChange={(e) => setPlanFields((p) => ({ ...p, [fieldKey]: e.target.value }))}
                          rows={3}
                          style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                        />
                        {(aiPlan as any)[fieldKey] && planFields[fieldKey] === (aiPlan as any)[fieldKey] && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#d9f22a80" }}>
                            <Sparkles size={10} />
                            Sugestão da IA. Edite conforme necessário.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Optional free-text feedback */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                    Observações adicionais (opcional)
                  </label>
                  <Textarea
                    placeholder="Adicione qualquer contexto extra que queira registrar..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    rows={2}
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setFormalizeStep("questions")}
                    className="flex items-center gap-1"
                    style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
                  >
                    <ChevronLeft size={14} />
                    Rever respostas
                  </Button>
                  <Button
                    onClick={handleFinalize}
                    disabled={formalizeMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                  >
                    {formalizeMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {formalizeMutation.isPending ? "Salvando..." : "Formalizar feedback"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── AI AGENDA DIALOG (collaborator) ── */}
        <Dialog open={showAI} onOpenChange={setShowAI}>
          <DialogContent
            className="max-w-lg"
            style={{ backgroundColor: "#001830", border: "1px solid #1840eb40", color: "#fdffdf" }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                <BrainCircuit size={18} style={{ color: "#d9f22a" }} />
                Preparar Pauta com IA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                Conte o que você quer abordar no flash feedback e a Stella vai estruturar uma pauta objetiva pra você.
              </p>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  O que você quer abordar?
                </label>
                <Textarea
                  placeholder="Ex: Quero falar sobre minha evolução no projeto X, pedir feedback sobre minha comunicação e entender o que preciso fazer para crescer..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  rows={4}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <Button
                onClick={() => {
                  if (!aiContext.trim()) return toast.error("Descreva o contexto primeiro.");
                  generateAgenda.mutate({ context: aiContext });
                }}
                disabled={generateAgenda.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {generateAgenda.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <BrainCircuit size={16} className="mr-2" />
                )}
                Gerar pauta
              </Button>

              {aiResult && (
                <div
                  className="p-4 rounded-xl border max-h-64 overflow-y-auto"
                  style={{ backgroundColor: "#001023", borderColor: "#d9f22a30" }}
                >
                  <div style={{ color: "#fdffdf" }} className="text-sm">
                    <Streamdown>{aiResult}</Streamdown>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StellarLayout>
  );
}
