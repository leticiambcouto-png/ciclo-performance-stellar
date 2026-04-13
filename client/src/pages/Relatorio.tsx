import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import { BrainCircuit, CheckCircle, FileText, Loader2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";
import { NINEBOX_QUADRANTS } from "../../../shared/nineboxData";
import type { NineboxQuadrant } from "../../../shared/nineboxData";

export default function Relatorio() {
  const { user } = useStellarAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const [finalContent, setFinalContent] = useState("");
  const [finalActionPlan, setFinalActionPlan] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const utils = trpc.useUtils();
  const { data: cycle } = trpc.cycles.active.useQuery();
  const cycleId = cycle?.id ?? 0;

  // Phase gating: devolutiva = phase 6 (Gestão de Consequências)
  const { data: cyclePhasesList } = trpc.cyclePhases.list.useQuery(
    { cycleId },
    { enabled: cycleId > 0 }
  );
  const devolutivaPhase = cyclePhasesList?.find((p) => p.phaseNumber === 6);
  const isDevolutivaBlocked =
    platformRole === "colaborador" &&
    devolutivaPhase &&
    new Date() < new Date(devolutivaPhase.startDate);
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const { data: directReports } = trpc.employees.directReports.useQuery(undefined, {
    enabled: platformRole !== "colaborador",
  });
  const { data: employees } = trpc.employees.all.useQuery();

  // Colaborador: my report
  const { data: myReport } = trpc.feedbackReport.myReport.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole === "colaborador" }
  );
  const { data: myNineboxPos } = trpc.ninebox.myPosition.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole === "colaborador" }
  );
  // Avaliação do gestor sobre o colaborador (para exibir notas por dimensão na devolutiva)
  const { data: myManagerEval } = trpc.managerEvaluation.myEval.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole === "colaborador" }
  );

  // Gestor: team reports
  const { data: teamReports } = trpc.feedbackReport.teamReports.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole !== "colaborador" }
  );
  const { data: managerEval } = trpc.managerEvaluation.getForEmployee.useQuery(
    { employeeId: selectedEmployee ?? 0, cycleId },
    { enabled: cycleId > 0 && selectedEmployee !== null && platformRole !== "colaborador" }
  );

  const saveDraft = trpc.feedbackReport.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Rascunho salvo!");
      utils.feedbackReport.teamReports.invalidate();
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const sendReport = trpc.feedbackReport.send.useMutation({
    onSuccess: () => {
      toast.success("Devolutiva enviada para o colaborador!");
      utils.feedbackReport.teamReports.invalidate();
    },
    onError: () => toast.error("Erro ao enviar."),
  });

  const generateFeedback = trpc.ai.generateFeedback.useMutation({
    onSuccess: (data) => {
      const text = typeof data === 'string' ? data : '';
      setAiContent(text);
      setFinalContent(text);
    },
    onError: () => toast.error("Erro ao gerar feedback com IA."),
  });

  const handleGenerateAI = () => {
    if (!managerEval || !selectedEmployee) return;
    const emp = employees?.find((e) => e.id === selectedEmployee);
    generateFeedback.mutate({
      employeeName: emp?.name ?? "Colaborador",
      evaluation: {
        ambicao: managerEval.ambicao ?? undefined,
        ambicaoComment: managerEval.ambicaoComment ?? undefined,
        sonharGrande: managerEval.sonharGrande ?? undefined,
        sonharGrandeComment: managerEval.sonharGrandeComment ?? undefined,
        accountability: managerEval.accountability ?? undefined,
        accountabilityComment: managerEval.accountabilityComment ?? undefined,
        juntosSomosMaisFortes: managerEval.juntosSomosMaisFortes ?? undefined,
        juntosSomosMaisfortesComment: managerEval.juntosSomosMaisfortesComment ?? undefined,
        qualidade: managerEval.qualidade ?? undefined,
        qualidadeComment: managerEval.qualidadeComment ?? undefined,
        contribuicao: managerEval.contribuicao ?? undefined,
        contribuicaoComment: managerEval.contribuicaoComment ?? undefined,
        adaptacao: managerEval.adaptacao ?? undefined,
        adaptacaoComment: managerEval.adaptacaoComment ?? undefined,
        usoDeIA: managerEval.usoDeIA ?? undefined,
        usoDeIAComment: managerEval.usoDeIAComment ?? undefined,
      },
      quadrant: managerEval.nineboxQuadrant ?? "Q5",
    });
  };

  const existingReport = selectedEmployee
    ? teamReports?.find((r) => r.employeeId === selectedEmployee)
    : null;

  // Colaborador view
  if (platformRole === "colaborador") {
    const qInfo = myNineboxPos?.quadrant
      ? NINEBOX_QUADRANTS[myNineboxPos.quadrant as NineboxQuadrant]
      : null;

    const AXIS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
      below: { label: "Abaixo do esperado", color: "#ef4444", bg: "#ef444415" },
      within: { label: "Dentro do esperado", color: "#f59e0b", bg: "#f59e0b15" },
      above: { label: "Acima do esperado", color: "#22c55e", bg: "#22c55e15" },
    };

    const DIMENSIONS = [
      { key: "ambicao", label: "Ambição", axis: "Cultura" },
      { key: "sonharGrande", label: "Sonhar Grande", axis: "Cultura" },
      { key: "accountability", label: "Accountability", axis: "Cultura" },
      { key: "juntosSomosMaisFortes", label: "Juntos Somos Mais Fortes", axis: "Cultura" },
      { key: "qualidade", label: "Qualidade e Consistência", axis: "Performance" },
      { key: "contribuicao", label: "Contribuição para o Negócio", axis: "Performance" },
      { key: "adaptacao", label: "Adaptação e Velocidade", axis: "Performance" },
      { key: "usoDeIA", label: "Uso de IA e Automação", axis: "Performance" },
    ];

    const devolutivaReady = myReport && myReport.status !== "draft";

    return (
      <StellarLayout title="Minha Devolutiva">
        <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-6">
          {/* Phase gating banner */}
          {isDevolutivaBlocked && devolutivaPhase && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }}
            >
              <span style={{ color: "#f59e0b", fontSize: 20 }}>&#128274;</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                  Devolutiva ainda não disponível
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
                  Sua devolutiva será liberada a partir de{" "}
                  <strong style={{ color: "#fdffdf" }}>
                    {new Date(devolutivaPhase.startDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>. Fique de olho!
                </p>
              </div>
            </div>
          )}

          {!isDevolutivaBlocked && !devolutivaReady ? (
            <div
              className="p-8 sm:p-12 rounded-xl border text-center"
              style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
            >
              <FileText size={48} className="mx-auto mb-4" style={{ color: "#0a3060" }} />
              <h3 className="font-bold text-lg mb-2" style={{ color: "#fdffdf" }}>
                Devolutiva ainda não disponível
              </h3>
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                Seu gestor ainda não enviou o resultado da sua avaliação. Você será notificado quando estiver disponível.
              </p>
            </div>
          ) : devolutivaReady ? (
            <>
              {/* Status header */}
              <div
                className="p-5 rounded-xl border"
                style={{ backgroundColor: "#001830", borderColor: "#d9f22a30" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                    Devolutiva disponível
                  </p>
                </div>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>
                  Enviada em {myReport?.sentAt ? new Date(myReport.sentAt).toLocaleDateString("pt-BR") : "data não registrada"}
                </p>
              </div>

              {/* Quadrante calibrado no topo */}
              {qInfo && (
                <div
                  className="p-5 rounded-xl border"
                  style={{
                    backgroundColor: "#001830",
                    borderColor: `${qInfo.color}40`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8aa3c0" }}>
                    Seu posicionamento no 9-Box
                  </p>
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                      style={{ backgroundColor: `${qInfo.color}20`, color: qInfo.color }}
                    >
                      {myNineboxPos?.quadrant}
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: "#fdffdf" }}>{qInfo.name}</p>
                      <p className="text-sm mt-1" style={{ color: "#8aa3c0" }}>{qInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas por dimensão */}
              {myManagerEval && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: "#fdffdf" }}>Avaliação por Dimensão</h3>
                  {["Cultura", "Performance"].map((axis) => (
                    <div key={axis} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-5 rounded-full" style={{ backgroundColor: axis === "Performance" ? "#d9f22a" : "#1840eb" }} />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: axis === "Performance" ? "#d9f22a" : "#7ba7ff" }}>
                          Eixo de {axis}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {DIMENSIONS.filter((d) => d.axis === axis).map((dim) => {
                          const val = (myManagerEval as any)[dim.key] as string | undefined;
                          const comment = (myManagerEval as any)[`${dim.key}Comment`] as string | undefined;
                          const axisInfo = val ? AXIS_LABELS[val] : null;
                          return (
                            <div
                              key={dim.key}
                              className="p-3 rounded-xl border"
                              style={{ backgroundColor: "#001830", borderColor: axisInfo ? `${axisInfo.color}30` : "#0a3060" }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>{dim.label}</p>
                                {axisInfo && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                                    style={{ backgroundColor: axisInfo.bg, color: axisInfo.color }}
                                  >
                                    {axisInfo.label}
                                  </span>
                                )}
                              </div>
                              {comment && (
                                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#8aa3c0" }}>
                                  {comment}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback Geral do gestor */}
              {myManagerEval?.feedbackGeral && (
                <div
                  className="p-5 rounded-xl border"
                  style={{ backgroundColor: "#001830", borderColor: "#d9f22a30" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#d9f22a" }}>
                    Feedback Geral do Gestor
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#fdffdf" }}>
                    {(myManagerEval as any).feedbackGeral}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </StellarLayout>
    );
  }

  // Gestor/RH view
  return (
    <StellarLayout title="Devolutivas">
      <div className="p-4 sm:p-6 max-w-4xl space-y-4 sm:space-y-6">
        {/* Employee selector */}
        <div
          className="p-4 rounded-xl border"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#8aa3c0" }}>
            Selecionar Liderado
          </p>
          <div className="flex flex-wrap gap-2">
            {directReports?.map((emp) => {
              const report = teamReports?.find((r) => r.employeeId === emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployee(emp.id);
                    setFinalContent(report?.finalContent ?? "");
                    setFinalActionPlan(report?.finalActionPlan ?? "");
                    setAiContent("");
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all"
                  style={{
                    backgroundColor: selectedEmployee === emp.id ? "#d9f22a15" : "#001023",
                    borderColor: selectedEmployee === emp.id ? "#d9f22a40" : "#0a3060",
                    color: selectedEmployee === emp.id ? "#d9f22a" : "#fdffdf",
                  }}
                >
                  <User size={14} />
                  {emp.name}
                  {report?.status === "sent" && (
                    <CheckCircle size={12} style={{ color: "#22c55e" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedEmployee && (
          <>
            {/* AI Generate */}
            {managerEval && (
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "#001830", borderColor: "#1840eb30" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
                      Gerar feedback com IA
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
                      A IA vai estruturar o feedback com base na avaliação e no quadrante do 9-Box.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={generateFeedback.isPending}
                    className="flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: "#1840eb", color: "#fdffdf" }}
                  >
                    {generateFeedback.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <BrainCircuit size={14} />
                    )}
                    Gerar com IA
                  </Button>
                </div>
              </div>
            )}

            {/* Editor */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Conteúdo do Feedback *
                </label>
                <Textarea
                  placeholder="Escreva o feedback para o colaborador..."
                  value={finalContent}
                  onChange={(e) => setFinalContent(e.target.value)}
                  rows={8}
                  style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#8aa3c0" }}>
                  Plano de Ação
                </label>
                <Textarea
                  placeholder="Ações e próximos passos acordados..."
                  value={finalActionPlan}
                  onChange={(e) => setFinalActionPlan(e.target.value)}
                  rows={4}
                  style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!finalContent) return toast.error("Preencha o conteúdo do feedback.");
                    saveDraft.mutate({
                      employeeId: selectedEmployee,
                      cycleId,
                      finalContent,
                      finalActionPlan: finalActionPlan || undefined,
                      aiFeedbackContent: aiContent || undefined,
                    });
                  }}
                  disabled={saveDraft.isPending}
                  style={{ borderColor: "#0a3060", color: "#fdffdf", backgroundColor: "transparent" }}
                >
                  Salvar rascunho
                </Button>
                <Button
                  onClick={() => {
                    if (!finalContent) return toast.error("Preencha o conteúdo do feedback.");
                    saveDraft.mutate(
                      {
                        employeeId: selectedEmployee,
                        cycleId,
                        finalContent,
                        finalActionPlan: finalActionPlan || undefined,
                        aiFeedbackContent: aiContent || undefined,
                      },
                      {
                        onSuccess: () => {
                          sendReport.mutate({ employeeId: selectedEmployee, cycleId });
                        },
                      }
                    );
                  }}
                  disabled={saveDraft.isPending || sendReport.isPending}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                >
                  <Send size={14} />
                  Enviar devolutiva
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </StellarLayout>
  );
}
