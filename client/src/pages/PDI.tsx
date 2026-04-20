import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import StellarLayout from "@/components/StellarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  BookOpen,
  Target,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NINEBOX_QUADRANTS } from "@shared/nineboxData";

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

const PDI_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  leader_defined: "Aguardando colaborador",
  employee_filling: "Em preenchimento",
  leader_validating: "Aguardando validação",
  completed: "Concluído",
};

const PDI_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  leader_defined: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  employee_filling: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  leader_validating: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

function ratingScore(v: string | null | undefined): number {
  if (v === "above") return 3;
  if (v === "within") return 2;
  if (v === "below") return 1;
  return 0;
}

function getLowestValores(eval_: Record<string, string | null | undefined> | null | undefined) {
  if (!eval_) return [];
  const valores = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];
  const scored = valores.map((v) => ({ key: v, score: ratingScore(eval_[v] as string) }));
  scored.sort((a, b) => a.score - b.score);
  const minScore = scored[0]?.score ?? 0;
  return scored.filter((s) => s.score === minScore);
}

function StatusBadge({ status }: { status: string | undefined }) {
  const label = PDI_STATUS_LABELS[status ?? ""] ?? "Não iniciado";
  const color = PDI_STATUS_COLORS[status ?? ""] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
  const icon =
    status === "completed" ? <CheckCircle2 className="w-3 h-3" /> :
    status === "draft" || !status ? <AlertCircle className="w-3 h-3" /> :
    <Clock className="w-3 h-3" />;
  return (
    <Badge className={`${color} gap-1`}>
      {icon} {label}
    </Badge>
  );
}

// ─── 70/20/10 Block Form ──────────────────────────────────────────────────────

interface BlockFormProps {
  blockType: "valor_stellar" | "competencia_tecnica";
  competencia: string;
  quadrant?: string;
  jobTitle?: string;
  initialData?: {
    acoes70?: string | null;
    acoes70Justificativa?: string | null;
    acoes20?: string | null;
    acoes10?: string | null;
    iaAcoes70?: string | null;
    iaAcoes20?: string | null;
    iaAcoes10?: string | null;
    preenchidoPeloColaborador?: boolean;
  };
  pdiId: number;
  onSaved: () => void;
  readOnly?: boolean;
}

function BlockForm({ blockType, competencia, quadrant, jobTitle, initialData, pdiId, onSaved, readOnly }: BlockFormProps) {
  const [acoes70, setAcoes70] = useState(initialData?.acoes70 ?? "");
  const [acoes70Just, setAcoes70Just] = useState(initialData?.acoes70Justificativa ?? "");
  const [acoes20, setAcoes20] = useState(initialData?.acoes20 ?? "");
  const [acoes10, setAcoes10] = useState(initialData?.acoes10 ?? "");
  const [iaAcoes70, setIaAcoes70] = useState(initialData?.iaAcoes70 ?? "");
  const [iaAcoes20, setIaAcoes20] = useState(initialData?.iaAcoes20 ?? "");
  const [iaAcoes10, setIaAcoes10] = useState(initialData?.iaAcoes10 ?? "");
  const [iaBuckets, setIaBuckets] = useState<{
    bucket70?: { titulo: string; descricao: string; acao: string; exemplos: string[] };
    bucket20?: { titulo: string; descricao: string; acao: string; exemplos: string[] };
    bucket10?: { titulo: string; descricao: string; acao: string; exemplos: string[] };
  } | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);

  const getIASuggestions = trpc.pdi.getIASuggestions.useMutation();
  const saveActions = trpc.pdi.saveEmployeeActions.useMutation();

  const blockLabel = blockType === "valor_stellar" ? "Valor Cultural Stellar" : "Competência Técnica";

  async function handleGetIA() {
    setLoadingIA(true);
    try {
      const result = await getIASuggestions.mutateAsync({
        competencia,
        blockType,
        quadrant,
        jobTitle,
      });
      setIaAcoes70(result.acoes70);
      setIaAcoes20(result.acoes20);
      setIaAcoes10(result.acoes10);
      setIaBuckets({ bucket70: result.bucket70, bucket20: result.bucket20, bucket10: result.bucket10 });
      toast.success("Sugestões 70/20/10 geradas pela Stella!");
    } catch {
      toast.error("Erro ao gerar sugestões da IA.");
    } finally {
      setLoadingIA(false);
    }
  }

  async function handleSave() {
    if (!acoes70.trim()) {
      toast.error("O campo 70% (prática no trabalho) é obrigatório.");
      return;
    }
    if (!acoes70Just.trim()) {
      toast.error("A justificativa do campo 70% é obrigatória.");
      return;
    }
    if (!acoes20.trim()) {
      toast.error("O campo 20% (aprendizado social) é obrigatório.");
      return;
    }
    if (!acoes10.trim()) {
      toast.error("O campo 10% (aprendizado formal) é obrigatório.");
      return;
    }
    try {
      await saveActions.mutateAsync({
        pdiId,
        blockType,
        acoes70,
        acoes70Justificativa: acoes70Just,
        acoes20,
        acoes10,
        iaAcoes70: iaAcoes70 || null,
        iaAcoes20: iaAcoes20 || null,
        iaAcoes10: iaAcoes10 || null,
      });
      toast.success(`Bloco "${blockLabel}" salvo com sucesso!`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{blockLabel}</p>
          <p className="font-semibold text-white">{competencia}</p>
        </div>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetIA}
            disabled={loadingIA}
            className="gap-2 border-[#d9f22a]/30 text-[#d9f22a] hover:bg-[#d9f22a]/10"
          >
            {loadingIA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingIA ? "Gerando..." : "Gerar sugestões com IA"}
          </Button>
        )}
      </div>

      {/* 70% */}
      <div className="rounded-lg border border-[#d9f22a]/20 bg-[#d9f22a]/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#d9f22a]/20 flex items-center justify-center text-[#d9f22a] font-black text-sm">70%</div>
            <div>
              <p className="font-bold text-[#d9f22a] text-sm">{iaBuckets?.bucket70?.titulo ?? "Aprender Fazendo"}</p>
              <p className="text-xs text-slate-400">{iaBuckets?.bucket70?.descricao ?? "Projetos, desafios e responsabilidades novas no dia a dia"}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-[#d9f22a]/10 text-[#d9f22a] font-semibold">Obrigatório editar</span>
        </div>
        {iaBuckets?.bucket70 && (
          <div className="bg-slate-800/60 rounded-lg p-3 border border-[#d9f22a]/20 space-y-2">
            <p className="text-xs text-[#d9f22a] font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sugestão da Stella</p>
            <p className="text-sm text-white font-medium">{iaBuckets.bucket70.acao}</p>
            {iaBuckets.bucket70.exemplos.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Exemplos:</p>
                {iaBuckets.bucket70.exemplos.map((ex, i) => (
                  <p key={i} className="text-xs text-slate-300 pl-2 border-l border-[#d9f22a]/30">{ex}</p>
                ))}
              </div>
            )}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="text-xs text-[#d9f22a] hover:bg-[#d9f22a]/10 h-7" onClick={() => setAcoes70(iaBuckets.bucket70!.acao)}>
                Usar como base (edite depois)
              </Button>
            )}
          </div>
        )}
        {!iaBuckets?.bucket70 && iaAcoes70 && (
          <div className="bg-slate-800/60 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-[#d9f22a] mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Sugestão da IA</p>
            <p className="text-sm text-slate-300">{iaAcoes70}</p>
            {!readOnly && <Button variant="ghost" size="sm" className="mt-2 text-xs text-[#d9f22a] hover:bg-[#d9f22a]/10 h-7" onClick={() => setAcoes70(iaAcoes70)}>Usar como base</Button>}
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Minha ação <span className="text-red-400">*</span> <span className="text-slate-500">(edite a sugestão com sua voz)</span></Label>
          <Textarea value={acoes70} onChange={(e) => setAcoes70(e.target.value)} placeholder="Descreva a ação prática que irá realizar no trabalho para desenvolver esta competência..." className="bg-slate-800/60 border-slate-700 text-white min-h-[80px] text-sm" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Justificativa — por que escolheu esta ação? <span className="text-red-400">*</span></Label>
          <Input value={acoes70Just} onChange={(e) => setAcoes70Just(e.target.value)} placeholder="Ex: Escolhi este projeto pois me desafia a desenvolver X no contexto Y..." className="bg-slate-800/60 border-slate-700 text-white text-sm" disabled={readOnly} />
        </div>
      </div>

      {/* 20% */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">20%</div>
            <div>
              <p className="font-bold text-blue-400 text-sm">{iaBuckets?.bucket20?.titulo ?? "Aprender com Pessoas"}</p>
              <p className="text-xs text-slate-400">{iaBuckets?.bucket20?.descricao ?? "Mentoria, shadowing, feedback estruturado, comunidades de prática"}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 font-semibold">1 clique</span>
        </div>
        {iaBuckets?.bucket20 && (
          <div className="bg-slate-800/60 rounded-lg p-3 border border-blue-500/20 space-y-2">
            <p className="text-xs text-blue-400 font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sugestão da Stella</p>
            <p className="text-sm text-white font-medium">{iaBuckets.bucket20.acao}</p>
            {iaBuckets.bucket20.exemplos.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Exemplos:</p>
                {iaBuckets.bucket20.exemplos.map((ex, i) => (
                  <p key={i} className="text-xs text-slate-300 pl-2 border-l border-blue-500/30">{ex}</p>
                ))}
              </div>
            )}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:bg-blue-400/10 h-7" onClick={() => setAcoes20(iaBuckets.bucket20!.acao)}>
                Aceitar sugestão
              </Button>
            )}
          </div>
        )}
        {!iaBuckets?.bucket20 && iaAcoes20 && (
          <div className="bg-slate-800/60 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-blue-400 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Sugestão da IA</p>
            <p className="text-sm text-slate-300">{iaAcoes20}</p>
            {!readOnly && <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-400 hover:bg-blue-400/10 h-7" onClick={() => setAcoes20(iaAcoes20)}>Aceitar sugestão</Button>}
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Minha ação <span className="text-red-400">*</span></Label>
          <Textarea value={acoes20} onChange={(e) => setAcoes20(e.target.value)} placeholder="Ex: Agendar sessão mensal de mentoria com X para discutir Y..." className="bg-slate-800/60 border-slate-700 text-white min-h-[70px] text-sm" disabled={readOnly} />
        </div>
      </div>

      {/* 10% */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black text-sm">10%</div>
            <div>
              <p className="font-bold text-purple-400 text-sm">{iaBuckets?.bucket10?.titulo ?? "Aprender Formalmente"}</p>
              <p className="text-xs text-slate-400">{iaBuckets?.bucket10?.descricao ?? "Curso, livro, certificação, workshop"}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 font-semibold">1 clique</span>
        </div>
        {iaBuckets?.bucket10 && (
          <div className="bg-slate-800/60 rounded-lg p-3 border border-purple-500/20 space-y-2">
            <p className="text-xs text-purple-400 font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sugestão da Stella</p>
            <p className="text-sm text-white font-medium">{iaBuckets.bucket10.acao}</p>
            {iaBuckets.bucket10.exemplos.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Exemplos:</p>
                {iaBuckets.bucket10.exemplos.map((ex, i) => (
                  <p key={i} className="text-xs text-slate-300 pl-2 border-l border-purple-500/30">{ex}</p>
                ))}
              </div>
            )}
            {!readOnly && (
              <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:bg-purple-400/10 h-7" onClick={() => setAcoes10(iaBuckets.bucket10!.acao)}>
                Aceitar sugestão
              </Button>
            )}
          </div>
        )}
        {!iaBuckets?.bucket10 && iaAcoes10 && (
          <div className="bg-slate-800/60 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-purple-400 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Sugestão da IA</p>
            <p className="text-sm text-slate-300">{iaAcoes10}</p>
            {!readOnly && <Button variant="ghost" size="sm" className="mt-2 text-xs text-purple-400 hover:bg-purple-400/10 h-7" onClick={() => setAcoes10(iaAcoes10)}>Aceitar sugestão</Button>}
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Minha ação <span className="text-red-400">*</span></Label>
          <Textarea value={acoes10} onChange={(e) => setAcoes10(e.target.value)} placeholder="Ex: Concluir o curso X na plataforma Y até o final do semestre..." className="bg-slate-800/60 border-slate-700 text-white min-h-[70px] text-sm" disabled={readOnly} />
        </div>
      </div>

      {!readOnly && (
        <Button
          onClick={handleSave}
          disabled={saveActions.isPending}
          className="w-full bg-[#d9f22a] text-black hover:bg-[#c8e020] font-semibold"
        >
          {saveActions.isPending ? "Salvando..." : `Salvar Bloco — ${blockLabel}`}
        </Button>
      )}
    </div>
  );
}

// ─── Leader Step 1: Define competências ──────────────────────────────────────

interface LeaderStep1Props {
  employee: { id: number; name: string; jobTitle?: string | null };
  cycleId: number;
  existingPdi?: any;
  managerEval?: any;
  nineboxPos?: any;
  onDefined: () => void;
}

function LeaderStep1({ employee, cycleId, existingPdi, managerEval, nineboxPos, onDefined }: LeaderStep1Props) {
  const lowestValores = useMemo(() => getLowestValores(managerEval), [managerEval]);
  const hasEmpate = lowestValores.length > 1;

  const [selectedValor, setSelectedValor] = useState<string>(
    existingPdi?.valorStellar ?? (hasEmpate ? "" : (lowestValores[0]?.key ?? ""))
  );
  const [empateJustificativa, setEmpateJustificativa] = useState(existingPdi?.valorEmpateJustificativa ?? "");
  const [competenciaTecnica, setCompetenciaTecnica] = useState(existingPdi?.competenciaTecnica ?? "");
  const [iaCompSugestao, setIaCompSugestao] = useState(existingPdi?.iaCompetenciaSugestao ?? "");
  const [loadingIAComp, setLoadingIAComp] = useState(false);

  const initPdi = trpc.pdi.initForEmployee.useMutation();
  const getIASuggestions = trpc.pdi.getIASuggestions.useMutation();

  const quadrantInfo = nineboxPos?.quadrant ? NINEBOX_QUADRANTS[nineboxPos.quadrant as keyof typeof NINEBOX_QUADRANTS] : null;

  async function handleGetIACompetencia() {
    if (!selectedValor) return;
    setLoadingIAComp(true);
    try {
      const result = await getIASuggestions.mutateAsync({
        competencia: selectedValor,
        blockType: "valor_stellar",
        quadrant: nineboxPos?.quadrant,
        jobTitle: employee.jobTitle ?? undefined,
      });
      // Use the 70% bucket suggestion as a starting point for competência técnica suggestion
      const bucket70Acao = result.bucket70?.acao ?? result.acoes70 ?? "";
      setIaCompSugestao(`Baseado no valor "${VALOR_LABELS[selectedValor] ?? selectedValor}", sugerimos focar em: ${bucket70Acao}`);
      toast.success("Sugestão gerada pela IA!");
    } catch {
      toast.error("Erro ao gerar sugestão.");
    } finally {
      setLoadingIAComp(false);
    }
  }

  async function handleSubmit() {
    if (!selectedValor) {
      toast.error("Selecione o valor Stellar a desenvolver.");
      return;
    }
    if (hasEmpate && !empateJustificativa.trim()) {
      toast.error("Justificativa obrigatória em caso de empate.");
      return;
    }
    if (!competenciaTecnica.trim()) {
      toast.error("Defina a competência técnica a desenvolver.");
      return;
    }
    try {
      await initPdi.mutateAsync({
        cycleId,
        employeeId: employee.id,
        valorStellar: selectedValor,
        valorEmpate: hasEmpate && lowestValores.map((v) => v.key).includes(selectedValor),
        valorEmpateJustificativa: hasEmpate ? empateJustificativa : null,
        competenciaTecnica,
        iaCompetenciaSugestao: iaCompSugestao || null,
      });
      toast.success("PDI iniciado! O colaborador já pode preencher o plano.");
      onDefined();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao iniciar PDI.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Quadrant info */}
      {quadrantInfo && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black text-sm" style={{ backgroundColor: quadrantInfo.color }}>
            {nineboxPos.quadrant}
          </div>
          <div>
            <p className="font-semibold text-white">{quadrantInfo.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{quadrantInfo.description.slice(0, 120)}...</p>
          </div>
        </div>
      )}

      {/* Valor Stellar */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">
          1. Valor Stellar a Desenvolver
          <span className="ml-2 text-xs text-slate-400 font-normal">(pré-selecionado com a menor nota da avaliação)</span>
        </Label>

        {managerEval ? (
          <div className="space-y-2">
            {["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"].map((v) => {
              const score = ratingScore(managerEval[v]);
              const isLowest = lowestValores.some((l) => l.key === v);
              const isSelected = selectedValor === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedValor(v)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-[#d9f22a] bg-[#d9f22a]/10"
                      : isLowest
                      ? "border-orange-500/50 bg-orange-500/5 hover:border-orange-400"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isSelected ? "text-[#d9f22a]" : "text-white"}`}>
                      {VALOR_LABELS[v]}
                    </span>
                    <div className="flex items-center gap-2">
                      {isLowest && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Menor nota</Badge>}
                      <span className={`text-xs ${RATING_COLOR[managerEval[v]] ?? "text-slate-400"}`}>
                        {RATING_LABEL[managerEval[v]] ?? "—"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"].map((v) => (
              <button
                key={v}
                onClick={() => setSelectedValor(v)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  selectedValor === v
                    ? "border-[#d9f22a] bg-[#d9f22a]/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
              >
                <span className={`font-medium text-sm ${selectedValor === v ? "text-[#d9f22a]" : "text-white"}`}>
                  {VALOR_LABELS[v]}
                </span>
              </button>
            ))}
          </div>
        )}

        {hasEmpate && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
            <p className="text-sm text-orange-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Empate detectado — justificativa obrigatória
            </p>
            <p className="text-xs text-slate-400">
              Os valores <strong>{lowestValores.map((v) => VALOR_LABELS[v.key]).join(" e ")}</strong> estão empatados com a menor nota. Selecione um e justifique a escolha em uma frase.
            </p>
            <Input
              value={empateJustificativa}
              onChange={(e) => setEmpateJustificativa(e.target.value)}
              placeholder="Ex: Escolhi Accountability pois é o valor com maior impacto no contexto atual do time..."
              className="bg-slate-800/60 border-slate-700 text-white text-sm"
            />
          </div>
        )}
      </div>

      {/* Competência Técnica */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">2. Competência Técnica a Desenvolver</Label>
        <p className="text-xs text-slate-400">Defina qual competência técnica este colaborador deve desenvolver neste ciclo.</p>

        {iaCompSugestao && (
          <div className="bg-slate-800/60 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-[#d9f22a] mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Sugestão da IA</p>
            <p className="text-sm text-slate-300">{iaCompSugestao}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-[#d9f22a] hover:text-[#d9f22a] hover:bg-[#d9f22a]/10 h-7"
              onClick={() => setCompetenciaTecnica(iaCompSugestao)}
            >
              Usar como base
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={competenciaTecnica}
            onChange={(e) => setCompetenciaTecnica(e.target.value)}
            placeholder="Ex: Análise de dados com SQL e Power BI para tomada de decisão baseada em dados..."
            className="bg-slate-800/60 border-slate-700 text-white min-h-[80px] text-sm flex-1"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGetIACompetencia}
          disabled={loadingIAComp || !selectedValor}
          className="gap-2 border-[#d9f22a]/30 text-[#d9f22a] hover:bg-[#d9f22a]/10"
        >
          {loadingIAComp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loadingIAComp ? "Gerando..." : "Sugerir competência com IA"}
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={initPdi.isPending}
        className="w-full bg-[#d9f22a] text-black hover:bg-[#c8e020] font-semibold"
      >
        {initPdi.isPending ? "Salvando..." : "Definir e Liberar para o Colaborador"}
      </Button>
    </div>
  );
}

// ─── Leader Step 3: Validate ──────────────────────────────────────────────────

interface LeaderStep3Props {
  pdi: any;
  onValidated: () => void;
}

function LeaderStep3({ pdi, onValidated }: LeaderStep3Props) {
  const [liderObs, setLiderObs] = useState(pdi.liderObservacoes ?? "");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<Record<string, boolean>>({
    valor_stellar: false,
    competencia_tecnica: false,
  });

  const validate = trpc.pdi.leaderValidate.useMutation();

  async function handleValidate() {
    try {
      await validate.mutateAsync({
        pdiId: pdi.id,
        liderObservacoes: liderObs || null,
        blockComments: [
          {
            blockType: "valor_stellar",
            liderComentario: comments["valor_stellar"] ?? null,
            validadoPeloLider: validated["valor_stellar"] ?? false,
          },
          {
            blockType: "competencia_tecnica",
            liderComentario: comments["competencia_tecnica"] ?? null,
            validadoPeloLider: validated["competencia_tecnica"] ?? false,
          },
        ],
      });
      toast.success("PDI validado e finalizado!");
      onValidated();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao validar PDI.");
    }
  }

  const blocks: Array<{ blockType: "valor_stellar" | "competencia_tecnica"; label: string; competencia: string }> = [
    { blockType: "valor_stellar", label: "Valor Cultural Stellar", competencia: pdi.valorStellar ?? "" },
    { blockType: "competencia_tecnica", label: "Competência Técnica", competencia: pdi.competenciaTecnica ?? "" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
        <p className="text-sm text-purple-300">
          O colaborador preencheu o plano de ação. Revise cada bloco, adicione comentários e valide o PDI.
        </p>
      </div>

      {blocks.map(({ blockType, label, competencia }) => {
        const block = pdi.blocks?.find((b: any) => b.blockType === blockType);
        return (
          <Card key={blockType} className="bg-slate-800/40 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span>{label}: <span className="text-[#d9f22a]">{competencia}</span></span>
                {block?.preenchidoPeloColaborador && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Preenchido</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {block ? (
                <>
                  <div className="grid gap-3">
                    {[
                      { pct: "70%", value: block.acoes70, just: block.acoes70Justificativa, color: "text-[#d9f22a]" },
                      { pct: "20%", value: block.acoes20, color: "text-blue-400" },
                      { pct: "10%", value: block.acoes10, color: "text-purple-400" },
                    ].map(({ pct, value, just, color }) => (
                      <div key={pct} className="bg-slate-900/40 rounded p-3">
                        <p className={`text-xs font-bold ${color} mb-1`}>{pct}</p>
                        <p className="text-sm text-slate-200">{value || <span className="text-slate-500 italic">Não preenchido</span>}</p>
                        {just && <p className="text-xs text-slate-400 mt-1 italic">Justificativa: {just}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">Comentário do líder (opcional)</Label>
                    <Textarea
                      value={comments[blockType] ?? ""}
                      onChange={(e) => setComments((prev) => ({ ...prev, [blockType]: e.target.value }))}
                      placeholder="Adicione feedback ou orientações sobre este bloco..."
                      className="bg-slate-800/60 border-slate-700 text-white min-h-[60px] text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={validated[blockType] ?? false}
                      onChange={(e) => setValidated((prev) => ({ ...prev, [blockType]: e.target.checked }))}
                      className="w-4 h-4 accent-[#d9f22a]"
                    />
                    <span className="text-sm text-slate-300">Validar este bloco</span>
                  </label>
                </>
              ) : (
                <p className="text-sm text-slate-500 italic">Colaborador ainda não preencheu este bloco.</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="space-y-2">
        <Label className="text-white font-medium">Observações finais (opcional)</Label>
        <Textarea
          value={liderObs}
          onChange={(e) => setLiderObs(e.target.value)}
          placeholder="Mensagem geral para o colaborador sobre o PDI..."
          className="bg-slate-800/60 border-slate-700 text-white min-h-[80px] text-sm"
        />
      </div>

      <Button
        onClick={handleValidate}
        disabled={validate.isPending}
        className="w-full bg-[#d9f22a] text-black hover:bg-[#c8e020] font-semibold"
      >
        {validate.isPending ? "Finalizando..." : "Finalizar e Validar PDI"}
      </Button>
    </div>
  );
}

// ─── Employee View ────────────────────────────────────────────────────────────

interface EmployeeViewProps {
  cycleId: number;
  employeeId: number;
  quadrant?: string;
  jobTitle?: string;
  onRefresh: () => void;
}

function EmployeeView({ cycleId, employeeId, quadrant, jobTitle, onRefresh }: EmployeeViewProps) {
  const { data: pdiData, refetch } = trpc.pdi.getForEmployee.useQuery({ cycleId, employeeId });
  const [activeBlock, setActiveBlock] = useState<"valor_stellar" | "competencia_tecnica" | null>(null);

  if (!pdiData) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Seu PDI ainda não foi iniciado pelo seu líder.</p>
        <p className="text-xs text-slate-500 mt-1">Aguarde até que seu líder defina as competências a desenvolver.</p>
      </div>
    );
  }

  const isReadOnly = pdiData.status === "completed" || pdiData.status === "leader_validating";
  const valorBlock = pdiData.blocks?.find((b: any) => b.blockType === "valor_stellar");
  const tecBlock = pdiData.blocks?.find((b: any) => b.blockType === "competencia_tecnica");

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <StatusBadge status={pdiData.status} />
        {pdiData.status === "leader_validating" && (
          <p className="text-xs text-purple-400">Aguardando validação do seu líder</p>
        )}
        {pdiData.status === "completed" && (
          <p className="text-xs text-green-400">PDI finalizado e validado!</p>
        )}
      </div>

      {/* Competências definidas pelo líder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#d9f22a]/20 bg-[#d9f22a]/5 p-4">
          <p className="text-xs text-[#d9f22a] mb-1">Valor Cultural a Desenvolver</p>
          <p className="font-semibold text-white">{VALOR_LABELS[pdiData.valorStellar ?? ""] ?? pdiData.valorStellar ?? "—"}</p>
          {pdiData.valorEmpate && pdiData.valorEmpateJustificativa && (
            <p className="text-xs text-slate-400 mt-1 italic">Justificativa do líder: {pdiData.valorEmpateJustificativa}</p>
          )}
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-400 mb-1">Competência Técnica a Desenvolver</p>
          <p className="font-semibold text-white">{pdiData.competenciaTecnica ?? "—"}</p>
        </div>
      </div>

      {/* Blocks */}
      {(["valor_stellar", "competencia_tecnica"] as const).map((bt) => {
        const block = bt === "valor_stellar" ? valorBlock : tecBlock;
        const competencia = bt === "valor_stellar"
          ? (VALOR_LABELS[pdiData.valorStellar ?? ""] ?? pdiData.valorStellar ?? "")
          : (pdiData.competenciaTecnica ?? "");
        const isOpen = activeBlock === bt;
        const isFilled = block?.preenchidoPeloColaborador;

        return (
          <Card key={bt} className="bg-slate-800/40 border-slate-700">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => setActiveBlock(isOpen ? null : bt)}
            >
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {bt === "valor_stellar" ? <Target className="w-4 h-4 text-[#d9f22a]" /> : <BookOpen className="w-4 h-4 text-blue-400" />}
                  {bt === "valor_stellar" ? "Valor Cultural" : "Competência Técnica"}
                  <span className="text-slate-400 font-normal text-sm">— {competencia}</span>
                </span>
                <div className="flex items-center gap-2">
                  {isFilled ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Preenchido</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pendente</Badge>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {isOpen && (
              <CardContent>
                {pdiData.status === "leader_defined" || pdiData.status === "employee_filling" ? (
                  <BlockForm
                    blockType={bt}
                    competencia={competencia}
                    quadrant={quadrant}
                    jobTitle={jobTitle}
                    initialData={block}
                    pdiId={pdiData.id}
                    onSaved={() => { refetch(); onRefresh(); }}
                    readOnly={false}
                  />
                ) : (
                  <BlockForm
                    blockType={bt}
                    competencia={competencia}
                    quadrant={quadrant}
                    jobTitle={jobTitle}
                    initialData={block}
                    pdiId={pdiData.id}
                    onSaved={() => {}}
                    readOnly={true}
                  />
                )}

                {/* Leader comments on completed PDI */}
                {isReadOnly && block?.liderComentario && (
                  <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                    <p className="text-xs text-purple-400 mb-1">Comentário do líder</p>
                    <p className="text-sm text-slate-300">{block.liderComentario}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Leader final observations */}
      {pdiData.status === "completed" && pdiData.liderObservacoes && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs text-green-400 mb-1">Observações finais do líder</p>
          <p className="text-sm text-slate-300">{pdiData.liderObservacoes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main PDI Page ────────────────────────────────────────────────────────────

export default function PDI() {
  const { user } = useStellarAuth();
  const isGestor = user?.platformRole === "gestor" || user?.platformRole === "rh" || (user as any)?.secondaryPlatformRole === "gestor";
  const isColaborador = user?.platformRole === "colaborador" || (user?.platformRole === "gestor" && !isGestor);
  const showManagerView = isGestor;
  const showSelfView = !isGestor || user?.platformRole === "colaborador";

  const [activeTab, setActiveTab] = useState<"team" | "mine">(showManagerView ? "team" : "mine");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string; jobTitle?: string | null } | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [step, setStep] = useState<"list" | "step1" | "step2" | "step3">("list");

  const { data: cycles } = trpc.cycles.all.useQuery();
  const activeCycle = cycles?.find((c: any) => c.status === "open") ?? cycles?.[0];
  const cycleId = selectedCycleId ?? activeCycle?.id ?? 0;

  const { data: teamPdis, refetch: refetchTeam } = trpc.pdi.listForManager.useQuery(
    { cycleId },
    { enabled: showManagerView && cycleId > 0 }
  );

  const { data: myEmployee } = trpc.employees.myProfile.useQuery(undefined, { enabled: !showManagerView || activeTab === "mine" });
  const myEmployeeId = myEmployee?.id;

  const { data: myPdi, refetch: refetchMyPdi } = trpc.pdi.getForEmployee.useQuery(
    { cycleId, employeeId: myEmployeeId },
    { enabled: !!myEmployeeId && cycleId > 0 }
  );

  const { data: myNinebox } = trpc.ninebox.myPosition.useQuery(
    { cycleId },
    { enabled: cycleId > 0 }
  );

  const { data: allEmployees } = trpc.employees.all.useQuery(undefined, { enabled: showManagerView });
  const { data: allNineboxPositions } = trpc.ninebox.allPositions.useQuery(
    { cycleId },
    { enabled: showManagerView && cycleId > 0 }
  );
  const { data: allManagerEvals } = trpc.managerEvaluation.teamEvaluations.useQuery(
    { cycleId },
    { enabled: showManagerView && cycleId > 0 }
  );

  // Get direct reports that are Talents (Q6/Q8/Q9) or Critical (Q1/Q2/Q4)
  const MANDATORY_QUADRANTS = ["Q1", "Q2", "Q4", "Q6", "Q8", "Q9"];

  const directReports = useMemo(() => {
    if (!allEmployees || !myEmployee) return [];
    return allEmployees.filter((e: any) => e.managerId === myEmployee.id);
  }, [allEmployees, myEmployee]);

  const mandatoryEmployees = useMemo(() => {
    if (!directReports.length || !allNineboxPositions) return directReports;
    return directReports.filter((e: any) => {
      const pos = allNineboxPositions.find((p: any) => p.employeeId === e.id);
      return pos && MANDATORY_QUADRANTS.includes(pos.quadrant);
    });
  }, [directReports, allNineboxPositions]);

  const otherEmployees = useMemo(() => {
    const mandatoryIds = new Set(mandatoryEmployees.map((e: any) => e.id));
    return directReports.filter((e: any) => !mandatoryIds.has(e.id));
  }, [directReports, mandatoryEmployees]);

  function getPdiForEmp(empId: number) {
    return teamPdis?.find((p: any) => p.employeeId === empId);
  }

  function getNineboxForEmp(empId: number) {
    return allNineboxPositions?.find((p: any) => p.employeeId === empId);
  }

  function getManagerEvalForEmp(empId: number) {
    return allManagerEvals?.find((e: any) => e.employeeId === empId);
  }

  function handleSelectEmployee(emp: { id: number; name: string; jobTitle?: string | null }) {
    setSelectedEmployee(emp);
    const pdi = getPdiForEmp(emp.id);
    if (!pdi) {
      setStep("step1");
    } else if (pdi.status === "leader_defined" || pdi.status === "employee_filling") {
      setStep("step2");
    } else if (pdi.status === "leader_validating") {
      setStep("step3");
    } else {
      setStep("step2");
    }
  }

  function renderEmployeeRow(emp: any, isMandatory: boolean) {
    const pdi = getPdiForEmp(emp.id);
    const nb = getNineboxForEmp(emp.id);
    const quadrantInfo = nb?.quadrant ? NINEBOX_QUADRANTS[nb.quadrant as keyof typeof NINEBOX_QUADRANTS] : null;

    return (
      <button
        key={emp.id}
        onClick={() => handleSelectEmployee(emp)}
        className="w-full text-left rounded-lg border border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60 p-4 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{emp.name}</p>
              <p className="text-xs text-slate-400">{emp.jobTitle ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMandatory && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Obrigatório</Badge>
            )}
            {quadrantInfo && (
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: quadrantInfo.color }}
              >
                {nb?.quadrant}
              </div>
            )}
            <StatusBadge status={pdi?.status} />
          </div>
        </div>
      </button>
    );
  }

  // ── Render detail view ──
  if (selectedEmployee && step !== "list") {
    const pdi = getPdiForEmp(selectedEmployee.id);
    const nb = getNineboxForEmp(selectedEmployee.id);
    const managerEval = getManagerEvalForEmp(selectedEmployee.id);

    return (
      <StellarLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedEmployee(null); setStep("list"); refetchTeam(); }}
              className="text-slate-400 hover:text-white gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">PDI — {selectedEmployee.name}</h1>
            <p className="text-slate-400 text-sm mt-1">Plano de Desenvolvimento Individual · Metodologia 70/20/10</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[
              { id: "step1", label: "1. Líder define", desc: "Valor + Competência" },
              { id: "step2", label: "2. Colaborador preenche", desc: "Plano 70/20/10" },
              { id: "step3", label: "3. Líder valida", desc: "Revisão final" },
            ].map((s, i) => {
              const isActive = step === s.id;
              const isDone =
                (s.id === "step1" && (pdi?.status === "leader_defined" || pdi?.status === "employee_filling" || pdi?.status === "leader_validating" || pdi?.status === "completed")) ||
                (s.id === "step2" && (pdi?.status === "leader_validating" || pdi?.status === "completed")) ||
                (s.id === "step3" && pdi?.status === "completed");
              return (
                <div key={s.id} className={`flex-1 rounded-lg p-3 border ${isActive ? "border-[#d9f22a] bg-[#d9f22a]/10" : isDone ? "border-green-500/30 bg-green-500/5" : "border-slate-700 bg-slate-800/40"}`}>
                  <p className={`text-xs font-semibold ${isActive ? "text-[#d9f22a]" : isDone ? "text-green-400" : "text-slate-500"}`}>{s.label}</p>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <Card className="bg-slate-800/40 border-slate-700">
            <CardContent className="pt-6">
              {step === "step1" && (
                <LeaderStep1
                  employee={selectedEmployee}
                  cycleId={cycleId}
                  existingPdi={pdi}
                  managerEval={managerEval}
                  nineboxPos={nb}
                  onDefined={() => { refetchTeam(); setStep("step2"); }}
                />
              )}
              {step === "step2" && pdi && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="text-sm text-blue-300">
                      Aguardando o colaborador preencher o plano de ação. Você pode visualizar o progresso abaixo.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[#d9f22a]/20 bg-[#d9f22a]/5 p-3">
                      <p className="text-xs text-[#d9f22a]">Valor a Desenvolver</p>
                      <p className="font-semibold text-white text-sm mt-1">{VALOR_LABELS[pdi.valorStellar ?? ""] ?? pdi.valorStellar}</p>
                    </div>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                      <p className="text-xs text-blue-400">Competência Técnica</p>
                      <p className="font-semibold text-white text-sm mt-1">{pdi.competenciaTecnica}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep("step1")}
                      className="border-slate-700 text-slate-300"
                    >
                      Editar definições
                    </Button>
                    {pdi.status === "leader_validating" && (
                      <Button
                        size="sm"
                        onClick={() => setStep("step3")}
                        className="bg-[#d9f22a] text-black hover:bg-[#c8e020]"
                      >
                        Ir para validação
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {step === "step3" && pdi && (
                <LeaderStep3
                  pdi={pdi}
                  onValidated={() => { refetchTeam(); setStep("list"); setSelectedEmployee(null); }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </StellarLayout>
    );
  }

  // ── Main list view ──
  return (
    <StellarLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#d9f22a]" />
            PDI — Plano de Desenvolvimento Individual
          </h1>
          <p className="text-slate-400 text-sm mt-1">Metodologia 70/20/10 · Obrigatório para Talentos e Críticos</p>
        </div>

        {/* Cycle selector */}
        {cycles && cycles.length > 1 && (
          <div className="flex items-center gap-2">
            <Label className="text-slate-400 text-sm">Ciclo:</Label>
            <select
              value={cycleId}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1.5 text-sm"
            >
              {cycles.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        {showManagerView && (
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "team" ? "border-[#d9f22a] text-[#d9f22a]" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Gestão do Time
            </button>
            <button
              onClick={() => setActiveTab("mine")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "mine" ? "border-[#d9f22a] text-[#d9f22a]" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Meu PDI
            </button>
          </div>
        )}

        {/* Team view */}
        {activeTab === "team" && showManagerView && (
          <div className="space-y-6">
            {/* Methodology reminder */}
            <div className="rounded-lg border border-[#d9f22a]/20 bg-[#d9f22a]/5 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#d9f22a] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#d9f22a] mb-1">Metodologia 70/20/10</p>
                  <p className="text-xs text-slate-300">
                    <strong className="text-[#d9f22a]">70%</strong> Prática no trabalho (projetos, desafios, responsabilidades novas) ·{" "}
                    <strong className="text-blue-400">20%</strong> Aprendizado social (mentoria, shadowing, feedback) ·{" "}
                    <strong className="text-purple-400">10%</strong> Aprendizado formal (cursos, livros, certificações)
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory employees */}
            {mandatoryEmployees.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  PDI Obrigatório — Talentos (Q6/Q8/Q9) e Críticos (Q1/Q2/Q4)
                </h2>
                <div className="space-y-2">
                  {mandatoryEmployees.map((emp: any) => renderEmployeeRow(emp, true))}
                </div>
              </div>
            )}

            {/* Other employees */}
            {otherEmployees.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-400">Demais Liderados (PDI opcional)</h2>
                <div className="space-y-2">
                  {otherEmployees.map((emp: any) => renderEmployeeRow(emp, false))}
                </div>
              </div>
            )}

            {directReports.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum liderado encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* My PDI view */}
        {(activeTab === "mine" || !showManagerView) && (
          <div className="space-y-4">
            {myEmployeeId && cycleId > 0 ? (
              <EmployeeView
                cycleId={cycleId}
                employeeId={myEmployeeId}
                quadrant={myNinebox?.quadrant}
                jobTitle={myEmployee?.jobTitle ?? undefined}
                onRefresh={refetchMyPdi}
              />
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Carregando seu PDI...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </StellarLayout>
  );
}
