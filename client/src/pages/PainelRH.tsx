import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Building2, Search, Calendar, ChevronDown, ChevronUp,
  Shield, User, UserCheck, Pencil, Check, X, Download, Eye, EyeOff,
  UserX, UserPlus, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type EmployeeForm = {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  area: string;
  diretoria: string;
  managerId: string;
  platformRole: "rh" | "gestor" | "colaborador";
  accessPassword: string;
};

const EMPTY_FORM: EmployeeForm = {
  name: "",
  email: "",
  jobTitle: "",
  department: "",
  area: "",
  diretoria: "",
  managerId: "",
  platformRole: "colaborador",
  accessPassword: "",
};

export default function PainelRH() {
  const { user } = useStellarAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showPhaseEditor, setShowPhaseEditor] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [phaseEdits, setPhaseEdits] = useState<Record<number, { startDate: string; endDate: string; titulo: string; descricao: string }>>({});
  const [showInactive, setShowInactive] = useState(false);

  const utils = trpc.useUtils();

  const { data: employees, refetch: refetchEmployees } = trpc.employees.allWithManager.useQuery();
  const { data: calibrationRooms } = trpc.calibration.rooms.useQuery({});
  const { data: activeCycle } = trpc.cycles.active.useQuery();
  const { data: cyclePhases, refetch: refetchPhases } = trpc.cyclePhases.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle?.id }
  );

  const updatePhase = trpc.cyclePhases.update.useMutation({
    onSuccess: () => {
      toast.success("Fase atualizada com sucesso!");
      setEditingPhaseId(null);
      refetchPhases();
      utils.cyclePhases.list.invalidate();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Colaborador criado com sucesso!");
      setShowAddDialog(false);
      setForm(EMPTY_FORM);
      refetchEmployees();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateEmployee = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Colaborador atualizado com sucesso!");
      setEditingEmployee(null);
      setForm(EMPTY_FORM);
      refetchEmployees();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deactivateEmployee = trpc.employees.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Colaborador desativado.");
      refetchEmployees();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const phaseColors = ["#1840eb", "#d9f22a", "#a855f7", "#f97316", "#22c55e", "#eab308", "#d9f22a"];

  const startEditPhase = (phase: NonNullable<typeof cyclePhases>[0]) => {
    setEditingPhaseId(phase.id);
    setPhaseEdits((prev) => ({
      ...prev,
      [phase.id]: {
        startDate: format(new Date(phase.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(phase.endDate), "yyyy-MM-dd"),
        titulo: phase.titulo,
        descricao: phase.descricao ?? "",
      },
    }));
  };

  const savePhase = (phaseId: number) => {
    const edits = phaseEdits[phaseId];
    if (!edits) return;
    updatePhase.mutate({
      id: phaseId,
      startDate: new Date(edits.startDate + "T00:00:00").toISOString(),
      endDate: new Date(edits.endDate + "T23:59:59").toISOString(),
      titulo: edits.titulo,
      descricao: edits.descricao,
    });
  };

  const openEditEmployee = (emp: NonNullable<typeof employees>[0]) => {
    setEditingEmployee(emp.id);
    setForm({
      name: emp.name ?? "",
      email: emp.email ?? "",
      jobTitle: emp.jobTitle ?? "",
      department: emp.department ?? "",
      area: (emp as any).area ?? "",
      diretoria: (emp as any).diretoria ?? "",
      managerId: emp.managerId ? String(emp.managerId) : "",
      platformRole: (emp.platformRole as any) ?? "colaborador",
      accessPassword: (emp as any).accessPassword ?? "",
    });
  };

  const handleSaveEmployee = () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório.");
    if (editingEmployee) {
      updateEmployee.mutate({
        id: editingEmployee,
        name: form.name,
        email: form.email || undefined,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        area: form.area || undefined,
        diretoria: form.diretoria || undefined,
        managerId: form.managerId ? Number(form.managerId) : null,
        platformRole: form.platformRole,
        accessPassword: form.accessPassword || undefined,
      });
    } else {
      createEmployee.mutate({
        name: form.name,
        email: form.email || undefined,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        area: form.area || undefined,
        diretoria: form.diretoria || undefined,
        managerId: form.managerId ? Number(form.managerId) : undefined,
        platformRole: form.platformRole,
        accessPassword: form.accessPassword || undefined,
      });
    }
  };

  if (platformRole !== "rh") {
    return (
      <StellarLayout title="Painel RH">
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

  const activeEmployees = employees?.filter((e) => (e as any).isActive !== false) ?? [];
  const inactiveEmployees = employees?.filter((e) => (e as any).isActive === false) ?? [];
  const displayList = showInactive ? inactiveEmployees : activeEmployees;

  const filtered = displayList.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    (e as any).area?.toLowerCase().includes(search.toLowerCase()) ||
    (e as any).diretoria?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = {
    rh: { color: "#d9f22a", bg: "#d9f22a15", label: "RH" },
    gestor: { color: "#1840eb", bg: "#1840eb15", label: "Gestor" },
    colaborador: { color: "#8aa3c0", bg: "#8aa3c015", label: "Colaborador" },
  };

  const inputStyle = { backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" };
  const labelStyle = { color: "#8aa3c0" };

  const EmployeeFormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Nome Completo *</label>
          <Input
            placeholder="Nome completo"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>E-mail</label>
          <Input
            placeholder="email@stellar.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Cargo</label>
          <Input
            placeholder="Ex: Analista de Marketing"
            value={form.jobTitle}
            onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Departamento</label>
          <Input
            placeholder="Ex: Marketing"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Área</label>
          <Input
            placeholder="Ex: Produto"
            value={form.area}
            onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Diretoria</label>
          <Input
            placeholder="Ex: Diretoria de Tecnologia"
            value={form.diretoria}
            onChange={(e) => setForm((p) => ({ ...p, diretoria: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Nome do Líder Direto</label>
        <select
          value={form.managerId}
          onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="">Nenhum</option>
          {activeEmployees
            .filter((e) => e.platformRole === "gestor" && e.id !== editingEmployee)
            .map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Perfil de Acesso</label>
        <select
          value={form.platformRole}
          onChange={(e) => setForm((p) => ({ ...p, platformRole: e.target.value as any }))}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="colaborador">Colaborador</option>
          <option value="gestor">Gestor</option>
          <option value="rh">RH</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Senha de Acesso <span style={{ color: '#4a6080', fontWeight: 400 }}>(registro interno)</span></label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Senha de acesso à plataforma"
            value={form.accessPassword}
            onChange={(e) => setForm((p) => ({ ...p, accessPassword: e.target.value }))}
            style={{ ...inputStyle, paddingRight: "2.5rem" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#8aa3c0" }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <StellarLayout title="Painel RH">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Ativos", count: activeEmployees.length, color: "#fdffdf", icon: <Users size={18} /> },
            { label: "Gestores", count: activeEmployees.filter((e) => e.platformRole === "gestor").length, color: "#1840eb", icon: <UserCheck size={18} /> },
            { label: "Colaboradores", count: activeEmployees.filter((e) => e.platformRole === "colaborador").length, color: "#8aa3c0", icon: <User size={18} /> },
            { label: "Comitês", count: calibrationRooms?.length ?? 0, color: "#d9f22a", icon: <Building2 size={18} /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border"
              style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>{stat.label}</p>
              </div>
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8aa3c0" }} />
            <Input
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
            />
          </div>

          <Button
            onClick={() => { setEditingEmployee(null); setForm(EMPTY_FORM); setShowAddDialog(true); }}
            className="flex items-center gap-2"
            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
          >
            <UserPlus size={14} />
            Novo colaborador
          </Button>

          <Link href="/calibracao">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              style={{ borderColor: "#0a3060", color: "#fdffdf", backgroundColor: "transparent" }}
            >
              <Building2 size={14} />
              Comitês
            </Button>
          </Link>

          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/export/avaliacoes");
                if (res.status === 403) { toast.error("Acesso negado. Apenas o RH pode exportar."); return; }
                if (res.status === 404) { toast.error("Nenhum ciclo ativo encontrado para exportar."); return; }
                if (!res.ok) { toast.error("Erro ao gerar o relatório. Tente novamente."); return; }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `avaliacoes-stellar-${new Date().toISOString().slice(0,10)}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Relatório exportado com sucesso!");
              } catch {
                toast.error("Falha na conexão ao exportar. Tente novamente.");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#d9f22a" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#00213f"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830"; }}
          >
            <FileSpreadsheet size={14} />
            Exportar Excel
          </button>

          <button
            onClick={() => setShowInactive((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: showInactive ? "#0a3060" : "transparent",
              border: "1px solid #0a3060",
              color: showInactive ? "#fdffdf" : "#8aa3c0",
            }}
          >
            <UserX size={14} />
            {showInactive ? "Ver ativos" : "Ver inativos"}
          </button>
        </div>

        {/* Employee table */}
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#0a3060" }}>
        <div
          className="rounded-xl overflow-hidden min-w-[640px]"
          style={{ backgroundColor: "#001830" }}
        >
          <div
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#8aa3c0", borderBottom: "1px solid #0a3060", backgroundColor: "#001023" }}
          >
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-3">Nome</span>
              <span className="col-span-2">Cargo</span>
              <span className="col-span-2">Área / Diretoria</span>
              <span className="col-span-2">Líder Direto</span>
              <span className="col-span-2">Perfil</span>
              <span className="col-span-1 text-right">Ações</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
              <p className="text-sm" style={{ color: "#8aa3c0" }}>
                {showInactive ? "Nenhum colaborador inativo encontrado." : "Nenhum colaborador encontrado."}
              </p>
            </div>
          ) : (
            filtered.map((emp, i) => {
              const role = (emp.platformRole ?? "colaborador") as keyof typeof roleColors;
              const rc = roleColors[role] ?? roleColors.colaborador;
              const isInactive = (emp as any).isActive === false;

              return (
                <div
                  key={emp.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid #0a3060" : "none",
                    opacity: isInactive ? 0.5 : 1,
                  }}
                >
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "#001023", color: "#d9f22a" }}
                    >
                      {emp.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#fdffdf" }}>{emp.name}</p>
                      <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{emp.email}</p>
                    </div>
                  </div>

                  <div className="col-span-2 min-w-0">
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{emp.jobTitle ?? "Não informado"}</p>
                    <p className="text-xs truncate" style={{ color: "#4a6080" }}>{emp.department ?? ""}</p>
                  </div>

                  <div className="col-span-2 min-w-0">
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{(emp as any).area ?? "Não informado"}</p>
                    <p className="text-xs truncate" style={{ color: "#4a6080" }}>{(emp as any).diretoria ?? ""}</p>
                  </div>

                  <div className="col-span-2 min-w-0">
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>
                      {(emp as any).managerName ?? "Sem líder"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: rc.bg, color: rc.color }}
                    >
                      {rc.label}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {!isInactive && (
                      <button
                        onClick={() => { openEditEmployee(emp); setShowAddDialog(true); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#8aa3c0" }}
                        title="Editar"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {!isInactive && (
                      <button
                        onClick={() => {
                          if (confirm(`Desativar ${emp.name}? Esta ação pode ser revertida.`)) {
                            deactivateEmployee.mutate({ id: emp.id });
                          }
                        }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#8aa3c0" }}
                        title="Desativar"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>

        {/* Cycle Phase Editor */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <button
            onClick={() => setShowPhaseEditor((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ borderBottom: showPhaseEditor ? "1px solid #0a3060" : "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#00213f"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}
              >
                <Calendar size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                  Configurar Datas do Ciclo
                </p>
                <p className="text-xs" style={{ color: "#8aa3c0" }}>
                  {activeCycle ? `Ciclo ativo: ${activeCycle.name}` : "Nenhum ciclo ativo"} · {cyclePhases?.length ?? 0} fases configuradas
                </p>
              </div>
            </div>
            {showPhaseEditor ? <ChevronUp size={16} style={{ color: "#8aa3c0" }} /> : <ChevronDown size={16} style={{ color: "#8aa3c0" }} />}
          </button>

          {showPhaseEditor && (
            <div className="p-5 space-y-3">
              {!activeCycle ? (
                <p className="text-sm text-center py-6" style={{ color: "#8aa3c0" }}>Nenhum ciclo ativo encontrado.</p>
              ) : !cyclePhases || cyclePhases.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#8aa3c0" }}>Nenhuma fase configurada para este ciclo.</p>
              ) : (
                cyclePhases.map((phase, idx) => {
                  const color = phaseColors[idx] ?? "#8aa3c0";
                  const isEditing = editingPhaseId === phase.id;
                  const edits = phaseEdits[phase.id];

                  return (
                    <div
                      key={phase.id}
                      className="rounded-xl border p-4"
                      style={{
                        backgroundColor: "#001023",
                        borderColor: isEditing ? `${color}60` : "#0a3060",
                        boxShadow: isEditing ? `0 0 0 1px ${color}30` : "none",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {phase.phaseNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input
                                value={edits?.titulo ?? phase.titulo}
                                onChange={(e) => setPhaseEdits((p) => ({ ...p, [phase.id]: { ...p[phase.id]!, titulo: e.target.value } }))}
                                className="text-sm font-semibold h-8 mb-1"
                                style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                              />
                            ) : (
                              <p className="text-sm font-semibold truncate" style={{ color: "#fdffdf" }}>{phase.titulo}</p>
                            )}
                            {phase.isContinuous && (
                              <span
                                className="inline-block text-xs px-2 py-0.5 rounded-full mt-0.5"
                                style={{ backgroundColor: `${color}15`, color }}
                              >
                                Contínuo
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => savePhase(phase.id)}
                                disabled={updatePhase.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                              >
                                <Check size={12} />
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingPhaseId(null)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: "#0a3060", color: "#8aa3c0" }}
                              >
                                <X size={12} />
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditPhase(phase)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#8aa3c0" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#d9f22a40"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#0a3060"; }}
                            >
                              <Pencil size={12} />
                              Editar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Início</label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={edits?.startDate ?? ""}
                              onChange={(e) => setPhaseEdits((p) => ({ ...p, [phase.id]: { ...p[phase.id]!, startDate: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf", colorScheme: "dark" }}
                            />
                          ) : (
                            <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>
                              {format(new Date(phase.startDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Fim</label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={edits?.endDate ?? ""}
                              onChange={(e) => setPhaseEdits((p) => ({ ...p, [phase.id]: { ...p[phase.id]!, endDate: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf", colorScheme: "dark" }}
                            />
                          ) : (
                            <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>
                              {format(new Date(phase.endDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-3">
                          <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>Descrição</label>
                          <textarea
                            value={edits?.descricao ?? ""}
                            onChange={(e) => setPhaseEdits((p) => ({ ...p, [phase.id]: { ...p[phase.id]!, descricao: e.target.value } }))}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Add / Edit Employee Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setEditingEmployee(null); setForm(EMPTY_FORM); } }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
              </DialogTitle>
            </DialogHeader>

            <EmployeeFormFields />

            <div className="flex gap-3 mt-2">
              <Button
                onClick={handleSaveEmployee}
                disabled={createEmployee.isPending || updateEmployee.isPending}
                className="flex-1"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {editingEmployee ? "Salvar alterações" : "Criar colaborador"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowAddDialog(false); setEditingEmployee(null); setForm(EMPTY_FORM); }}
                style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </StellarLayout>
  );
}
