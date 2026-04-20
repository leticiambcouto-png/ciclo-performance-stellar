import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import StellarLayout from "@/components/StellarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Send, CheckCircle2, Clock, AlertCircle, Target, BookOpen, Star } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALOR_LABELS: Record<string, string> = {
  ambicao: "Ambição",
  sonharGrande: "Sonhar Grande",
  accountability: "Accountability",
  juntosSomosMaisFortes: "Juntos Somos Mais Fortes",
};

const RATING_LABEL: Record<string, string> = {
  below: "Abaixo do esperado",
  within: "Dentro do esperado",
  above: "Acima do esperado",
};

const RATING_COLOR: Record<string, string> = {
  below: "text-red-400",
  within: "text-yellow-400",
  above: "text-green-400",
};

function ratingScore(v: string | null | undefined): number {
  if (v === "above") return 3;
  if (v === "within") return 2;
  if (v === "below") return 1;
  return 0;
}

function getLowestValue(eval_: Record<string, string | null | undefined> | null | undefined): string {
  if (!eval_) return "";
  const valores = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];
  const scored = valores.map((v) => ({ key: v, label: VALOR_LABELS[v], score: ratingScore(eval_[v] as string) }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.label || "";
}

// ─── Feedback Display Panel ───────────────────────────────────────────────────

function FeedbackDisplayPanel({ feedback }: { feedback: Record<string, unknown> | null | undefined }) {
  if (!feedback) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-400">
      Feedback do líder ainda não disponível. Aguarde o envio do feedback estruturado.
    </div>
  );

  if (feedback.status !== "submitted") return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-400 flex items-center gap-2">
      <Clock className="w-4 h-4 flex-shrink-0" />
      Seu líder ainda está preparando o feedback. O Plano de Impacto será liberado após o envio.
    </div>
  );

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 space-y-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Star className="w-3 h-3 text-[#CDFF00]" />
        Feedback do seu líder
      </p>

      {!!feedback.entregasRelevantes && (
        <div>
          <p className="text-xs text-slate-500 mb-1">Entregas relevantes</p>
          <p className="text-sm text-slate-200 leading-relaxed">{String(feedback.entregasRelevantes)}</p>
        </div>
      )}

      {!!feedback.abaixoEsperado && (
        <div>
          <p className="text-xs text-slate-500 mb-1">O que ficou abaixo do esperado</p>
          <p className="text-sm text-slate-200 leading-relaxed">{String(feedback.abaixoEsperado)}</p>
        </div>
      )}

      {!!feedback.valorConsistente && (
        <div>
          <p className="text-xs text-slate-500 mb-1">Valor demonstrado com consistência</p>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-1">{String(feedback.valorConsistente)}</Badge>
          {!!feedback.valorConsistenteDesc && (
            <p className="text-sm text-slate-200 leading-relaxed mt-1">{String(feedback.valorConsistenteDesc)}</p>
          )}
        </div>
      )}

      {!!feedback.valorEvoluir && (
        <div>
          <p className="text-xs text-slate-500 mb-1">Valor que precisa evoluir</p>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-1">{String(feedback.valorEvoluir)}</Badge>
          {!!feedback.valorEvoluirComportamento && (
            <p className="text-sm text-slate-200 leading-relaxed mt-1">{String(feedback.valorEvoluirComportamento)}</p>
          )}
        </div>
      )}

      {!!feedback.proximoCicloDiferente && (
        <div>
          <p className="text-xs text-slate-500 mb-1">O que fazer diferente no próximo ciclo</p>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{String(feedback.proximoCicloDiferente)}</p>
        </div>
      )}

      {!!feedback.proximoCicloExpectativa && (
        <div>
          <p className="text-xs text-slate-500 mb-1">Expectativa do líder para os próximos 6 meses</p>
          <p className="text-sm text-slate-200 leading-relaxed italic">"{String(feedback.proximoCicloExpectativa)}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Impact Plan Form ─────────────────────────────────────────────────────────

interface ImpactPlanFormProps {
  cycleId: number;
  feedbackId: number;
  feedback: Record<string, unknown>;
  managerEval: Record<string, string | null | undefined> | null | undefined;
  existing: Record<string, unknown> | null | undefined;
}

function ImpactPlanForm({ cycleId, feedbackId, feedback, managerEval, existing }: ImpactPlanFormProps) {
  const utils = trpc.useUtils();

  const lowestValue = useMemo(() => getLowestValue(managerEval), [managerEval]);
  const suggestedValor = (feedback.valorEvoluir as string) || lowestValue;

  const [form, setForm] = useState({
    valorDesenvolver: (existing?.valorDesenvolver as string) || suggestedValor,
    valorAcoes: (existing?.valorAcoes as string) || "",
    competenciaTecnica: (existing?.competenciaTecnica as string) || "",
    comoDesenvolver: (existing?.comoDesenvolver as string) || "",
    prazoDias: (existing?.prazoDias as number) || 90,
    resultadoEsperado: (existing?.resultadoEsperado as string) || "",
  });

  const saveMutation = trpc.impactPlan.save.useMutation({
    onSuccess: () => {
      toast.success("Rascunho salvo");
      utils.impactPlan.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.impactPlan.submit.useMutation({
    onSuccess: () => {
      toast.success("Plano de Impacto enviado com sucesso!");
      utils.impactPlan.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    saveMutation.mutate({ cycleId, feedbackId, ...form });
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      cycleId,
      feedbackId,
      valorDesenvolver: form.valorDesenvolver,
      valorAcoes: form.valorAcoes,
      competenciaTecnica: form.competenciaTecnica,
      comoDesenvolver: form.comoDesenvolver,
      prazoDias: form.prazoDias,
      resultadoEsperado: form.resultadoEsperado,
    });
  };

  const isSubmitted = existing?.status === "submitted";

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: CULTURA */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00] flex items-center gap-2">
            <Target className="w-4 h-4" />
            1. Cultura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">Qual valor vou desenvolver nesse semestre? *</Label>
            <p className="text-xs text-slate-500 mb-2">
              Sugestão baseada na sua avaliação:{" "}
              <span className="text-orange-400 font-medium">{suggestedValor || "—"}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {Object.values(VALOR_LABELS).map((label) => (
                <button
                  key={label}
                  disabled={isSubmitted}
                  onClick={() => setForm((f) => ({ ...f, valorDesenvolver: label }))}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                    form.valorDesenvolver === label
                      ? "bg-[#CDFF00]/20 border-[#CDFF00]/50 text-[#CDFF00]"
                      : "bg-slate-900/40 border-slate-600 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.valorDesenvolver && form.valorDesenvolver !== suggestedValor && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-xs text-blue-400">
                Você escolheu um valor diferente da sugestão. Isso ficará registrado no seu plano.
              </div>
            )}
          </div>

          <div>
            <Label className="text-slate-300 text-sm">O que vou fazer de diferente na prática? *</Label>
            <p className="text-xs text-slate-500 mb-2">Mínimo 2 exemplos concretos de comportamento.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.valorAcoes}
              onChange={(e) => setForm((f) => ({ ...f, valorAcoes: e.target.value }))}
              placeholder="Ex: 1. Vou comunicar riscos com antecedência de 48h ao meu líder&#10;2. Vou buscar feedback quinzenal com meu gestor"
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: DESENVOLVIMENTO TÉCNICO */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00] flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            2. Desenvolvimento Técnico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">Qual competência técnica vou desenvolver? *</Label>
            <Textarea
              disabled={isSubmitted}
              value={form.competenciaTecnica}
              onChange={(e) => setForm((f) => ({ ...f, competenciaTecnica: e.target.value }))}
              placeholder="Ex: Análise de dados com SQL, liderança de projetos, comunicação executiva..."
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Como vou fazer isso? *</Label>
            <p className="text-xs text-slate-500 mb-2">Ex: curso, projeto prático, shadowing, mentoria.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.comoDesenvolver}
              onChange={(e) => setForm((f) => ({ ...f, comoDesenvolver: e.target.value }))}
              placeholder="Ex: Curso de SQL no Coursera (4 semanas) + projeto prático no time de dados"
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Em quanto tempo? *</Label>
            <p className="text-xs text-slate-500 mb-2">Prazo máximo: 90 dias.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                disabled={isSubmitted}
                value={form.prazoDias}
                onChange={(e) => setForm((f) => ({ ...f, prazoDias: Math.min(90, Math.max(1, Number(e.target.value))) }))}
                min={1}
                max={90}
                className="bg-slate-900/50 border-slate-600 text-white w-28"
              />
              <span className="text-sm text-slate-400">dias</span>
              {form.prazoDias > 90 && (
                <span className="text-xs text-red-400">Máximo 90 dias</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: COMPROMISSO */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            3. Compromisso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-slate-300 text-sm">Qual é o resultado esperado ao final desse plano? *</Label>
            <p className="text-xs text-slate-500 mb-2">1 frase objetiva.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.resultadoEsperado}
              onChange={(e) => setForm((f) => ({ ...f, resultadoEsperado: e.target.value }))}
              placeholder="Ex: Ao final de 90 dias, serei capaz de construir dashboards de análise de dados de forma independente."
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!isSubmitted && (
        <div className="flex gap-3 justify-end pb-6">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-[#CDFF00] text-black hover:bg-[#b8e600] font-semibold"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? "Enviando..." : "Enviar Plano de Impacto"}
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-green-400 flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Plano de Impacto enviado em {existing?.submittedAt ? new Date(existing.submittedAt as string).toLocaleDateString("pt-BR") : "—"}.
          Este plano será exibido no próximo ciclo para comparação.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlanoImpacto() {
  const { user } = useStellarAuth();

  const { data: activeCycle } = trpc.cycles.active.useQuery();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const { data: allCycles } = trpc.cycles.all.useQuery();

  const cycleId = selectedCycleId ?? activeCycle?.id ?? null;

  // Get my ninebox position to check if I'm a Talent
  const { data: myNineboxPosition } = trpc.ninebox.myPosition.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  // Get feedback written by my leader
  const { data: myFeedback } = trpc.feedback.getMyFeedback.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  // Get my manager evaluation (for lowest value calculation)
  const { data: myManagerEval } = trpc.managerEvaluation.myEval.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  // Get my existing impact plan
  const { data: myImpactPlan } = trpc.impactPlan.get.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  const isTalent = myNineboxPosition?.quadrant
    ? ["Q6", "Q8", "Q9"].includes(myNineboxPosition.quadrant)
    : false;

  const feedbackSubmitted = myFeedback?.status === "submitted";

  const cycles = allCycles ?? [];

  return (
    <StellarLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-[#CDFF00]" />
              Plano de Impacto
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Etapa 2 — Preenchido pelo colaborador após a conversa de feedback
            </p>
          </div>
          {cycles.length > 1 && (
            <select
              value={selectedCycleId ?? cycleId ?? ""}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2"
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
          <div className="text-center text-slate-400 py-12">
            Nenhum ciclo ativo encontrado.
          </div>
        ) : !isTalent ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-medium">Plano de Impacto não obrigatório</p>
            <p className="text-sm text-slate-400">
              O Plano de Impacto é obrigatório apenas para colaboradores classificados como{" "}
              <span className="text-[#CDFF00] font-medium">Talentos</span> no ciclo (Q6, Q8 ou Q9).
            </p>
            {myNineboxPosition?.quadrant && (
              <p className="text-xs text-slate-500">
                Sua posição atual: <span className="text-white font-medium">{myNineboxPosition.quadrant}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Talent badge */}
            <div className="flex items-center gap-2">
              <Badge className="bg-[#CDFF00]/20 text-[#CDFF00] border-[#CDFF00]/30 gap-1">
                <Star className="w-3 h-3" /> Talento — {myNineboxPosition?.quadrant}
              </Badge>
              {myImpactPlan?.status === "submitted" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Plano enviado
                </Badge>
              )}
              {myImpactPlan?.status === "draft" && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
                  <Clock className="w-3 h-3" /> Rascunho
                </Badge>
              )}
            </div>

            {/* Feedback from leader */}
            <FeedbackDisplayPanel feedback={myFeedback as Record<string, unknown> | null | undefined} />

            {/* Impact Plan Form — only available after feedback is submitted */}
            {!feedbackSubmitted ? (
              <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 text-sm text-slate-400 text-center">
                O formulário do Plano de Impacto será liberado após o envio do feedback pelo seu líder.
              </div>
            ) : (
              <ImpactPlanForm
                cycleId={cycleId}
                feedbackId={(myFeedback as { id: number }).id}
                feedback={myFeedback as Record<string, unknown>}
                managerEval={myManagerEval as Record<string, string | null | undefined> | null | undefined}
                existing={myImpactPlan as Record<string, unknown> | null | undefined}
              />
            )}
          </div>
        )}
      </div>
    </StellarLayout>
  );
}
