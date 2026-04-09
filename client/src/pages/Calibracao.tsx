import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Users, ChevronRight, Shield, X, UserPlus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NINEBOX_QUADRANTS } from "../../../shared/nineboxData";
import type { NineboxQuadrant } from "../../../shared/nineboxData";

// Grid (renumbered): Performance ↑ Alta=Q7/Q8/Q9 | Média=Q4/Q5/Q6 | Baixa=Q1/Q2/Q3
//                   Potencial → Baixo | Médio | Alto
const GRID_LAYOUT: NineboxQuadrant[][] = [
  ["Q7", "Q8", "Q9"],
  ["Q4", "Q5", "Q6"],
  ["Q1", "Q2", "Q3"],
];

export default function Calibracao() {
  const { user } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [movingEmployee, setMovingEmployee] = useState<{ id: number; name: string } | null>(null);
  const [targetQuadrant, setTargetQuadrant] = useState<NineboxQuadrant | null>(null);

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

  const createRoom = trpc.calibration.createRoom.useMutation({
    onSuccess: () => {
      toast.success("Sala criada!");
      setShowCreate(false);
      setNewRoom({ name: "", description: "" });
      utils.calibration.rooms.invalidate();
    },
    onError: () => toast.error("Erro ao criar sala."),
  });

  const addParticipant = trpc.calibration.addParticipant.useMutation({
    onSuccess: () => {
      toast.success("Participante adicionado!");
      setShowAddParticipant(false);
      utils.calibration.participants.invalidate();
    },
    onError: () => toast.error("Erro ao adicionar participante."),
  });

  const moveEmployee = trpc.ninebox.moveEmployee.useMutation({
    onSuccess: () => {
      toast.success("Colaborador movido no 9-Box!");
      setMovingEmployee(null);
      setTargetQuadrant(null);
      utils.ninebox.allPositions.invalidate();
    },
    onError: () => toast.error("Erro ao mover colaborador."),
  });

  if (platformRole !== "rh") {
    return (
      <StellarLayout title="Calibração">
        <div className="p-6">
          <div
            className="p-8 sm:p-12 rounded-xl border text-center"
            style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
          >
            <Shield size={48} className="mx-auto mb-4" style={{ color: "#0a3060" }} />
            <p className="font-bold text-lg mb-2" style={{ color: "#fdffdf" }}>Acesso restrito</p>
            <p className="text-sm" style={{ color: "#8aa3c0" }}>
              Esta área é exclusiva para o time de RH.
            </p>
          </div>
        </div>
      </StellarLayout>
    );
  }

  const getEmployeeName = (id: number) => employees?.find((e) => e.id === id)?.name ?? "Colaborador";
  const getEmployeeQuadrant = (id: number) =>
    allPositions?.find((p) => p.employeeId === id)?.quadrant as NineboxQuadrant | undefined;

  const quadrantCounts: Record<NineboxQuadrant, number> = {} as any;
  for (const q of Object.keys(NINEBOX_QUADRANTS)) {
    quadrantCounts[q as NineboxQuadrant] = 0;
  }
  for (const pos of allPositions ?? []) {
    if (pos.quadrant in quadrantCounts) {
      quadrantCounts[pos.quadrant as NineboxQuadrant]++;
    }
  }

  const getEmployeesInQuadrant = (q: NineboxQuadrant) =>
    (allPositions ?? [])
      .filter((p) => p.quadrant === q)
      .map((p) => ({ id: p.employeeId, name: getEmployeeName(p.employeeId) }));

  return (
    <StellarLayout title="Comitê de Calibração">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
        {/* Room list or create */}
        {!selectedRoom ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Salas de Calibração
              </h2>
              <Button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                <Plus size={14} />
                Nova sala
              </Button>
            </div>

            {(!rooms || rooms.length === 0) ? (
              <div
                className="p-8 sm:p-12 rounded-xl border text-center"
                style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
              >
                <Building2 size={48} className="mx-auto mb-4" style={{ color: "#0a3060" }} />
                <p className="font-bold text-lg mb-2" style={{ color: "#fdffdf" }}>
                  Nenhuma sala criada
                </p>
                <p className="text-sm mb-4" style={{ color: "#8aa3c0" }}>
                  Crie uma sala de calibração para reunir gestores e alinhar posicionamentos.
                </p>
                <Button
                  onClick={() => setShowCreate(true)}
                  style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                >
                  Criar primeira sala
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoom(r.id)}
                    className="p-5 rounded-xl border text-left transition-all"
                    style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#d9f22a40";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#0a3060";
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}
                      >
                        <Building2 size={18} />
                      </div>
                      <ChevronRight size={16} style={{ color: "#8aa3c0" }} />
                    </div>
                    <p className="font-bold mb-1" style={{ color: "#fdffdf" }}>{r.name}</p>
                    {r.description && (
                      <p className="text-xs mb-3" style={{ color: "#8aa3c0" }}>{r.description}</p>
                    )}
                    <p className="text-xs" style={{ color: "#4a6a8a" }}>
                      Criada em {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Room detail with 9box */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: "#8aa3c0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
              >
                ← Voltar
              </button>
              <span style={{ color: "#0a3060" }}>/</span>
              <h2 className="font-bold" style={{ color: "#fdffdf" }}>{room?.name}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* 9box with drag-to-move */}
              <div className="lg:col-span-2">
                <div
                  className="p-4 rounded-xl border mb-4"
                  style={{ backgroundColor: "#001830", borderColor: "#d9f22a30" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GripVertical size={14} style={{ color: "#d9f22a" }} />
                    <p className="text-sm font-semibold" style={{ color: "#d9f22a" }}>
                      Modo Calibração: clique em um colaborador para movê-lo de quadrante
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>
                    Somente o RH pode mover colaboradores durante o comitê de calibração.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                  {GRID_LAYOUT.flat().map((q) => {
                    const info = NINEBOX_QUADRANTS[q];
                    const emps = getEmployeesInQuadrant(q);
                    const isTarget = targetQuadrant === q;

                    return (
                      <div
                        key={q}
                        className="relative p-3 rounded-xl border min-h-[100px] transition-all"
                        style={{
                          backgroundColor: isTarget ? `${info.color}20` : "#001830",
                          borderColor: isTarget ? info.color : "#0a3060",
                        }}
                        onDragOver={(e) => { e.preventDefault(); setTargetQuadrant(q); }}
                        onDragLeave={() => setTargetQuadrant(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (movingEmployee && targetQuadrant) {
                            moveEmployee.mutate({
                              employeeId: movingEmployee.id,
                              quadrant: targetQuadrant,
                              cycleId,
                              roomId: selectedRoom,
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black" style={{ color: info.color }}>{q}</span>
                          {emps.length > 0 && (
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${info.color}20`, color: info.color }}
                            >
                              {emps.length}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#fdffdf" }}>{info.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {emps.map((emp) => (
                            <div
                              key={emp.id}
                              draggable
                              onDragStart={() => setMovingEmployee(emp)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-grab active:cursor-grabbing"
                              style={{ backgroundColor: `${info.color}20`, color: info.color }}
                              title={`Arrastar ${emp.name}`}
                            >
                              <GripVertical size={10} />
                              {emp.name.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
                      Participantes
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddParticipant(true)}
                      className="flex items-center gap-1"
                      style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
                    >
                      <UserPlus size={12} />
                      Adicionar
                    </Button>
                  </div>
                  {(!participants || participants.length === 0) ? (
                    <p className="text-xs text-center py-4" style={{ color: "#8aa3c0" }}>
                      Nenhum participante ainda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {participants.map((p) => {
                    const emp = employees?.find((e) => e.id === p.managerId);
                      return (
                        <div
                          key={p.id}
                            className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ backgroundColor: "#001023" }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}
                            >
                              {emp?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium" style={{ color: "#fdffdf" }}>{emp?.name}</p>
                              <p className="text-xs" style={{ color: "#8aa3c0" }}>{emp?.jobTitle}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                >
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#8aa3c0" }}>
                    Legenda
                  </p>
                  {[
                    { label: "Zona Crítica", color: "#ef4444", qs: "Q1, Q2, Q4" },
                    { label: "Mantenedores", color: "#3b82f6", qs: "Q3, Q5, Q7" },
                    { label: "Talentos", color: "#d9f22a", qs: "Q6, Q8, Q9" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-xs" style={{ color: "#fdffdf" }}>{item.label}</span>
                      </div>
                      <span className="text-xs" style={{ color: "#8aa3c0" }}>{item.qs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Create Room Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Nova Sala de Calibração
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                  Nome da sala *
                </label>
                <Input
                  placeholder="Ex: Calibração Q1 2026 - Marketing"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                  Descrição (opcional)
                </label>
                <Textarea
                  placeholder="Objetivo e contexto da calibração..."
                  value={newRoom.description}
                  onChange={(e) => setNewRoom((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                />
              </div>
              <Button
                onClick={() => {
                  if (!newRoom.name) return toast.error("Nome é obrigatório.");
                  createRoom.mutate({ name: newRoom.name, description: newRoom.description || undefined });
                }}
                disabled={createRoom.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                Criar sala
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Participant Dialog */}
        <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
          <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Adicionar Participante
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                Selecione os gestores que participarão desta calibração:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(employees ?? [])
                    .filter((e) => e.platformRole === "gestor" || e.platformRole === "rh")                  .map((emp) => {
                    const isAdded = participants?.some((p) => p.managerId === emp.id);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => {
                          if (!isAdded) {
                            addParticipant.mutate({ roomId: selectedRoom!, employeeId: emp.id });
                          }
                        }}
                        disabled={isAdded}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                        style={{
                          backgroundColor: isAdded ? "#22c55e10" : "#001023",
                          borderColor: isAdded ? "#22c55e30" : "#0a3060",
                          opacity: isAdded ? 0.7 : 1,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}
                        >
                          {emp.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>{emp.name}</p>
                          <p className="text-xs" style={{ color: "#8aa3c0" }}>{emp.jobTitle}</p>
                        </div>
                        {isAdded && (
                          <span className="text-xs" style={{ color: "#22c55e" }}>Adicionado</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StellarLayout>
  );
}
