import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Target,
  ClipboardList,
  UserCheck,
  Users,
  BarChart3,
  Award,
  Zap,
  ChevronRight,
} from "lucide-react";

// ─── PHASE ICONS & COLORS ────────────────────────────────────────────────────

const PHASE_ICONS = [Target, ClipboardList, UserCheck, Users, BarChart3, Award, Zap];
const PHASE_COLORS = ["#1840eb", "#d9f22a", "#a855f7", "#f97316", "#22c55e", "#eab308", "#d9f22a"];
const PHASE_CURTO = [
  "Metas",
  "Autoavaliação",
  "Avaliação",
  "Pré-Calib.",
  "Calibração",
  "Consequências",
  "Feedbacks",
];

function getDaysRemaining(fim: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const end = new Date(fim);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getPhaseStatus(inicio: Date, fim: Date, isContinuous: boolean) {
  if (isContinuous) return "continuous";
  const hoje = new Date();
  if (hoje > fim) return "done";
  if (hoje >= inicio && hoje <= fim) return "active";
  return "upcoming";
}

interface CycleProgressBarProps {
  compact?: boolean;
}

export default function CycleProgressBar({ compact = false }: CycleProgressBarProps) {
  const [, navigate] = useLocation();

  const { data: activeCycle } = trpc.cycles.active.useQuery();
  const { data: dbPhases } = trpc.cyclePhases.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle?.id }
  );

  // Build enriched phases from DB data (or empty if not loaded yet)
  const phases = useMemo(() => {
    if (!dbPhases || dbPhases.length === 0) return [];
    return dbPhases.map((p) => ({
      id: p.id,
      phaseNumber: p.phaseNumber,
      titulo: p.titulo,
      curto: PHASE_CURTO[p.phaseNumber - 1] ?? p.titulo,
      icone: PHASE_ICONS[p.phaseNumber - 1] ?? Zap,
      inicio: new Date(p.startDate),
      fim: new Date(p.endDate),
      cor: PHASE_COLORS[p.phaseNumber - 1] ?? "#8aa3c0",
      isContinuous: p.isContinuous,
    }));
  }, [dbPhases]);

  const faseAtual = useMemo(() => {
    if (phases.length === 0) return null;
    const hoje = new Date();
    // Find current active non-continuous phase
    const ativa = phases.filter((f) => !f.isContinuous).find(
      (f) => hoje >= f.inicio && hoje <= f.fim
    );
    if (ativa) return ativa;
    // Next upcoming
    const proxima = phases.filter((f) => !f.isContinuous).find((f) => hoje < f.inicio);
    if (proxima) return proxima;
    // Last phase
    const nonContinuous = phases.filter((f) => !f.isContinuous);
    return nonContinuous[nonContinuous.length - 1] ?? null;
  }, [phases]);

  const diasRestantes = useMemo(
    () => (faseAtual ? getDaysRemaining(faseAtual.fim) : 0),
    [faseAtual]
  );

  const fasesMain = phases.filter((f) => !f.isContinuous);
  const flashFeedbackPhase = phases.find((f) => f.isContinuous);

  // Loading state
  if (!faseAtual || fasesMain.length === 0) {
    if (compact) {
      return (
        <div
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#001830", border: "1px solid #0a3060" }}
        >
          <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
          <span className="text-xs" style={{ color: "#4a6a8a" }}>Carregando ciclo...</span>
        </div>
      );
    }
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ backgroundColor: "#001830", border: "1px solid #0a3060" }}
      >
        <p className="text-sm" style={{ color: "#4a6a8a" }}>Carregando dados do ciclo...</p>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => navigate("/ciclo")}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group"
        style={{
          backgroundColor: "#001830",
          border: `1px solid ${faseAtual.cor}30`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${faseAtual.cor}60`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${faseAtual.cor}30`;
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: faseAtual.cor }}
          />
          <span className="text-xs font-semibold" style={{ color: faseAtual.cor }}>
            Fase {faseAtual.phaseNumber}: {faseAtual.titulo}
          </span>
          <span className="text-xs" style={{ color: "#8aa3c0" }}>
            {diasRestantes > 0
              ? `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} restante${diasRestantes !== 1 ? "s" : ""}`
              : diasRestantes === 0
              ? "Encerra hoje"
              : "Fase encerrada"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "#8aa3c0" }}>
          Ver ciclo completo
          <ChevronRight size={12} />
        </div>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#001830", border: "1px solid #0a3060" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "#0a3060" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: faseAtual.cor }}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8aa3c0" }}>
              {activeCycle?.name ?? "Ciclo"} — Progresso
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "#fdffdf" }}>
              Fase {faseAtual.phaseNumber} em andamento:{" "}
              <span style={{ color: faseAtual.cor }}>{faseAtual.titulo}</span>
            </p>
          </div>
        </div>

        {/* Days remaining badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div
            className="px-3 py-1.5 rounded-xl text-center"
            style={{
              backgroundColor: `${faseAtual.cor}15`,
              border: `1px solid ${faseAtual.cor}40`,
            }}
          >
            {diasRestantes > 0 ? (
              <>
                <p className="text-xl font-black leading-none" style={{ color: faseAtual.cor }}>
                  {diasRestantes}
                </p>
                <p className="text-xs mt-0.5" style={{ color: faseAtual.cor + "aa" }}>
                  {diasRestantes === 1 ? "dia restante" : "dias restantes"}
                </p>
              </>
            ) : diasRestantes === 0 ? (
              <p className="text-sm font-bold" style={{ color: faseAtual.cor }}>Encerra hoje</p>
            ) : (
              <p className="text-sm font-bold" style={{ color: "#8aa3c0" }}>Fase encerrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="px-5 py-4">
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-5 right-5 h-px"
            style={{ backgroundColor: "#0a3060" }}
          />

          {/* Phases */}
          <div className="relative flex justify-between">
            {fasesMain.map((fase) => {
              const status = getPhaseStatus(fase.inicio, fase.fim, false);
              const Icon = fase.icone;
              const isActive = status === "active" || (status === "upcoming" && fase.id === faseAtual.id);
              const isDone = status === "done";

              return (
                <button
                  key={fase.id}
                  onClick={() => navigate("/ciclo")}
                  className="flex flex-col items-center gap-2 group transition-all"
                  style={{ minWidth: 0 }}
                  title={fase.titulo}
                >
                  {/* Icon circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10"
                    style={{
                      backgroundColor: isActive
                        ? `${fase.cor}20`
                        : isDone
                        ? `${fase.cor}10`
                        : "#001023",
                      borderColor: isActive
                        ? fase.cor
                        : isDone
                        ? `${fase.cor}60`
                        : "#0a3060",
                      boxShadow: isActive ? `0 0 12px ${fase.cor}40` : "none",
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: isActive ? fase.cor : isDone ? `${fase.cor}80` : "#4a6a8a",
                      }}
                    />
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: fase.cor }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center" style={{ maxWidth: "72px" }}>
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{
                        color: isActive ? fase.cor : isDone ? "#8aa3c0" : "#4a6a8a",
                      }}
                    >
                      {fase.curto}
                    </p>
                    {isActive && (
                      <p className="text-xs mt-0.5 font-bold" style={{ color: `${fase.cor}aa` }}>
                        Atual
                      </p>
                    )}
                    {isDone && (
                      <p className="text-xs mt-0.5" style={{ color: "#4a6a8a" }}>
                        Concluída
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flash Feedbacks continuous badge */}
        <div
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: "#001023", border: "1px solid #d9f22a20" }}
        >
          <Zap size={12} style={{ color: "#d9f22a" }} />
          <p className="text-xs" style={{ color: "#8aa3c0" }}>
            <span style={{ color: "#d9f22a" }} className="font-semibold">
              {flashFeedbackPhase?.titulo ?? "Flash Feedbacks"}
            </span>
            {" "}— contínuos durante todo o semestre
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="px-5 py-3 border-t flex items-center justify-between"
        style={{ borderColor: "#0a3060" }}
      >
        <p className="text-xs" style={{ color: "#4a6a8a" }}>
          {activeCycle
            ? `Encerramento do ciclo: ${new Date(activeCycle.endDate).toLocaleDateString("pt-BR")}`
            : "Ciclo S1/2026"}
        </p>
        <button
          onClick={() => navigate("/ciclo")}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: "#8aa3c0" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
        >
          Ver detalhes do ciclo
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
