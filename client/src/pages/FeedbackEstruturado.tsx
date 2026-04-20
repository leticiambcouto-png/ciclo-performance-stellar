import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import StellarLayout from "@/components/StellarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Send, User, BarChart2, AlertCircle, CheckCircle2, Clock } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (status === "submitted") return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
      <CheckCircle2 className="w-3 h-3" /> Enviado
    </Badge>
  );
  if (status === "draft") return (
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

// ─── Evaluation Summary Panel ─────────────────────────────────────────────────

function EvalSummaryPanel({ managerEval }: { managerEval: Record<string, string | null | undefined> | null | undefined }) {
  if (!managerEval) return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-400">
      Avaliação do gestor não encontrada para este ciclo.
    </div>
  );

  const valores = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];
  const perfs = ["qualidade", "contribuicao", "adaptacao", "usoDeIA"];
  const metaOk = metaAtingida(managerEval);

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dados da Avaliação</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Valores Culturais</p>
          {valores.map((v) => (
            <div key={v} className="flex justify-between text-xs py-0.5">
              <span className="text-slate-300">{VALOR_LABELS[v]}</span>
              <span className={RATING_COLOR[managerEval[v] as string] || "text-slate-500"}>
                {RATING_LABEL[managerEval[v] as string] || "—"}
              </span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Performance</p>
          {perfs.map((p) => (
            <div key={p} className="flex justify-between text-xs py-0.5">
              <span className="text-slate-300">{PERF_LABELS[p]}</span>
              <span className={RATING_COLOR[managerEval[p] as string] || "text-slate-500"}>
                {RATING_LABEL[managerEval[p] as string] || "—"}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-xs py-0.5 mt-1 border-t border-slate-700 pt-1">
            <span className="text-slate-300 font-medium">Meta atingida?</span>
            <span className={metaOk ? "text-green-400" : "text-red-400"}>
              {metaOk ? "Sim" : "Não"}
            </span>
          </div>
        </div>
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
  onBack: () => void;
}

function FeedbackForm({ cycleId, employee, managerEval, existing, onBack }: FeedbackFormProps) {
  const utils = trpc.useUtils();

  const lowestValues = useMemo(() => getLowestValues(managerEval), [managerEval]);
  const metaOk = useMemo(() => metaAtingida(managerEval), [managerEval]);

  const [form, setForm] = useState({
    entregasRelevantes: (existing?.entregasRelevantes as string) || "",
    abaixoEsperado: (existing?.abaixoEsperado as string) || "",
    valorConsistente: (existing?.valorConsistente as string) || "",
    valorConsistenteDesc: (existing?.valorConsistenteDesc as string) || "",
    valorEvoluirComportamento: (existing?.valorEvoluirComportamento as string) || "",
    proximoCicloDiferente: (existing?.proximoCicloDiferente as string) || "",
    proximoCicloExpectativa: (existing?.proximoCicloExpectativa as string) || "",
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

  const handleSave = () => {
    saveMutation.mutate({
      cycleId,
      employeeId: employee.id,
      ...form,
      metaAtingidaAuto: metaOk,
      valorEvoluir: lowestValues[0] || "",
    });
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      cycleId,
      employeeId: employee.id,
      entregasRelevantes: form.entregasRelevantes,
      metaAtingidaAuto: metaOk,
      abaixoEsperado: form.abaixoEsperado,
      valorConsistente: form.valorConsistente,
      valorConsistenteDesc: form.valorConsistenteDesc,
      valorEvoluir: lowestValues[0] || "",
      valorEvoluirComportamento: form.valorEvoluirComportamento,
      proximoCicloDiferente: form.proximoCicloDiferente,
      proximoCicloExpectativa: form.proximoCicloExpectativa,
    });
  };

  const isSubmitted = existing?.status === "submitted";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">{employee.name}</h2>
          <p className="text-sm text-slate-400">{employee.jobTitle || "—"}</p>
        </div>
        {isSubmitted && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enviado</Badge>}
      </div>

      {/* Eval Summary */}
      <EvalSummaryPanel managerEval={managerEval} />

      {isSubmitted && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Feedback já enviado. Você pode visualizar mas não editar.
        </div>
      )}

      {/* SEÇÃO 1: ENTREGAS */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00]">1. Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">O que essa pessoa entregou de mais relevante nesse ciclo? *</Label>
            <p className="text-xs text-slate-500 mb-2">Mínimo 3 linhas. Seja específico sobre o impacto gerado.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.entregasRelevantes}
              onChange={(e) => setForm((f) => ({ ...f, entregasRelevantes: e.target.value }))}
              placeholder="Descreva as principais entregas e seu impacto..."
              className="bg-slate-900/50 border-slate-600 text-white min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">A meta foi atingida? (calculado automaticamente da avaliação)</p>
            <span className={`font-semibold text-sm ${metaOk ? "text-green-400" : "text-red-400"}`}>
              {metaOk ? "✓ Sim — Performance dentro ou acima do esperado" : "✗ Não — Performance abaixo do esperado"}
            </span>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">O que ficou abaixo do esperado? *</Label>
            <p className="text-xs text-slate-500 mb-2">Campo obrigatório. Não aceita "nada" ou campo vazio.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.abaixoEsperado}
              onChange={(e) => setForm((f) => ({ ...f, abaixoEsperado: e.target.value }))}
              placeholder="Descreva o que ficou aquém das expectativas..."
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: COMPORTAMENTO CULTURAL */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00]">2. Comportamento Cultural</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">Qual valor essa pessoa demonstrou com mais consistência? *</Label>
            <p className="text-xs text-slate-500 mb-2">Descreva um comportamento real que você observou.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {Object.entries(VALOR_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  disabled={isSubmitted}
                  onClick={() => setForm((f) => ({ ...f, valorConsistente: label }))}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                    form.valorConsistente === label
                      ? "bg-[#CDFF00]/20 border-[#CDFF00]/50 text-[#CDFF00]"
                      : "bg-slate-900/40 border-slate-600 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Textarea
              disabled={isSubmitted}
              value={form.valorConsistenteDesc}
              onChange={(e) => setForm((f) => ({ ...f, valorConsistenteDesc: e.target.value }))}
              placeholder="Descreva o comportamento concreto que você observou..."
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Qual valor precisa evoluir?</Label>
            <p className="text-xs text-slate-500 mb-2">Calculado automaticamente — os 2 valores com menor nota na avaliação.</p>
            <div className="flex gap-2 flex-wrap">
              {lowestValues.length > 0 ? lowestValues.map((v) => (
                <Badge key={v} className="bg-orange-500/20 text-orange-400 border-orange-500/30">{v}</Badge>
              )) : (
                <span className="text-xs text-slate-500">Avaliação não disponível</span>
              )}
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Que comportamento concreto justifica essa nota? *</Label>
            <p className="text-xs text-slate-500 mb-2">
              Mínimo 150 caracteres. {form.valorEvoluirComportamento.length}/150
            </p>
            <Textarea
              disabled={isSubmitted}
              value={form.valorEvoluirComportamento}
              onChange={(e) => setForm((f) => ({ ...f, valorEvoluirComportamento: e.target.value }))}
              placeholder="Descreva situações concretas que justificam a nota desse valor..."
              className={`bg-slate-900/50 border-slate-600 text-white ${
                form.valorEvoluirComportamento.length > 0 && form.valorEvoluirComportamento.length < 150
                  ? "border-orange-500/50"
                  : ""
              }`}
              rows={4}
            />
            {form.valorEvoluirComportamento.length > 0 && form.valorEvoluirComportamento.length < 150 && (
              <p className="text-xs text-orange-400 mt-1">
                Faltam {150 - form.valorEvoluirComportamento.length} caracteres
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: PRÓXIMO CICLO */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#CDFF00]">3. Próximo Ciclo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm">O que essa pessoa precisa fazer diferente pra crescer aqui? *</Label>
            <p className="text-xs text-slate-500 mb-2">1 a 3 itens objetivos.</p>
            <Textarea
              disabled={isSubmitted}
              value={form.proximoCicloDiferente}
              onChange={(e) => setForm((f) => ({ ...f, proximoCicloDiferente: e.target.value }))}
              placeholder="Ex: 1. Comunicar riscos com antecedência&#10;2. Buscar feedback proativamente&#10;3. Desenvolver habilidade de priorização"
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={4}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Qual é a sua expectativa clara pra ela nos próximos 6 meses? *</Label>
            <Textarea
              disabled={isSubmitted}
              value={form.proximoCicloExpectativa}
              onChange={(e) => setForm((f) => ({ ...f, proximoCicloExpectativa: e.target.value }))}
              placeholder="Descreva o que você espera dessa pessoa no próximo ciclo..."
              className="bg-slate-900/50 border-slate-600 text-white"
              rows={3}
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
            {submitMutation.isPending ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Employee List ────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  employee: { id: number; name: string; jobTitle?: string | null };
  feedback: Record<string, unknown> | null | undefined;
  onSelect: () => void;
}

function EmployeeRow({ employee, feedback, onSelect }: EmployeeRowProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-left"
    >
      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{employee.name}</p>
        <p className="text-xs text-slate-400 truncate">{employee.jobTitle || "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={feedback?.status as string | undefined} />
        <ChevronRight className="w-4 h-4 text-slate-500" />
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

  const isGestor =
    user?.platformRole === "gestor" ||
    user?.secondaryPlatformRole === "gestor" ||
    user?.platformRole === "rh";

  if (!isGestor) {
    return (
      <StellarLayout>
        <div className="p-6 text-center text-slate-400">
          Esta página é exclusiva para gestores.
        </div>
      </StellarLayout>
    );
  }

  const cycles = allCycles ?? [];

  return (
    <StellarLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-[#CDFF00]" />
              Feedback Estruturado
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Etapa 1 — Preenchido pelo líder antes da conversa com o liderado
            </p>
          </div>
          {/* Cycle selector */}
          {cycles.length > 1 && (
            <select
              value={selectedCycleId ?? cycleId ?? ""}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2"
            >
              {cycles.map((c) => (
                <option key={(c as { id: number }).id} value={(c as { id: number }).id}>
                  {(c as { name: string; status: string }).name} {(c as { status: string }).status === "open" ? "(ativo)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {!cycleId ? (
          <div className="text-center text-slate-400 py-12">
            Nenhum ciclo ativo encontrado. Configure um ciclo no Painel RH.
          </div>
        ) : selectedEmployee ? (
          <FeedbackForm
            cycleId={cycleId}
            employee={selectedEmployee}
            managerEval={managerEval as Record<string, string | null | undefined> | null | undefined}
            existing={existingFeedback as Record<string, unknown> | null | undefined}
            onBack={() => setSelectedEmployeeId(null)}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">
              Selecione um liderado para preencher o feedback estruturado.
            </p>
            {!directReports || directReports.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
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
        )}
      </div>
    </StellarLayout>
  );
}
