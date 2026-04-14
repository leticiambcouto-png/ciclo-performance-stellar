import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Building2, Plus, Users, Shield, X, UserPlus, Pencil, Trash2,
  CheckCircle2, Search, Filter, Award, TrendingUp, TrendingDown,
  AlertTriangle, ClipboardList, Lock, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NINEBOX_QUADRANTS } from "../../../shared/nineboxData";
import type { NineboxQuadrant } from "../../../shared/nineboxData";

const GRID_LAYOUT: NineboxQuadrant[][] = [
  ["Q3", "Q8", "Q9"],
  ["Q2", "Q5", "Q6"],
  ["Q1", "Q4", "Q7"],
];

const CONSEQUENCE_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma decisão", icon: ClipboardList, color: "#8aa3c0" },
  { value: "merito", label: "Mérito", icon: Award, color: "#d9f22a" },
  { value: "promocao", label: "Promoção", icon: TrendingUp, color: "#22c55e" },
  { value: "desligamento", label: "Desligamento", icon: TrendingDown, color: "#ef4444" },
  { value: "plano_recuperacao", label: "Plano de Recuperação", icon: AlertTriangle, color: "#f59e0b" },
] as const;

type ConsequenceValue = "nenhuma" | "merito" | "promocao" | "desligamento" | "plano_recuperacao";

const AXIS_LABEL: Record<string, string> = {
  below: "Abaixo", within: "Dentro", above: "Acima",
};

const CRITERIA_LABELS: Record<string, string> = {
  ambicao: "Ambição",
  sonharGrande: "Sonhar Grande",
  accountability: "Accountability",
  juntosSomosMaisFortes: "Juntos Somos Mais Fortes",
  qualidade: "Qualidade e Consistência",
  contribuicao: "Contribuição para o Negócio",
  adaptacao: "Adaptação e Velocidade",
  usoDeIA: "Uso de IA e Automação",
};

const PERF_KEYS = ["qualidade", "contribuicao", "adaptacao", "usoDeIA"];
const POT_KEYS = ["ambicao", "sonharGrande", "accountability", "juntosSomosMaisFortes"];

function getConsequenceInfo(val: string) {
  return CONSEQUENCE_OPTIONS.find((c) => c.value === val) ?? CONSEQUENCE_OPTIONS[0];
}

export default function Calibracao() {
  const { user } = useStellarAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const secondaryRole = (user as any)?.secondaryPlatformRole ?? null;
  const isRH = platformRole === "rh" || secondaryRole === "rh";

  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<NineboxQuadrant | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showScopeManager, setShowScopeManager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [editRoom, setEditRoom] = useState({ name: "", description: "" });
  const [consequenceNote, setConsequenceNote] = useState("");
  const [selectedConsequence, setSelectedConsequence] = useState<ConsequenceValue>("nenhuma");

  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeFilterArea, setScopeFilterArea] = useState("");
  const [scopeFilterJob, setScopeFilterJob] = useState("");

  const utils = trpc.useUtils();
  const { data: cycle } = trpc.cycles.active.useQuery();
  const cycleId = cycle?.id ?? 0;
  const { data: rooms } = trpc.calibration.rooms.useQuery({});
  const { data: employees } = trpc.employees.all.useQuery();
  const { data: allPositions } = trpc.ninebox.allPositions.useQuery(
    { cycleId },
    { enabled: cycleId > 0 }
  );
  const room = rooms?.find((r) => r.id === selectedRoom);
  const { data: participants } = trpc.calibration.participants.useQuery(
    { roomId: selectedRoom ?? 0 },
    { enabled: selectedRoom !== null }
  );
  const { data: scopeData } = trpc.calibration.scope.useQuery(
    { roomId: selectedRoom ?? 0 },
    { enabled: selectedRoom !== null }
  );
  const { data: consequences } = trpc.calibration.consequences.useQuery(
    { roomId: selectedRoom ?? 0 },
    { enabled: selectedRoom !== null }
  );
  const { data: allManagerEvals } = trpc.managerEvaluation.allEvaluations.useQuery(
    { cycleId },
    { enabled: cycleId > 0 && selectedEmployee !== null }
  );

  const scopeEmployeeIds = useMemo(() => new Set((scopeData ?? []).map((s) => s.employeeId)), [scopeData]);
  const employeeConsequence = useMemo(() => {
    const map: Record<number, { consequence: string; notes: string | null }> = {};
    for (const c of consequences ?? []) {
      map[c.employeeId] = { consequence: c.consequence, notes: c.notes ?? null };
    }
    return map;
  }, [consequences]);

  const selectedEmployeeData = useMemo(() =>
    employees?.find((e) => e.id === selectedEmployee), [employees, selectedEmployee]);
  const selectedEmployeeEval = useMemo(() =>
    allManagerEvals?.find((e) => e.employeeId === selectedEmployee), [allManagerEvals, selectedEmployee]);
  const selectedEmployeePosition = useMemo(() =>
    allPositions?.find((p) => p.employeeId === selectedEmployee), [allPositions, selectedEmployee]);

  const uniqueAreas = useMemo(() => {
    const s = new Set<string>();
    (employees ?? []).forEach((e) => { if (e.area) s.add(e.area); });
    return Array.from(s).sort();
  }, [employees]);
  const uniqueJobs = useMemo(() => {
    const s = new Set<string>();
    (employees ?? []).forEach((e) => { if (e.jobTitle) s.add(e.jobTitle); });
    return Array.from(s).sort();
  }, [employees]);

  const scopeEmployees = useMemo(() =>
    (employees ?? []).filter((e) => scopeEmployeeIds.has(e.id)), [employees, scopeEmployeeIds]);

  const filteredForScope = useMemo(() => {
    return (employees ?? []).filter((e) => {
      const matchSearch = !scopeSearch || e.name?.toLowerCase().includes(scopeSearch.toLowerCase());
      const matchArea = !scopeFilterArea || e.area === scopeFilterArea;
      const matchJob = !scopeFilterJob || e.jobTitle === scopeFilterJob;
      return matchSearch && matchArea && matchJob;
    });
  }, [employees, scopeSearch, scopeFilterArea, scopeFilterJob]);

  const quadrantData = useMemo(() => {
    const counts: Record<NineboxQuadrant, number> = {} as any;
    const people: Record<NineboxQuadrant, number[]> = {} as any;
    const allQs: NineboxQuadrant[] = ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9"];
    for (const q of allQs) {
      counts[q] = 0;
      people[q] = [];
    }
    for (const pos of allPositions ?? []) {
      if (pos.quadrant && scopeEmployeeIds.has(pos.employeeId)) {
        const q = pos.quadrant as NineboxQuadrant;
        counts[q]++;
        people[q].push(pos.employeeId);
      }
    }
    return { counts, people };
  }, [allPositions, scopeEmployeeIds]);

  const createRoom = trpc.calibration.createRoom.useMutation({
    onSuccess: () => { toast.success("Sala criada!"); setShowCreate(false); setNewRoom({ name: "", description: "" }); utils.calibration.rooms.invalidate(); },
    onError: () => toast.error("Erro ao criar sala."),
  });
  const updateRoom = trpc.calibration.updateRoom.useMutation({
    onSuccess: () => { toast.success("Sala atualizada!"); setShowEdit(false); utils.calibration.rooms.invalidate(); },
    onError: () => toast.error("Erro ao atualizar sala."),
  });
  const deleteRoom = trpc.calibration.deleteRoom.useMutation({
    onSuccess: () => { toast.success("Sala excluída."); setShowDeleteConfirm(false); setSelectedRoom(null); utils.calibration.rooms.invalidate(); },
    onError: () => toast.error("Erro ao excluir sala."),
  });
  const finalizeRoom = trpc.calibration.finalizeRoom.useMutation({
    onSuccess: () => { toast.success("Sala finalizada!"); setShowFinalizeConfirm(false); utils.calibration.rooms.invalidate(); },
    onError: () => toast.error("Erro ao finalizar sala."),
  });
  const addParticipant = trpc.calibration.addParticipant.useMutation({
    onSuccess: () => { toast.success("Participante adicionado!"); utils.calibration.participants.invalidate(); },
    onError: () => toast.error("Erro ao adicionar participante."),
  });
  const addScopeEmployee = trpc.calibration.addScopeEmployee.useMutation({
    onSuccess: () => utils.calibration.scope.invalidate(),
    onError: () => toast.error("Erro ao adicionar ao escopo."),
  });
  const removeScopeEmployee = trpc.calibration.removeScopeEmployee.useMutation({
    onSuccess: () => utils.calibration.scope.invalidate(),
    onError: () => toast.error("Erro ao remover do escopo."),
  });
  const upsertConsequence = trpc.calibration.upsertConsequence.useMutation({
    onSuccess: () => { toast.success("Decisão salva!"); utils.calibration.consequences.invalidate(); },
    onError: () => toast.error("Erro ao salvar decisão."),
  });

  if (!isRH) {
    return (
      <StellarLayout title="Calibração">
        <div className="p-6">
          <div className="p-8 sm:p-12 rounded-xl border text-center" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
            <Shield size={48} className="mx-auto mb-4" style={{ color: "#0a3060" }} />
            <p className="font-bold text-lg mb-2" style={{ color: "#fdffdf" }}>Acesso restrito</p>
            <p className="text-sm" style={{ color: "#8aa3c0" }}>Esta área é exclusiva para o time de RH.</p>
          </div>
        </div>
      </StellarLayout>
    );
  }

  const getEmployeeName = (id: number) => employees?.find((e) => e.id === id)?.name ?? "Colaborador";
  const getEmployeeQuadrant = (id: number) =>
    allPositions?.find((p) => p.employeeId === id)?.quadrant as NineboxQuadrant | undefined;

  const openEmployee = (empId: number) => {
    setSelectedEmployee(empId);
    const cons = employeeConsequence[empId];
    setSelectedConsequence((cons?.consequence as ConsequenceValue) ?? "nenhuma");
    setConsequenceNote(cons?.notes ?? "");
  };

  const saveConsequence = () => {
    if (!selectedRoom || !selectedEmployee) return;
    upsertConsequence.mutate({
      roomId: selectedRoom,
      employeeId: selectedEmployee,
      cycleId: cycleId || undefined,
      consequence: selectedConsequence,
      notes: consequenceNote || undefined,
    });
  };

  const isFinalized = room?.status === "completed";

  return (
    <StellarLayout title="Calibração">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Salas de Calibração</h1>
            <p className="text-sm mt-1" style={{ color: "#8aa3c0" }}>Gerencie as salas e defina as decisões de consequência</p>
          </div>
          <Button onClick={() => setShowCreate(true)} style={{ backgroundColor: "#d9f22a", color: "#001023" }}>
            <Plus size={16} className="mr-2" /> Nova Sala
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room list */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8aa3c0" }}>Salas ({rooms?.length ?? 0})</p>
            {(rooms ?? []).length === 0 && (
              <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                <Building2 size={32} className="mx-auto mb-2" style={{ color: "#0a3060" }} />
                <p className="text-sm" style={{ color: "#8aa3c0" }}>Nenhuma sala criada ainda.</p>
              </div>
            )}
            {(rooms ?? []).map((r) => (
              <button key={r.id}
                onClick={() => { setSelectedRoom(r.id); setSelectedEmployee(null); setSelectedQuadrant(null); }}
                className="w-full text-left p-4 rounded-xl border transition-all"
                style={{ backgroundColor: selectedRoom === r.id ? "#0a3060" : "#001830", borderColor: selectedRoom === r.id ? "#d9f22a" : "#0a3060" }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#fdffdf" }}>{r.name}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: "#8aa3c0" }}>{r.description ?? "Sem descrição"}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: r.status === "completed" ? "#22c55e20" : r.status === "active" ? "#d9f22a20" : "#0a306040",
                      color: r.status === "completed" ? "#22c55e" : r.status === "active" ? "#d9f22a" : "#8aa3c0",
                    }}>
                      {r.status === "completed" ? "Finalizada" : r.status === "active" ? "Ativa" : "Rascunho"}
                    </span>
                    <ChevronRight size={14} style={{ color: "#8aa3c0" }} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Room detail */}
          {selectedRoom && room ? (
            <div className="lg:col-span-2 space-y-4">
              {/* Room header */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>{room.name}</h2>
                      {isFinalized && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
                          <Lock size={10} /> Finalizada
                        </span>
                      )}
                    </div>
                    {room.description && <p className="text-sm mt-1" style={{ color: "#8aa3c0" }}>{room.description}</p>}
                  </div>
                  {!isFinalized && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline"
                        onClick={() => { setEditRoom({ name: room.name, description: room.description ?? "" }); setShowEdit(true); }}
                        style={{ borderColor: "#0a3060", color: "#8aa3c0" }}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)}
                        style={{ borderColor: "#ef444440", color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                {!isFinalized && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowAddParticipant(true)}
                      style={{ borderColor: "#0a3060", color: "#8aa3c0" }}>
                      <UserPlus size={14} className="mr-1" /> Participantes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowScopeManager(true)}
                      style={{ borderColor: "#0a3060", color: "#8aa3c0" }}>
                      <Filter size={14} className="mr-1" /> Pessoas a Calibrar
                    </Button>
                    <Button size="sm" onClick={() => setShowFinalizeConfirm(true)}
                      style={{ backgroundColor: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" }}>
                      <CheckCircle2 size={14} className="mr-1" /> Finalizar Sala
                    </Button>
                  </div>
                )}
              </div>

              {/* 9-Box + Employee panel */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Mini 9-Box */}
                <div className="p-4 rounded-xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8aa3c0" }}>
                    9-Box — Escopo ({scopeEmployeeIds.size} pessoas)
                  </p>
                  {scopeEmployeeIds.size === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm" style={{ color: "#8aa3c0" }}>Nenhuma pessoa no escopo. Clique em "Pessoas a Calibrar".</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      {GRID_LAYOUT.map((row) =>
                        row.map((q) => {
                          const count = quadrantData.counts[q];
                          const isSelected = selectedQuadrant === q;
                          return (
                            <button key={q} onClick={() => setSelectedQuadrant(isSelected ? null : q)}
                              className="relative p-2 rounded-lg text-left transition-all"
                              style={{
                                backgroundColor: isSelected ? "#d9f22a20" : "#001023",
                                border: `1px solid ${isSelected ? "#d9f22a" : "#0a3060"}`,
                                minHeight: "56px",
                              }}>
                              <p className="text-xs font-bold" style={{ color: "#8aa3c0" }}>{q}</p>
                              <p className="text-xl font-bold" style={{ color: count > 0 ? "#d9f22a" : "#0a3060" }}>{count}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Quadrant people */}
                  {selectedQuadrant && quadrantData.people[selectedQuadrant].length > 0 && (
                    <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#d9f22a" }}>
                        {selectedQuadrant} — {quadrantData.counts[selectedQuadrant]} pessoa(s)
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {quadrantData.people[selectedQuadrant].map((empId) => {
                          const emp = employees?.find((e) => e.id === empId);
                          const cons = employeeConsequence[empId];
                          const consInfo = getConsequenceInfo(cons?.consequence ?? "nenhuma");
                          return (
                            <button key={empId} onClick={() => openEmployee(empId)}
                              className="w-full flex items-center gap-2 p-1.5 rounded text-left hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: selectedEmployee === empId ? "#0a3060" : "transparent" }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>
                                {emp?.name?.charAt(0)}
                              </div>
                              <span className="text-xs flex-1 truncate" style={{ color: "#fdffdf" }}>{emp?.name}</span>
                              {cons?.consequence && cons.consequence !== "nenhuma" && (
                                <span className="text-xs" style={{ color: consInfo.color }}>●</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full scope list */}
                  {scopeEmployees.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8aa3c0" }}>Todos no escopo</p>
                      <div className="space-y-1 max-h-52 overflow-y-auto">
                        {scopeEmployees.map((emp) => {
                          const quadrant = getEmployeeQuadrant(emp.id);
                          const cons = employeeConsequence[emp.id];
                          const consInfo = getConsequenceInfo(cons?.consequence ?? "nenhuma");
                          return (
                            <button key={emp.id} onClick={() => openEmployee(emp.id)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all"
                              style={{
                                backgroundColor: selectedEmployee === emp.id ? "#0a3060" : "#001023",
                                border: `1px solid ${selectedEmployee === emp.id ? "#d9f22a40" : "#0a3060"}`,
                              }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>
                                {emp.name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: "#fdffdf" }}>{emp.name}</p>
                                <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{emp.jobTitle}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {quadrant && (
                                  <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>{quadrant}</span>
                                )}
                                {cons?.consequence && cons.consequence !== "nenhuma" && (
                                  <span className="text-xs font-medium" style={{ color: consInfo.color }}>{consInfo.label.split(" ")[0]}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Employee detail */}
                {selectedEmployee && selectedEmployeeData ? (
                  <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>
                          {selectedEmployeeData.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#fdffdf" }}>{selectedEmployeeData.name}</p>
                          <p className="text-xs" style={{ color: "#8aa3c0" }}>{selectedEmployeeData.jobTitle} · {selectedEmployeeData.area}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedEmployee(null)}><X size={16} style={{ color: "#8aa3c0" }} /></button>
                    </div>

                    {selectedEmployeePosition && (
                      <div className="p-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                        <p className="text-xs" style={{ color: "#8aa3c0" }}>
                          Posição no 9-Box: <span className="font-bold" style={{ color: "#d9f22a" }}>{selectedEmployeePosition.quadrant}</span>
                        </p>
                      </div>
                    )}

                    {/* Manager eval */}
                    {selectedEmployeeEval ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8aa3c0" }}>Avaliação do Líder</p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium mb-1" style={{ color: "#d9f22a" }}>Performance (70%)</p>
                          {PERF_KEYS.map((key) => {
                            const val = (selectedEmployeeEval as any)[key];
                            return val ? (
                              <div key={key} className="flex justify-between text-xs">
                                <span style={{ color: "#8aa3c0" }}>{CRITERIA_LABELS[key]}</span>
                                <span className="font-medium" style={{ color: "#fdffdf" }}>{AXIS_LABEL[val] ?? val}</span>
                              </div>
                            ) : null;
                          })}
                           <p className="text-xs font-medium mb-1 mt-2" style={{ color: "#7ba7ff" }}>Cultura (30%)</p>
                          {POT_KEYS.map((key) => {
                            const val = (selectedEmployeeEval as any)[key];
                            return val ? (
                              <div key={key} className="flex justify-between text-xs">
                                <span style={{ color: "#8aa3c0" }}>{CRITERIA_LABELS[key]}</span>
                                <span className="font-medium" style={{ color: "#fdffdf" }}>{AXIS_LABEL[val] ?? val}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                        <p className="text-xs" style={{ color: "#8aa3c0" }}>Avaliação do líder não encontrada para este ciclo.</p>
                      </div>
                    )}

                    {/* Consequence */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8aa3c0" }}>Gestão de Consequência</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {CONSEQUENCE_OPTIONS.map((opt) => (
                          <button key={opt.value}
                            onClick={() => !isFinalized && setSelectedConsequence(opt.value as ConsequenceValue)}
                            disabled={isFinalized}
                            className="flex items-center gap-2 p-2.5 rounded-lg text-left transition-all"
                            style={{
                              backgroundColor: selectedConsequence === opt.value ? `${opt.color}20` : "#001023",
                              border: `1px solid ${selectedConsequence === opt.value ? opt.color : "#0a3060"}`,
                              opacity: isFinalized ? 0.7 : 1,
                            }}>
                            <opt.icon size={14} style={{ color: opt.color }} />
                            <span className="text-xs font-medium" style={{ color: selectedConsequence === opt.value ? opt.color : "#fdffdf" }}>
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      <Textarea placeholder="Observações sobre a decisão (opcional)..."
                        value={consequenceNote} onChange={(e) => setConsequenceNote(e.target.value)}
                        disabled={isFinalized} rows={2} className="mt-2 text-xs"
                        style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf", resize: "none" }} />
                      {!isFinalized && (
                        <Button onClick={saveConsequence} disabled={upsertConsequence.isPending}
                          className="w-full mt-2" size="sm" style={{ backgroundColor: "#d9f22a", color: "#001023" }}>
                          Salvar Decisão
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                    <Users size={32} className="mx-auto mb-2" style={{ color: "#0a3060" }} />
                    <p className="text-sm" style={{ color: "#8aa3c0" }}>
                      Clique em uma pessoa no escopo para ver a avaliação do líder e definir a gestão de consequência.
                    </p>
                  </div>
                )}
              </div>

              {/* Participants */}
              {(participants ?? []).length > 0 && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8aa3c0" }}>Participantes da Sala</p>
                  <div className="flex flex-wrap gap-2">
                    {participants?.map((p) => (
                      <span key={p.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: "#0a3060", color: "#fdffdf" }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>
                          {getEmployeeName(p.managerId).charAt(0)}
                        </span>
                        {getEmployeeName(p.managerId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Consequence summary */}
              {(consequences ?? []).filter((c) => c.consequence !== "nenhuma").length > 0 && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8aa3c0" }}>Resumo de Decisões</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONSEQUENCE_OPTIONS.filter((o) => o.value !== "nenhuma").map((opt) => {
                      const count = (consequences ?? []).filter((c) => c.consequence === opt.value).length;
                      return (
                        <div key={opt.value} className="p-3 rounded-lg text-center"
                          style={{ backgroundColor: `${opt.color}10`, border: `1px solid ${opt.color}30` }}>
                          <p className="text-xl font-bold" style={{ color: opt.color }}>{count}</p>
                          <p className="text-xs mt-1" style={{ color: opt.color }}>{opt.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 p-12 rounded-xl border text-center" style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}>
              <Building2 size={48} className="mx-auto mb-4" style={{ color: "#0a3060" }} />
              <p className="font-bold text-lg mb-2" style={{ color: "#fdffdf" }}>Selecione uma sala</p>
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                Escolha uma sala à esquerda para gerenciar participantes, definir o escopo de pessoas e registrar as decisões de consequência.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Nova Sala de Calibração</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Nome da sala *</label>
              <Input placeholder="Ex: Calibração N1 — Líderes Diretos do CEO"
                value={newRoom.name} onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Descrição (opcional)</label>
              <Textarea placeholder="Objetivo e contexto da calibração..."
                value={newRoom.description} onChange={(e) => setNewRoom((p) => ({ ...p, description: e.target.value }))}
                rows={3} style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }} />
            </div>
            <Button onClick={() => { if (!newRoom.name) return toast.error("Nome é obrigatório."); createRoom.mutate({ name: newRoom.name, description: newRoom.description || undefined }); }}
              disabled={createRoom.isPending} className="w-full" style={{ backgroundColor: "#d9f22a", color: "#001023" }}>
              Criar Sala
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Editar Sala</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Nome da sala *</label>
              <Input value={editRoom.name} onChange={(e) => setEditRoom((p) => ({ ...p, name: e.target.value }))}
                style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Descrição</label>
              <Textarea value={editRoom.description} onChange={(e) => setEditRoom((p) => ({ ...p, description: e.target.value }))}
                rows={3} style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }} />
            </div>
            <Button onClick={() => { if (!editRoom.name) return toast.error("Nome é obrigatório."); updateRoom.mutate({ id: selectedRoom!, name: editRoom.name, description: editRoom.description || undefined }); }}
              disabled={updateRoom.isPending} className="w-full" style={{ backgroundColor: "#d9f22a", color: "#001023" }}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #ef444440", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#ef4444", fontFamily: "Space Grotesk" }}>Excluir Sala</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: "#8aa3c0" }}>
            Tem certeza que deseja excluir <strong style={{ color: "#fdffdf" }}>{room?.name}</strong>? Todos os dados serão removidos permanentemente.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1" style={{ borderColor: "#0a3060", color: "#8aa3c0" }}>Cancelar</Button>
            <Button onClick={() => deleteRoom.mutate({ id: selectedRoom! })} disabled={deleteRoom.isPending} className="flex-1" style={{ backgroundColor: "#ef4444", color: "#fff" }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #22c55e40", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#22c55e", fontFamily: "Space Grotesk" }}>Finalizar Sala</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: "#8aa3c0" }}>
            Ao finalizar <strong style={{ color: "#fdffdf" }}>{room?.name}</strong>, as decisões ficam registradas e a sala passa para "Finalizada". Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowFinalizeConfirm(false)} className="flex-1" style={{ borderColor: "#0a3060", color: "#8aa3c0" }}>Cancelar</Button>
            <Button onClick={() => finalizeRoom.mutate({ id: selectedRoom! })} disabled={finalizeRoom.isPending} className="flex-1" style={{ backgroundColor: "#22c55e", color: "#fff" }}>Finalizar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Participantes da Calibração</DialogTitle></DialogHeader>
          <p className="text-sm mb-3" style={{ color: "#8aa3c0" }}>Selecione os gestores e RH que participarão desta sala:</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(employees ?? []).filter((e) => e.platformRole === "gestor" || e.platformRole === "rh" || (e as any).secondaryPlatformRole === "gestor" || (e as any).secondaryPlatformRole === "rh").map((emp) => {
              const isAdded = participants?.some((p) => p.managerId === emp.id);
              return (
                <button key={emp.id} onClick={() => { if (!isAdded) addParticipant.mutate({ roomId: selectedRoom!, employeeId: emp.id }); }}
                  disabled={isAdded}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                  style={{ backgroundColor: isAdded ? "#22c55e10" : "#001023", borderColor: isAdded ? "#22c55e30" : "#0a3060", opacity: isAdded ? 0.7 : 1 }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}>{emp.name?.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>{emp.name}</p>
                    <p className="text-xs" style={{ color: "#8aa3c0" }}>{emp.jobTitle}</p>
                  </div>
                  {isAdded && <span className="text-xs" style={{ color: "#22c55e" }}>Adicionado</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScopeManager} onOpenChange={setShowScopeManager}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
          <DialogHeader><DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Pessoas a Calibrar — {room?.name}</DialogTitle></DialogHeader>
          <p className="text-sm mb-3" style={{ color: "#8aa3c0" }}>
            Selecione quais colaboradores serão calibrados nesta sala. Filtre por cargo ou área.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-40">
              <Search size={14} className="absolute left-2.5 top-2.5" style={{ color: "#8aa3c0" }} />
              <Input placeholder="Buscar por nome..." value={scopeSearch} onChange={(e) => setScopeSearch(e.target.value)}
                className="pl-8 text-sm" style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }} />
            </div>
            <select value={scopeFilterArea} onChange={(e) => setScopeFilterArea(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}>
              <option value="">Todas as áreas</option>
              {uniqueAreas.map((a) => <option key={a} value={a!}>{a}</option>)}
            </select>
            <select value={scopeFilterJob} onChange={(e) => setScopeFilterJob(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}>
              <option value="">Todos os cargos</option>
              {uniqueJobs.map((j) => <option key={j} value={j!}>{j}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filteredForScope.map((emp) => {
              const inScope = scopeEmployeeIds.has(emp.id);
              return (
                <button key={emp.id}
                  onClick={() => { if (inScope) removeScopeEmployee.mutate({ roomId: selectedRoom!, employeeId: emp.id }); else addScopeEmployee.mutate({ roomId: selectedRoom!, employeeId: emp.id }); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all"
                  style={{ backgroundColor: inScope ? "#d9f22a10" : "#001023", borderColor: inScope ? "#d9f22a40" : "#0a3060" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: inScope ? "#d9f22a20" : "#0a3060", color: inScope ? "#d9f22a" : "#8aa3c0" }}>
                    {emp.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#fdffdf" }}>{emp.name}</p>
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{emp.jobTitle} · {emp.area}</p>
                  </div>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: inScope ? "#d9f22a" : "#8aa3c0" }}>
                    {inScope ? "✓ No escopo" : "Adicionar"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "#0a3060" }}>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>{scopeEmployeeIds.size} pessoa(s) selecionada(s) para esta sala</p>
          </div>
        </DialogContent>
      </Dialog>
    </StellarLayout>
  );
}
