import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  BrainCircuit,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Streamdown } from "streamdown";

const STATUS_CONFIG = {
  scheduled: { label: "Agendado", color: "#3b82f6", bg: "#3b82f615", icon: <Calendar size={14} /> },
  completed: { label: "Realizado", color: "#22c55e", bg: "#22c55e15", icon: <CheckCircle size={14} /> },
  overdue: { label: "Atrasado", color: "#ef4444", bg: "#ef444415", icon: <AlertTriangle size={14} /> },
  cancelled: { label: "Cancelado", color: "#8aa3c0", bg: "#8aa3c015", icon: <X size={14} /> },
};

export default function FlashFeedback() {
  const { user } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [showSchedule, setShowSchedule] = useState(false);
  const [showFormalize, setShowFormalize] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [scheduleData, setScheduleData] = useState({ receiverId: 0, scheduledAt: "", agenda: "" });
  const [formalizeData, setFormalizeData] = useState({ feedbackContent: "", actionPlan: "" });
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
      utils.flashFeedback.myFeedbacks.invalidate();
      utils.flashFeedback.teamFeedbacks.invalidate();
    },
    onError: () => toast.error("Erro ao agendar. Tente novamente."),
  });

  const formalizeMutation = trpc.flashFeedback.formalize.useMutation({
    onSuccess: () => {
      toast.success("Feedback formalizado!");
      setShowFormalize(null);
      setFormalizeData({ feedbackContent: "", actionPlan: "" });
      utils.flashFeedback.myFeedbacks.invalidate();
      utils.flashFeedback.teamFeedbacks.invalidate();
    },
    onError: () => toast.error("Erro ao formalizar. Tente novamente."),
  });

  const generateAgenda = trpc.ai.generateAgenda.useMutation({
    onSuccess: (data) => setAiResult(typeof data === 'string' ? data : ''),
    onError: () => toast.error("Erro ao gerar pauta. Tente novamente."),
  });

  const getEmployeeName = (id: number) => employees?.find((e) => e.id === id)?.name ?? "—";

  const counts = {
    all: feedbacks?.length ?? 0,
    scheduled: feedbacks?.filter((f) => f.status === "scheduled").length ?? 0,
    completed: feedbacks?.filter((f) => f.status === "completed").length ?? 0,
    overdue: feedbacks?.filter((f) => f.status === "overdue").length ?? 0,
  };

  return (
    <StellarLayout title="Flash Feedbacks">
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
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
                {counts[filter] > 0 && (
                  <span className="ml-1.5 font-bold">{counts[filter]}</span>
                )}
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
          <div className="grid grid-cols-3 gap-3">
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
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          {filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <Zap size={40} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
              <p className="font-semibold mb-1" style={{ color: "#fdffdf" }}>
                Nenhum flash feedback encontrado
              </p>
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                {platformRole === "colaborador"
                  ? "Agende um flash feedback com seu gestor para começar."
                  : "Nenhum feedback agendado ainda."}
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((fb, i) => {
              const status = STATUS_CONFIG[fb.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
              const isManager = myProfile && (fb.requesterId === myProfile.id || platformRole === "gestor" || platformRole === "rh");
              const canFormalize = (platformRole === "gestor" || platformRole === "rh") && fb.status === "scheduled";

              return (
                <div
                  key={fb.id}
                  className="p-4"
                  style={{
                    borderBottom: i < filteredFeedbacks.length - 1 ? "1px solid #0a3060" : "none",
                  }}
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
                            {getEmployeeName(fb.requesterId)} → {getEmployeeName(fb.receiverId)}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: status.bg,
                              borderColor: `${status.color}30`,
                              color: status.color,
                            }}
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
                          <div
                            className="mt-2 p-2 rounded-lg text-xs"
                            style={{ backgroundColor: "#001023", color: "#8aa3c0" }}
                          >
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
                          setFormalizeData({ feedbackContent: fb.feedbackContent ?? "", actionPlan: fb.actionPlan ?? "" });
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

        {/* Schedule Dialog */}
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
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Data e Hora
                </label>
                <Input
                  type="datetime-local"
                  value={scheduleData.scheduledAt}
                  onChange={(e) => setScheduleData((p) => ({ ...p, scheduledAt: e.target.value }))}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Pauta (opcional)
                </label>
                <Textarea
                  placeholder="Descreva os pontos que quer abordar..."
                  value={scheduleData.agenda}
                  onChange={(e) => setScheduleData((p) => ({ ...p, agenda: e.target.value }))}
                  rows={3}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <Button
                onClick={() => {
                  if (!scheduleData.receiverId || !scheduleData.scheduledAt) {
                    return toast.error("Preencha todos os campos obrigatórios.");
                  }
                  scheduleMutation.mutate({
                    receiverId: scheduleData.receiverId,
                    scheduledAt: new Date(scheduleData.scheduledAt).toISOString(),
                    agenda: scheduleData.agenda || undefined,
                    cycleId: cycle?.id,
                  });
                }}
                disabled={scheduleMutation.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {scheduleMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Confirmar agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Formalize Dialog */}
        <Dialog open={showFormalize !== null} onOpenChange={() => setShowFormalize(null)}>
          <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Formalizar Feedback
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Conteúdo do Feedback *
                </label>
                <Textarea
                  placeholder="Descreva o feedback dado..."
                  value={formalizeData.feedbackContent}
                  onChange={(e) => setFormalizeData((p) => ({ ...p, feedbackContent: e.target.value }))}
                  rows={4}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Plano de Ação (opcional)
                </label>
                <Textarea
                  placeholder="Ações acordadas..."
                  value={formalizeData.actionPlan}
                  onChange={(e) => setFormalizeData((p) => ({ ...p, actionPlan: e.target.value }))}
                  rows={3}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <Button
                onClick={() => {
                  if (!formalizeData.feedbackContent) return toast.error("Preencha o conteúdo do feedback.");
                  formalizeMutation.mutate({
                    id: showFormalize!,
                    feedbackContent: formalizeData.feedbackContent,
                    actionPlan: formalizeData.actionPlan || undefined,
                  });
                }}
                disabled={formalizeMutation.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {formalizeMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Formalizar feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Agenda Dialog */}
        <Dialog open={showAI} onOpenChange={setShowAI}>
          <DialogContent
            className="max-w-lg"
            style={{ backgroundColor: "#001830", border: "1px solid #1840eb40", color: "#fdffdf" }}
          >
            <DialogHeader>
              <DialogTitle
                className="flex items-center gap-2"
                style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}
              >
                <BrainCircuit size={18} style={{ color: "#d9f22a" }} />
                Preparar Pauta com IA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  O que você quer abordar no feedback?
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
                {generateAgenda.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <BrainCircuit size={16} className="mr-2" />}
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
