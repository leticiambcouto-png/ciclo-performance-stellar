import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { NINEBOX_QUADRANTS, STELLAR_EXPECTED_CURVE, calculateCurveDistribution } from "../../../shared/nineboxData";
import type { NineboxQuadrant, AxisValue } from "../../../shared/nineboxData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { BrainCircuit, Info, Loader2, Play, X } from "lucide-react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AxisLevel = "low" | "medium" | "high";

// 9-box grid layout (renumbered):
//   Performance ↑
//   Alta  │ Q7  Q8  Q9
//   Média │ Q4  Q5  Q6
//   Baixa │ Q1  Q2  Q3
//          ──────────────→ Potencial (Baixo → Médio → Alto)
const GRID_LAYOUT: NineboxQuadrant[][] = [
  ["Q7", "Q8", "Q9"],
  ["Q4", "Q5", "Q6"],
  ["Q1", "Q2", "Q3"],
];

const AXIS_LABELS_SIM: Record<AxisValue, string> = {
  below: "Abaixo",
  within: "Dentro",
  above: "Acima",
};

const SIMULATION_CRITERIA = [
  { key: "ambicao", label: "Ambição", axis: "potencial" },
  { key: "sonharGrande", label: "Sonhar Grande", axis: "potencial" },
  { key: "accountability", label: "Accountability", axis: "potencial" },
  { key: "juntosSomosMaisFortes", label: "Juntos Somos Mais Fortes", axis: "potencial" },
  { key: "qualidade", label: "Qualidade e Consistência", axis: "performance" },
  { key: "contribuicao", label: "Contribuição para o Negócio", axis: "performance" },
  { key: "adaptacao", label: "Adaptação e Velocidade", axis: "performance" },
  { key: "usoDeIA", label: "Uso de IA e Automação", axis: "performance" },
];

export default function NineBox() {
  const { user } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [selectedQ, setSelectedQ] = useState<NineboxQuadrant | null>(null);
  const [simMode, setSimMode] = useState(false);
  const [simAnswers, setSimAnswers] = useState<Record<string, AxisValue>>({});
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ninebox" | "curve">("ninebox");

  const { data: cycle } = trpc.cycles.active.useQuery();
  const cycleId = cycle?.id ?? 0;

  const { data: teamPositions } = trpc.ninebox.teamPositions.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && (platformRole === "gestor" || platformRole === "rh") }
  );
  const { data: myPosition } = trpc.ninebox.myPosition.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole === "colaborador" }
  );
  const { data: allPositions } = trpc.ninebox.allPositions.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && platformRole === "rh" }
  );
  const { data: employees } = trpc.employees.all.useQuery();

  const simResult = trpc.ninebox.simulate.useQuery(
    simAnswers as any,
    {
      enabled:
        simMode &&
        SIMULATION_CRITERIA.every((c) => simAnswers[c.key]),
    }
  );

  const analyzeCurve = trpc.ai.analyzeCurve.useMutation({
    onSuccess: (data) => setAiAnalysis(typeof data === 'string' ? data : ''),
    onError: () => toast.error("Erro ao gerar análise de IA."),
  });

  const positions = platformRole === "rh" ? allPositions : platformRole === "gestor" ? teamPositions : myPosition ? [myPosition] : [];
  const positionArray = Array.isArray(positions) ? positions : [];

  const quadrantCounts: Record<NineboxQuadrant, number> = {} as any;
  for (const q of Object.keys(NINEBOX_QUADRANTS)) {
    quadrantCounts[q as NineboxQuadrant] = 0;
  }
  for (const pos of positionArray) {
    if (pos.quadrant in quadrantCounts) {
      quadrantCounts[pos.quadrant as NineboxQuadrant]++;
    }
  }

  const allQuadrants = positionArray.map((p) => p.quadrant as NineboxQuadrant);
  const curve = calculateCurveDistribution(allQuadrants);
  const teamSize = positionArray.length;

  const curveChartData = [
    {
      name: "Zona Crítica",
      atual: curve.critical,
      esperado: STELLAR_EXPECTED_CURVE.critical,
      color: "#ef4444",
    },
    {
      name: "Mantenedores",
      atual: curve.maintainer,
      esperado: STELLAR_EXPECTED_CURVE.maintainer,
      color: "#3b82f6",
    },
    {
      name: "Talentos",
      atual: curve.talent,
      esperado: STELLAR_EXPECTED_CURVE.talent,
      color: "#d9f22a",
    },
  ];

  const handleAnalyze = () => {
    setAiLoading(true);
    analyzeCurve.mutate(
      { ...curve, teamSize },
      { onSettled: () => setAiLoading(false) }
    );
  };

  const getEmployeesInQuadrant = (q: NineboxQuadrant) => {
    return positionArray
      .filter((p) => p.quadrant === q)
      .map((p) => employees?.find((e) => e.id === p.employeeId))
      .filter(Boolean);
  };

  const qInfo = selectedQ ? NINEBOX_QUADRANTS[selectedQ] : null;

  return (
    <StellarLayout title="9-Box">
      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {["ninebox", "curve"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab ? "#d9f22a" : "#001830",
                color: activeTab === tab ? "#001023" : "#8aa3c0",
                border: `1px solid ${activeTab === tab ? "#d9f22a" : "#0a3060"}`,
              }}
            >
              {tab === "ninebox" ? "9-Box" : "Curva da Área"}
            </button>
          ))}
          {(platformRole === "gestor" || platformRole === "rh") && (
            <button
              onClick={() => setSimMode(!simMode)}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
              style={{
                backgroundColor: simMode ? "#1840eb20" : "#001830",
                color: simMode ? "#7ba7ff" : "#8aa3c0",
                border: `1px solid ${simMode ? "#1840eb40" : "#0a3060"}`,
              }}
            >
              <Play size={14} />
              {simMode ? "Sair da Simulação" : "Modo Simulação"}
            </button>
          )}
        </div>

        {/* Simulation mode */}
        {simMode && (
          <div
            className="p-5 rounded-xl border"
            style={{ backgroundColor: "#001830", borderColor: "#1840eb40" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#1840eb] animate-pulse" />
              <p className="text-sm font-semibold" style={{ color: "#7ba7ff" }}>
                Modo Simulação — Responda as perguntas para ver onde a pessoa ficaria no 9-Box
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["potencial", "performance"].map((axis) => (
                <div key={axis}>
                  <p
                    className="text-xs font-bold mb-2 uppercase tracking-wider"
                    style={{ color: axis === "potencial" ? "#1840eb" : "#d9f22a" }}
                  >
                    Eixo de {axis === "potencial" ? "Potencial" : "Performance"}
                  </p>
                  <div className="space-y-2">
                    {SIMULATION_CRITERIA.filter((c) => c.axis === axis).map((c) => (
                      <div key={c.key}>
                        <p className="text-xs mb-1" style={{ color: "#fdffdf" }}>{c.label}</p>
                        <div className="flex gap-2">
                          {(["below", "within", "above"] as AxisValue[]).map((v) => (
                            <button
                              key={v}
                              onClick={() => setSimAnswers((p) => ({ ...p, [c.key]: v }))}
                              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border"
                              style={{
                                backgroundColor:
                                  simAnswers[c.key] === v
                                    ? v === "below" ? "#ef444420" : v === "within" ? "#f59e0b20" : "#22c55e20"
                                    : "#001023",
                                borderColor:
                                  simAnswers[c.key] === v
                                    ? v === "below" ? "#ef4444" : v === "within" ? "#f59e0b" : "#22c55e"
                                    : "#0a3060",
                                color:
                                  simAnswers[c.key] === v
                                    ? v === "below" ? "#ef4444" : v === "within" ? "#f59e0b" : "#22c55e"
                                    : "#8aa3c0",
                              }}
                            >
                              {AXIS_LABELS_SIM[v]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {simResult.data && (
              <div
                className="mt-4 p-4 rounded-xl border"
                style={{
                  backgroundColor: `${NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.color}15`,
                  borderColor: `${NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.color}40`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
                    style={{
                      backgroundColor: `${NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.color}20`,
                      color: NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.color,
                    }}
                  >
                    {simResult.data.quadrant}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: "#fdffdf" }}>
                      {NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#8aa3c0" }}>
                      {NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.description}
                    </p>
                    <div className="flex gap-3 mt-2">
                      {[
                        { label: "Mérito", val: NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.merito },
                        { label: "Promoção", val: NINEBOX_QUADRANTS[simResult.data.quadrant as NineboxQuadrant]?.promocao },
                      ].map((item) => (
                        <span
                          key={item.label}
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: item.val ? "#22c55e15" : "#ef444415",
                            borderColor: item.val ? "#22c55e30" : "#ef444430",
                            color: item.val ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.label}: {item.val ? "Sim" : "Não"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "ninebox" && (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* 9-box grid */}
            <div className="flex-1">
              <div className="relative">
                {/* Y axis label */}
                <div
                  className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold whitespace-nowrap"
                  style={{ color: "#8aa3c0" }}
                >
                  Performance (Baixo → Alto)
                </div>

                <div className="grid grid-cols-3 gap-1.5 ml-4">
                  {GRID_LAYOUT.flat().map((q) => {
                    const info = NINEBOX_QUADRANTS[q];
                    const count = quadrantCounts[q] ?? 0;
                    const emps = getEmployeesInQuadrant(q);
                    const isSelected = selectedQ === q;
                    const isMyQ = myPosition?.quadrant === q && platformRole === "colaborador";

                    return (
                      <button
                        key={q}
                        onClick={() => setSelectedQ(isSelected ? null : q)}
                        className="relative p-3 rounded-xl border text-left transition-all min-h-[90px]"
                        style={{
                          backgroundColor: isSelected
                            ? `${info.color}25`
                            : isMyQ
                            ? `${info.color}15`
                            : "#001830",
                          borderColor: isSelected
                            ? info.color
                            : isMyQ
                            ? `${info.color}60`
                            : "#0a3060",
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span
                            className="text-xs font-black"
                            style={{ color: info.color }}
                          >
                            {q}
                          </span>
                          {count > 0 && (
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${info.color}20`, color: info.color }}
                            >
                              {count}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs font-semibold leading-tight"
                          style={{ color: "#fdffdf" }}
                        >
                          {info.name}
                        </p>
                        {isMyQ && (
                          <span
                            className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                          >
                            Você
                          </span>
                        )}
                        {/* Employee dots */}
                        {emps.length > 0 && platformRole !== "colaborador" && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {emps.slice(0, 4).map((e, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: `${info.color}30`, color: info.color }}
                                title={e?.name}
                              >
                                {e?.name?.charAt(0)}
                              </div>
                            ))}
                            {emps.length > 4 && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                style={{ backgroundColor: "#0a3060", color: "#8aa3c0" }}
                              >
                                +{emps.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* X axis label */}
                <div
                  className="text-center mt-2 text-xs font-semibold ml-4"
                  style={{ color: "#8aa3c0" }}
                >
                  Potencial (Baixo → Alto)
                </div>
              </div>
            </div>

            {/* Quadrant detail */}
            {selectedQ && qInfo && (
              <div
                className="w-full lg:w-80 p-5 rounded-xl border"
                style={{
                  backgroundColor: "#001830",
                  borderColor: `${qInfo.color}40`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-2xl font-black"
                        style={{ color: qInfo.color }}
                      >
                        {selectedQ}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${qInfo.color}20`,
                          color: qInfo.color,
                        }}
                      >
                        {qInfo.zone === "critical" ? "Zona Crítica" : qInfo.zone === "maintainer" ? "Mantenedor" : "Talento"}
                      </span>
                    </div>
                    <p className="font-bold" style={{ color: "#fdffdf" }}>{qInfo.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedQ(null)}
                    style={{ color: "#8aa3c0" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: "#8aa3c0" }}>
                  {qInfo.description}
                </p>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8aa3c0" }}>
                    Gestão de Consequência
                  </p>
                  {[
                    { label: "Mérito", val: qInfo.merito },
                    { label: "Promoção", val: qInfo.promocao },
                    { label: "Bônus", val: qInfo.bonus === "yes" ? true : qInfo.bonus === "no" ? false : null },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#fdffdf" }}>{item.label}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor:
                            item.val === true ? "#22c55e15" : item.val === false ? "#ef444415" : "#f59e0b15",
                          borderColor:
                            item.val === true ? "#22c55e30" : item.val === false ? "#ef444430" : "#f59e0b30",
                          color:
                            item.val === true ? "#22c55e" : item.val === false ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        {item.val === true ? "Sim" : item.val === false ? "Não" : "Por meta"}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "#001023" }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: "#d9f22a" }}>
                    Plano de Ação Recomendado
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#8aa3c0" }}>
                    {qInfo.actionPlan}
                  </p>
                </div>

                {/* Employees in this quadrant */}
                {platformRole !== "colaborador" && getEmployeesInQuadrant(selectedQ).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#8aa3c0" }}>
                      Pessoas neste quadrante
                    </p>
                    <div className="space-y-1">
                      {getEmployeesInQuadrant(selectedQ).map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg"
                          style={{ backgroundColor: "#001023" }}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: `${qInfo.color}20`, color: qInfo.color }}
                          >
                            {e?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: "#fdffdf" }}>{e?.name}</p>
                            <p className="text-xs" style={{ color: "#8aa3c0" }}>{e?.jobTitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "curve" && (platformRole === "gestor" || platformRole === "rh") && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart */}
              <div
                className="p-5 rounded-xl border"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
              >
                <h3 className="font-bold mb-4" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                  Distribuição do Time
                </h3>
                {teamSize === 0 ? (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-sm" style={{ color: "#8aa3c0" }}>
                      Nenhum posicionamento registrado ainda.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={curveChartData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fill: "#8aa3c0", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#8aa3c0", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#001830", border: "1px solid #0a3060", borderRadius: 8 }}
                        labelStyle={{ color: "#fdffdf" }}
                        itemStyle={{ color: "#8aa3c0" }}
                        formatter={(v: number) => [`${v}%`]}
                      />
                      <Bar dataKey="atual" name="Atual" radius={[4, 4, 0, 0]}>
                        {curveChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                      <Bar dataKey="esperado" name="Esperado" fill="#ffffff20" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-3">
                {curveChartData.map((item) => (
                  <div
                    key={item.name}
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black" style={{ color: item.color }}>
                          {item.atual}%
                        </span>
                        <span className="text-xs" style={{ color: "#8aa3c0" }}>
                          vs {item.esperado}% esperado
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "#001023" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.atual}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeCurve.isPending || teamSize === 0}
                  className="w-full flex items-center gap-2"
                  style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                >
                  {analyzeCurve.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <BrainCircuit size={16} />
                  )}
                  Analisar com IA
                </Button>
              </div>
            </div>

            {/* AI Analysis */}
            {aiAnalysis && (
              <div
                className="p-5 rounded-xl border"
                style={{ backgroundColor: "#001830", borderColor: "#d9f22a30" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BrainCircuit size={16} style={{ color: "#d9f22a" }} />
                  <p className="text-sm font-semibold" style={{ color: "#d9f22a" }}>
                    Análise de IA
                  </p>
                </div>
                <div style={{ color: "#fdffdf" }} className="text-sm">
                  <Streamdown>{aiAnalysis}</Streamdown>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "curve" && platformRole === "colaborador" && (
          <div
            className="p-8 rounded-xl border text-center"
            style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
          >
            <Info size={32} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
            <p className="text-sm" style={{ color: "#8aa3c0" }}>
              A análise de curva da área está disponível para gestores e RH.
            </p>
          </div>
        )}
      </div>
    </StellarLayout>
  );
}
