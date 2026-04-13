import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { Bell, CheckCircle, Clock, AlertTriangle, Zap, ClipboardList, Download, Grid3x3, FileText, Users, ChevronRight, Award, TrendingUp, TrendingDown, X } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CycleProgressBar from "@/components/CycleProgressBar";
import { useState, useMemo } from "react";
import { NINEBOX_QUADRANTS, STELLAR_EXPECTED_CURVE, calculateCurveDistribution } from "@shared/nineboxData";
import type { NineboxQuadrant } from "@shared/nineboxData";

// ─── Mini 9-Box grid ─────────────────────────────────────────────────────────
const NINEBOX_LAYOUT = [
  ["Q7", "Q8", "Q9"],
  ["Q4", "Q5", "Q6"],
  ["Q1", "Q2", "Q3"],
];

const QUADRANT_COLORS: Record<string, string> = {
  Q9: "#22c55e", Q8: "#22c55e", Q7: "#22c55e",
  Q6: "#d9f22a", Q5: "#d9f22a", Q4: "#d9f22a",
  Q3: "#f59e0b", Q2: "#f59e0b", Q1: "#ef4444",
};

const QUADRANT_BG: Record<string, string> = {
  Q9: "#22c55e12", Q8: "#22c55e0c", Q7: "#22c55e0c",
  Q6: "#d9f22a10", Q5: "#d9f22a0c", Q4: "#d9f22a0c",
  Q3: "#f59e0b10", Q2: "#f59e0b0c", Q1: "#ef444412",
};

function MiniNineBox({
  positions,
  selectedQ,
  onSelectQ,
  consequenceByQuadrant,
}: {
  positions: { quadrant: string; employeeName?: string; employeeId?: number }[];
  selectedQ?: string | null;
  onSelectQ?: (q: string | null) => void;
  consequenceByQuadrant?: Record<string, { merito: number; promocao: number; desligamento: number; plano_recuperacao: number; total: number }>;
}) {
  const countByQ = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of positions) {
      if (p.quadrant) map[p.quadrant] = (map[p.quadrant] ?? 0) + 1;
    }
    return map;
  }, [positions]);

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {NINEBOX_LAYOUT.map((row) =>
        row.map((q) => {
          const count = countByQ[q] ?? 0;
          const isSelected = selectedQ === q;
          const consq = consequenceByQuadrant?.[q];
          return (
            <button
              key={q}
              onClick={() => onSelectQ?.(isSelected ? null : q)}
              className="rounded-lg p-2 flex flex-col items-start justify-between text-left transition-all"
              style={{
                backgroundColor: isSelected ? QUADRANT_COLORS[q] + "25" : count > 0 ? QUADRANT_BG[q] : "#001023",
                border: `1px solid ${isSelected ? QUADRANT_COLORS[q] : count > 0 ? QUADRANT_COLORS[q] + "30" : "#0a3060"}`,
                minHeight: "60px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold" style={{ color: QUADRANT_COLORS[q], opacity: count > 0 ? 1 : 0.4 }}>
                  {q}
                </span>
                {consq && consq.total > 0 && (
                  <span
                    className="text-xs font-bold px-1 py-0.5 rounded"
                    style={{ backgroundColor: QUADRANT_COLORS[q] + "30", color: QUADRANT_COLORS[q], fontSize: "9px" }}
                    title={`${consq.merito} méritos, ${consq.promocao} promoções, ${consq.desligamento} desligamentos, ${consq.plano_recuperacao} planos`}
                  >
                    {consq.total} ações
                  </span>
                )}
              </div>
              <span
                className="text-xl font-black leading-none"
                style={{ color: count > 0 ? QUADRANT_COLORS[q] : "#2a4a6b" }}
              >
                {count}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = "#fdffdf",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border flex flex-col gap-2"
      style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8aa3c0" }}>
        {label}
      </p>
      <p className="text-4xl font-black leading-none" style={{ color, fontFamily: "Space Grotesk" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#8aa3c0" }}>{sub}</p>}
    </div>
  );
}

// ─── Dashboard for Gestor / RH ───────────────────────────────────────────────
function ManagerDashboard({ isRH }: { isRH: boolean }) {
  const { data: cycle } = trpc.cycles.active.useQuery();
  const cycleId = cycle?.id ?? 0;
  const [selectedQ, setSelectedQ] = useState<string | null>(null);

  const { data: teamPositions } = isRH
    ? trpc.ninebox.allPositions.useQuery({ cycleId: cycleId || 0 }, { enabled: cycleId > 0 })
    : trpc.ninebox.teamPositions.useQuery({ cycleId: cycleId || 0 }, { enabled: cycleId > 0 });

  const { data: flashFeedbacks } = isRH
    ? trpc.flashFeedback.allFeedbacks.useQuery()
    : trpc.flashFeedback.teamFeedbacks.useQuery();

  const { data: allEmployees } = isRH
    ? trpc.employees.allWithManager.useQuery()
    : trpc.employees.directReports.useQuery();

  // RH only: post-calibration positions and consequences
  const { data: allConsequences } = trpc.calibration.allConsequences.useQuery(
    { cycleId: cycleId || undefined },
    { enabled: isRH && cycleId > 0 }
  );

  const positions = teamPositions ?? [];
  const feedbacks = flashFeedbacks ?? [];
  const employees = allEmployees ?? [];

  // Metrics
  const total = employees.length;
  const talentos = positions.filter((p) => ["Q7", "Q8", "Q9"].includes(p.quadrant)).length;
  const zonaCritica = positions.filter((p) => ["Q1", "Q2", "Q3"].includes(p.quadrant)).length;
  const ffAtrasados = feedbacks.filter((f) => f.status === "overdue").length;
  const ffRealizados = feedbacks.filter((f) => f.status === "completed").length;
  const ffPendentes = feedbacks.filter((f) => f.status === "scheduled").length;
  const talentosPct = total > 0 ? Math.round((talentos / total) * 100) : 0;

  // Flash feedbacks with overdue first, then scheduled
  const ffHighlight = feedbacks
    .filter((f) => f.status === "overdue" || f.status === "scheduled")
    .sort((a, b) => (a.status === "overdue" ? -1 : 1))
    .slice(0, 3);

  // Enrich with employee name
  const employeeMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const e of employees) m[(e as any).id] = (e as any).name;
    return m;
  }, [employees]);

  // Ninebox positions with names
  const positionsWithNames = positions.map((p) => ({
    ...p,
    employeeName: employeeMap[p.employeeId] ?? "?",
  }));

  // People in selected quadrant
  const peopleInSelectedQ = useMemo(() => {
    if (!selectedQ) return [];
    return positionsWithNames.filter((p) => p.quadrant === selectedQ);
  }, [positionsWithNames, selectedQ]);

  // Curve calculations (RH only)
  // Pre-calibration: positions NOT manually adjusted (automatic calculation)
  const preCurve = useMemo(() => {
    const qs = positions
      .filter((p) => !(p as any).isManuallyAdjusted)
      .map((p) => p.quadrant as NineboxQuadrant)
      .filter(Boolean);
    // If no pre-calibration positions exist, use all positions as baseline
    const allQs = positions.map((p) => p.quadrant as NineboxQuadrant).filter(Boolean);
    return calculateCurveDistribution(qs.length > 0 ? qs : allQs);
  }, [positions]);
  // Post-calibration: positions manually adjusted by RH in calibration
  const postCurve = useMemo(() => {
    const adjustedPositions = positions.filter((p) => (p as any).isManuallyAdjusted);
    if (adjustedPositions.length === 0) return null;
    const qs = adjustedPositions.map((p) => p.quadrant as NineboxQuadrant).filter(Boolean);
    return calculateCurveDistribution(qs);
  }, [positions]);

  // Consequence summary (RH only)
  const consequenceSummary = useMemo(() => {
    const cons = allConsequences ?? [];
    return {
      merito: cons.filter((c) => c.consequence === "merito").length,
      promocao: cons.filter((c) => c.consequence === "promocao").length,
      desligamento: cons.filter((c) => c.consequence === "desligamento").length,
      plano_recuperacao: cons.filter((c) => c.consequence === "plano_recuperacao").length,
      total: cons.filter((c) => c.consequence !== "nenhuma").length,
    };
  }, [allConsequences]);

  // Consequence by group (talentos Q7-Q9, mantenedores Q4-Q6, criticos Q1-Q3)
  const consequenceByGroup = useMemo(() => {
    const cons = allConsequences ?? [];
    const posMap = new Map<number, string>();
    for (const p of positions) posMap.set(p.employeeId, p.quadrant);
    const talentos = cons.filter((c) => ["Q7","Q8","Q9"].includes(posMap.get(c.employeeId) ?? "") && c.consequence !== "nenhuma");
    const mantenedores = cons.filter((c) => ["Q4","Q5","Q6"].includes(posMap.get(c.employeeId) ?? "") && c.consequence !== "nenhuma");
    const criticos = cons.filter((c) => ["Q1","Q2","Q3"].includes(posMap.get(c.employeeId) ?? "") && c.consequence !== "nenhuma");
    const groupStats = (list: typeof cons) => ({
      total: list.length,
      merito: list.filter((c) => c.consequence === "merito").length,
      promocao: list.filter((c) => c.consequence === "promocao").length,
      desligamento: list.filter((c) => c.consequence === "desligamento").length,
      plano_recuperacao: list.filter((c) => c.consequence === "plano_recuperacao").length,
    });
    return {
      talentos: groupStats(talentos),
      mantenedores: groupStats(mantenedores),
      criticos: groupStats(criticos),
    };
  }, [allConsequences, positions]);

  // Consequence count by quadrant
  const consequenceByQuadrant = useMemo(() => {
    const cons = allConsequences ?? [];
    const posMap = new Map<number, string>();
    for (const p of positions) posMap.set(p.employeeId, p.quadrant);
    const map: Record<string, { merito: number; promocao: number; desligamento: number; plano_recuperacao: number; total: number }> = {};
    for (const c of cons) {
      const q = posMap.get(c.employeeId);
      if (!q || c.consequence === "nenhuma") continue;
      if (!map[q]) map[q] = { merito: 0, promocao: 0, desligamento: 0, plano_recuperacao: 0, total: 0 };
      map[q][c.consequence as keyof typeof map[string]]++;
      map[q].total++;
    }
    return map;
  }, [allConsequences, positions]);

  return (
    <div className="space-y-5">
      {/* Cycle + title */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8aa3c0" }}>
          {cycle ? `${cycle.name} · ${isRH ? "Empresa" : "Time"}` : "Sem ciclo ativo"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={total} sub={isRH ? "colaboradores" : "no time"} />
        <StatCard
          label="Talentos"
          value={talentos}
          sub={`${talentosPct}% ${isRH ? "da empresa" : "do time"}`}
          color="#22c55e"
        />
        <StatCard
          label="Zona Crítica"
          value={zonaCritica}
          sub="ação necessária"
          color={zonaCritica > 0 ? "#ef4444" : "#fdffdf"}
        />
        <StatCard
          label="FF Atrasados"
          value={ffAtrasados}
          sub={`${ffPendentes} pendentes`}
          color={ffAtrasados > 0 ? "#ef4444" : "#fdffdf"}
        />
      </div>

      {/* 9-Box mini + Flash Feedbacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 9-Box mini */}
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>
                9-Box {isRH ? "da Empresa" : "do Time"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>
                {positions.length} colaboradores posicionados
                {selectedQ && <span style={{ color: QUADRANT_COLORS[selectedQ] }}> · {selectedQ} selecionado</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedQ && (
                <button
                  onClick={() => setSelectedQ(null)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#8aa3c0" }}
                >
                  <X size={12} />
                </button>
              )}
              <Link href="/9box">
                <button
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#8aa3c0" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
                >
                  Ver completo
                </button>
              </Link>
            </div>
          </div>
          {positions.length === 0 ? (
            <div className="flex items-center justify-center h-32 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
              <p className="text-xs" style={{ color: "#4a7ab5" }}>Nenhum posicionamento ainda</p>
            </div>
          ) : (
            <>
              <MiniNineBox positions={positionsWithNames} selectedQ={selectedQ} onSelectQ={setSelectedQ} consequenceByQuadrant={isRH ? consequenceByQuadrant : undefined} />
              {selectedQ && peopleInSelectedQ.length > 0 && (
                <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${QUADRANT_COLORS[selectedQ]}30` }}>
                  <div className="px-3 py-2" style={{ backgroundColor: QUADRANT_COLORS[selectedQ] + "15" }}>
                    <p className="text-xs font-bold" style={{ color: QUADRANT_COLORS[selectedQ] }}>
                      {NINEBOX_QUADRANTS[selectedQ as NineboxQuadrant]?.name ?? selectedQ} · {peopleInSelectedQ.length} {peopleInSelectedQ.length === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                  <div className="divide-y divide-[#0a3060]">
                    {peopleInSelectedQ.map((p) => (
                      <div key={p.employeeId} className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: "#001023" }}>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ backgroundColor: QUADRANT_COLORS[selectedQ] + "20", color: QUADRANT_COLORS[selectedQ] }}
                        >
                          {(p.employeeName ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <p className="text-sm" style={{ color: "#fdffdf" }}>{p.employeeName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Flash Feedbacks */}
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: "#d9f22a" }} />
                <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>Flash Feedbacks</p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>Realizados vs pendentes</p>
            </div>
            <Link href="/flash-feedback">
              <button
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#8aa3c0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
              >
                Ver todos
              </button>
            </Link>
          </div>

          {/* FF counters */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8aa3c0" }}>Realizados</p>
              <p className="text-2xl font-black" style={{ color: "#22c55e", fontFamily: "Space Grotesk" }}>{ffRealizados}</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8aa3c0" }}>Pendentes</p>
              <p className="text-2xl font-black" style={{ color: "#f59e0b", fontFamily: "Space Grotesk" }}>{ffPendentes}</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8aa3c0" }}>Atrasados</p>
              <p className="text-2xl font-black" style={{ color: ffAtrasados > 0 ? "#ef4444" : "#fdffdf", fontFamily: "Space Grotesk" }}>{ffAtrasados}</p>
            </div>
          </div>

          {/* Highlight items */}
          <div className="space-y-2">
            {ffHighlight.length === 0 ? (
              <div className="flex items-center justify-center h-12 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                <p className="text-xs" style={{ color: "#4a7ab5" }}>Nenhum feedback pendente</p>
              </div>
            ) : (
              ffHighlight.map((ff) => {
                const isOverdue = ff.status === "overdue";
                const otherPersonId = (ff as any).requesterId === (ff as any).receiverId
                  ? (ff as any).receiverId
                  : (ff as any).requesterId;
                const name = employeeMap[(ff as any).receiverId] ?? employeeMap[(ff as any).requesterId] ?? "Colaborador";
                const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div
                    key={ff.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      backgroundColor: isOverdue ? "#ef444408" : "#001023",
                      border: `1px solid ${isOverdue ? "#ef444430" : "#0a3060"}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: isOverdue ? "#ef444420" : "#0a3060", color: isOverdue ? "#ef4444" : "#8aa3c0" }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#fdffdf" }}>{name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: isOverdue ? "#ef444420" : "#f59e0b20",
                            color: isOverdue ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {isOverdue ? "Atrasado" : "Agendado"}
                        </span>
                        {(ff as any).scheduledAt && (
                          <span className="text-xs" style={{ color: "#4a7ab5" }}>
                            {new Date((ff as any).scheduledAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href="/flash-feedback">
                      <button
                        className="text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0"
                        style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#8aa3c0" }}
                      >
                        Ver
                      </button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RH-only: Curve comparison + Consequence indicators */}
      {isRH && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Curve comparison */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} style={{ color: "#d9f22a" }} />
              <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>Curva da Empresa</p>
            </div>
            <div className="space-y-3">
              {([
                { label: "Esperada", data: STELLAR_EXPECTED_CURVE, color: "#8aa3c0" },
                { label: "Pré-Calibração", data: preCurve, color: "#d9f22a" },
                ...(postCurve ? [{ label: "Pós-Calibração", data: postCurve, color: "#22c55e" }] : []),
              ] as { label: string; data: typeof STELLAR_EXPECTED_CURVE; color: string }[]).map(({ label, data, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#8aa3c0" }}>
                      <span style={{ color: "#22c55e" }}>T {data.talent}%</span>
                      <span style={{ color: "#d9f22a" }}>M {data.maintainer}%</span>
                      <span style={{ color: "#ef4444" }}>C {data.critical}%</span>
                    </div>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-3" style={{ backgroundColor: "#001023" }}>
                    <div style={{ width: `${data.talent}%`, backgroundColor: "#22c55e" }} />
                    <div style={{ width: `${data.maintainer}%`, backgroundColor: "#d9f22a" }} />
                    <div style={{ width: `${data.critical}%`, backgroundColor: "#ef4444" }} />
                  </div>
                </div>
              ))}
              {!postCurve && (
                <p className="text-xs italic" style={{ color: "#4a7ab5" }}>Pós-calibração disponível após o RH ajustar posicionamentos na calibração.</p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid #0a3060" }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <span className="text-xs" style={{ color: "#8aa3c0" }}>Talentos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#d9f22a" }} />
                <span className="text-xs" style={{ color: "#8aa3c0" }}>Mantenedores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <span className="text-xs" style={{ color: "#8aa3c0" }}>Críticos</span>
              </div>
            </div>
          </div>

          {/* Consequence indicators */}
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={14} style={{ color: "#d9f22a" }} />
                <p className="text-sm font-bold" style={{ color: "#fdffdf" }}>Gestão de Consequência</p>
              </div>
              <div className="flex items-center gap-2">
                <a href="/api/export/consequencias" download>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
                    style={{ backgroundColor: "#d9f22a20", border: "1px solid #d9f22a40", color: "#d9f22a" }}
                  >
                    <Download size={12} /> Excel
                  </button>
                </a>
                <Link href="/calibracao">
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#8aa3c0" }}
                  >
                    Ver calibrações
                  </button>
                </Link>
              </div>
            </div>
            {consequenceSummary.total === 0 ? (
              <div className="flex items-center justify-center h-24 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                <p className="text-xs" style={{ color: "#4a7ab5" }}>Nenhuma decisão registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Total summary */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "merito", label: "Mérito", count: consequenceSummary.merito, color: "#22c55e" },
                    { key: "promocao", label: "Promoção", count: consequenceSummary.promocao, color: "#d9f22a" },
                    { key: "plano_recuperacao", label: "Plano Recuperação", count: consequenceSummary.plano_recuperacao, color: "#f59e0b" },
                    { key: "desligamento", label: "Desligamento", count: consequenceSummary.desligamento, color: "#ef4444" },
                  ].map(({ key, label, count, color }) => (
                    <div key={key} className="p-3 rounded-xl" style={{ backgroundColor: "#001023", border: `1px solid ${color}20` }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8aa3c0" }}>{label}</p>
                      <p className="text-2xl font-black" style={{ color, fontFamily: "Space Grotesk" }}>{count}</p>
                    </div>
                  ))}
                </div>
                {/* By group */}
                <div className="pt-2" style={{ borderTop: "1px solid #0a3060" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#8aa3c0" }}>Por Grupo</p>
                  <div className="space-y-2">
                    {[
                      { label: "Talentos", data: consequenceByGroup.talentos, color: "#22c55e" },
                      { label: "Mantenedores", data: consequenceByGroup.mantenedores, color: "#d9f22a" },
                      { label: "Críticos", data: consequenceByGroup.criticos, color: "#ef4444" },
                    ].map(({ label, data, color }) => (
                      <div key={label} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: "#001023", border: `1px solid ${color}20` }}>
                        <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs font-black" style={{ color, fontFamily: "Space Grotesk" }}>{data.total}</span>
                          <div className="flex items-center gap-2 text-xs" style={{ color: "#8aa3c0" }}>
                            {data.promocao > 0 && <span style={{ color: "#d9f22a" }}>↑{data.promocao} promo</span>}
                            {data.merito > 0 && <span style={{ color: "#22c55e" }}>★{data.merito} mérito</span>}
                            {data.plano_recuperacao > 0 && <span style={{ color: "#f59e0b" }}>⚠{data.plano_recuperacao} plano</span>}
                            {data.desligamento > 0 && <span style={{ color: "#ef4444" }}>✕{data.desligamento} deslig.</span>}
                            {data.total === 0 && <span style={{ color: "#4a6080" }}>Sem ações</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8aa3c0" }}>
          Acesso Rápido
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(isRH
            ? [
                { label: "Painel RH", href: "/rh", icon: <Users size={18} />, desc: "Visão global da empresa" },
                { label: "9-Box Global", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Posicionamento de todos" },
                { label: "Calibração", href: "/calibracao", icon: <ClipboardList size={18} />, desc: "Comitês de calibração" },
                { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Acompanhamento geral" },
              ]
            : [
                { label: "Avaliar Time", href: "/avaliacao", icon: <ClipboardList size={18} />, desc: "Avalie seus liderados" },
                { label: "9-Box do Time", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Posicionamento do time" },
                { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Feedbacks do time" },
                { label: "Devolutivas", href: "/relatorio", icon: <FileText size={18} />, desc: "Envie resultados" },
              ]
          ).map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className="p-4 rounded-xl border cursor-pointer transition-all"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#d9f22a40";
                  el.style.backgroundColor = "#00213f";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#0a3060";
                  el.style.backgroundColor = "#001830";
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}>
                  {link.icon}
                </div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "#fdffdf" }}>{link.label}</p>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard for Colaborador ────────────────────────────────────────────────
function ColaboradorDashboard() {
  const { user } = useStellarAuth();
  const { data: cycle } = trpc.cycles.active.useQuery();
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery();
  const utils = trpc.useUtils();

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const unreadNotifs = notifications?.filter((n) => !n.isRead) ?? [];
  const recentNotifs = notifications?.slice(0, 5) ?? [];
  const greetingName = user?.name?.split(" ")[0] ?? "Stellar";

  const notifIcon = (type: string) => {
    switch (type) {
      case "flash_feedback_scheduled": return <Zap size={14} style={{ color: "#d9f22a" }} />;
      case "flash_feedback_due_soon": return <Clock size={14} style={{ color: "#f59e0b" }} />;
      case "flash_feedback_overdue": return <AlertTriangle size={14} style={{ color: "#ef4444" }} />;
      case "report_sent": return <FileText size={14} style={{ color: "#22c55e" }} />;
      default: return <Bell size={14} style={{ color: "#8aa3c0" }} />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="p-6 rounded-xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
              Olá, {greetingName}! 👋
            </h2>
            <p style={{ color: "#8aa3c0" }} className="text-sm">
              {cycle
                ? `Ciclo ativo: ${cycle.name} · Encerra em ${new Date(cycle.endDate).toLocaleDateString("pt-BR")}`
                : "Nenhum ciclo ativo no momento."}
            </p>
          </div>
          {myProfile && (
            <div className="text-right hidden sm:block">
              <p className="text-xs" style={{ color: "#8aa3c0" }}>Cargo</p>
              <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>{myProfile.jobTitle ?? "Cargo não informado"}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{myProfile.department ?? "Departamento não informado"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8aa3c0" }}>
          Acesso Rápido
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Autoavaliação", href: "/avaliacao", icon: <ClipboardList size={18} />, desc: "Faça sua autoavaliação" },
            { label: "Meu 9-Box", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Veja seu posicionamento" },
            { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Agende com seu gestor" },
            { label: "Minha Devolutiva", href: "/relatorio", icon: <FileText size={18} />, desc: "Resultado da avaliação" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className="p-4 rounded-xl border cursor-pointer transition-all"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#d9f22a40";
                  el.style.backgroundColor = "#00213f";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#0a3060";
                  el.style.backgroundColor = "#001830";
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}>
                  {link.icon}
                </div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "#fdffdf" }}>{link.label}</p>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "#8aa3c0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Notificações{" "}
            {unreadNotifs.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#d9f22a", color: "#001023" }}>
                {unreadNotifs.length}
              </span>
            )}
          </h3>
          {unreadNotifs.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs transition-colors"
              style={{ color: "#8aa3c0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
          {recentNotifs.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={32} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
              <p className="text-sm" style={{ color: "#8aa3c0" }}>Nenhuma notificação ainda.</p>
            </div>
          ) : (
            recentNotifs.map((notif, i) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 p-4"
                style={{
                  borderBottom: i < recentNotifs.length - 1 ? "1px solid #0a3060" : "none",
                  backgroundColor: notif.isRead ? "transparent" : "#d9f22a08",
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#001023" }}>
                  {notifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: notif.isRead ? "#8aa3c0" : "#fdffdf" }}>{notif.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{notif.message}</p>
                  <p className="text-xs mt-1" style={{ color: "#4a6a8a" }}>
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: "#d9f22a" }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useStellarAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";

  return (
    <StellarLayout title="Dashboard">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
        <CycleProgressBar />
        {platformRole === "rh" ? (
          <ManagerDashboard isRH={true} />
        ) : platformRole === "gestor" ? (
          <ManagerDashboard isRH={false} />
        ) : (
          <ColaboradorDashboard />
        )}
      </div>
    </StellarLayout>
  );
}
