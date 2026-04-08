import { useMemo } from "react";
import { useLocation } from "wouter";
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

// ─── FASES DO CICLO COM DATAS ─────────────────────────────────────────────────

const FASES_CICLO = [
  {
    id: 1,
    titulo: "Contratação de Metas",
    curto: "Metas",
    icone: Target,
    inicio: new Date("2026-01-01"),
    fim: new Date("2026-03-31"),
    cor: "#1840eb",
  },
  {
    id: 2,
    titulo: "Autoavaliação",
    curto: "Autoavaliação",
    icone: ClipboardList,
    inicio: new Date("2026-07-01"),
    fim: new Date("2026-07-15"),
    cor: "#d9f22a",
  },
  {
    id: 3,
    titulo: "Avaliação do Líder",
    curto: "Avaliação",
    icone: UserCheck,
    inicio: new Date("2026-07-16"),
    fim: new Date("2026-07-31"),
    cor: "#a855f7",
  },
  {
    id: 4,
    titulo: "Pré-Calibração",
    curto: "Pré-Calib.",
    icone: Users,
    inicio: new Date("2026-08-01"),
    fim: new Date("2026-08-15"),
    cor: "#f97316",
  },
  {
    id: 5,
    titulo: "Calibração Coletiva",
    curto: "Calibração",
    icone: BarChart3,
    inicio: new Date("2026-08-16"),
    fim: new Date("2026-08-31"),
    cor: "#22c55e",
  },
  {
    id: 6,
    titulo: "Gestão de Consequências",
    curto: "Consequências",
    icone: Award,
    inicio: new Date("2026-09-01"),
    fim: new Date("2026-09-30"),
    cor: "#eab308",
  },
  {
    id: 7,
    titulo: "Flash Feedbacks",
    curto: "Feedbacks",
    icone: Zap,
    inicio: new Date("2026-01-01"),
    fim: new Date("2026-12-31"),
    cor: "#d9f22a",
  },
];

function getDaysRemaining(fim: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const end = new Date(fim);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getFaseAtual() {
  const hoje = new Date();
  // Find the current active phase (not Flash Feedbacks which is always active)
  const faseAtiva = FASES_CICLO.filter((f) => f.id !== 7).find(
    (f) => hoje >= f.inicio && hoje <= f.fim
  );
  if (faseAtiva) return faseAtiva;

  // If between phases, return the next upcoming phase
  const proxima = FASES_CICLO.filter((f) => f.id !== 7).find(
    (f) => hoje < f.inicio
  );
  if (proxima) return proxima;

  // Default to last phase if all passed
  return FASES_CICLO[5];
}

function getPhaseStatus(fase: typeof FASES_CICLO[0]) {
  const hoje = new Date();
  if (fase.id === 7) return "continuous"; // Flash Feedbacks always active
  if (hoje > fase.fim) return "done";
  if (hoje >= fase.inicio && hoje <= fase.fim) return "active";
  return "upcoming";
}

interface CycleProgressBarProps {
  compact?: boolean;
}

export default function CycleProgressBar({ compact = false }: CycleProgressBarProps) {
  const [, navigate] = useLocation();
  const faseAtual = useMemo(() => getFaseAtual(), []);
  const diasRestantes = useMemo(() => getDaysRemaining(faseAtual.fim), [faseAtual]);

  const fasesMain = FASES_CICLO.filter((f) => f.id !== 7); // exclude Flash Feedbacks from timeline

  if (compact) {
    // Compact version: just a slim banner
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
            Fase {faseAtual.id}: {faseAtual.titulo}
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
              Ciclo S1/2026 — Progresso
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "#fdffdf" }}>
              Fase {faseAtual.id} em andamento:{" "}
              <span style={{ color: faseAtual.cor }}>{faseAtual.titulo}</span>
            </p>
          </div>
        </div>

        {/* Days remaining badge */}
        <div
          className="flex flex-col items-end flex-shrink-0"
        >
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
        {/* Progress track */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-5 right-5 h-px"
            style={{ backgroundColor: "#0a3060" }}
          />

          {/* Phases */}
          <div className="relative flex justify-between">
            {fasesMain.map((fase) => {
              const status = getPhaseStatus(fase);
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
                    {/* Active pulse ring */}
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
                      <p
                        className="text-xs mt-0.5 font-bold"
                        style={{ color: `${fase.cor}aa` }}
                      >
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
            <span style={{ color: "#d9f22a" }} className="font-semibold">Flash Feedbacks</span>
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
          Encerramento do ciclo: 30/09/2026
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
