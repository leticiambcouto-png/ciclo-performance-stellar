import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Building2, Search, Calendar, ChevronDown, ChevronUp,
  Shield, User, UserCheck, Pencil, Check, X, Download, Eye, EyeOff,
  UserX, UserPlus, FileSpreadsheet, Upload, AlertCircle, CheckCircle2,
  BarChart2, Grid3X3, MessageSquare, TrendingUp, Layers, BookOpen,
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
  secondaryPlatformRole: "rh" | "gestor" | "colaborador" | "";
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
  secondaryPlatformRole: "",
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
  const [activeSection, setActiveSection] = useState<"colaboradores" | "fases" | "relatorios">("colaboradores");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>>>([])
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; results: Array<{ row: number; name: string; status: string; error?: string }> } | null>(null);

  const utils = trpc.useUtils();

  const { data: employees, refetch: refetchEmployees } = trpc.employees.allWithManager.useQuery();
  const { data: calibrationRooms } = trpc.calibration.rooms.useQuery({});
  const { data: activeCycle } = trpc.cycles.active.useQuery();
  const { data: cyclePhases, refetch: refetchPhases } = trpc.cyclePhases.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle?.id }
  );
  const { data: allNineboxPositions } = trpc.ninebox.allPositions.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle?.id }
  );
  const { data: allConsequences } = trpc.calibration.allConsequences.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle?.id }
  );
  const { data: allFlashFeedbacks } = trpc.flashFeedback.allFeedbacks.useQuery();

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

  const importBulk = trpc.employees.importBulk.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      refetchEmployees();
      if (result.imported > 0) {
        toast.success(`${result.imported} colaborador(es) importado(s) com sucesso!`);
      }
    },
    onError: (e) => toast.error(`Erro na importação: ${e.message}`),
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
      secondaryPlatformRole: ((emp as any).secondaryPlatformRole as any) ?? "",
      accessPassword: (emp as any).accessPassword ?? "",
    });
  };

  const downloadTemplate = () => {
    const header = "nome,email,cargo,departamento,area,diretoria,perfil_acesso,senha";
    const example = "João Silva,joao@empresa.com,Analista,Marketing,Produto,Diretoria de Tecnologia,colaborador,Senha@2026";
    const note = "# perfil_acesso: colaborador | gestor | rh";
    const csv = `${header}\n${example}\n${note}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_colaboradores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
      if (lines.length < 2) { setCsvErrors(["Arquivo vazio ou sem dados."]); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredCols = ["nome"];
      const missing = requiredCols.filter((c) => !headers.includes(c));
      if (missing.length) { setCsvErrors([`Coluna obrigatória ausente: ${missing.join(", ")}`]); return; }
      const rows: Array<Record<string, string>> = [];
      const errs: string[] = [];
      const seenEmails = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
        const rowErrors: string[] = [];
        if (!row["nome"]) rowErrors.push("nome obrigatório");
        const perfil = row["perfil_acesso"] || "colaborador";
        if (!["rh", "gestor", "colaborador"].includes(perfil)) {
          rowErrors.push(`perfil_acesso inválido '${perfil}'`);
        }
        const emailKey = row["email"]?.toLowerCase().trim();
        if (emailKey) {
          if (seenEmails.has(emailKey)) rowErrors.push(`e-mail '${row["email"]}' duplicado no CSV`);
          else seenEmails.add(emailKey);
        }
        row["_errors"] = rowErrors.join(" | ");
        if (rowErrors.length > 0) {
          errs.push(`Linha ${i + 1} (${row["nome"] || "sem nome"}): ${rowErrors.join(", ")}`);
        }
        rows.push(row);
      }
      setCsvErrors(errs);
      setCsvPreview(rows);
      setImportResult(null);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = () => {
    const validRows = csvPreview.filter((r) => !r["_errors"]);
    if (!validRows.length) return;
    const rows = validRows.map((r) => ({
      name: r["nome"] ?? "",
      email: r["email"] || undefined,
      jobTitle: r["cargo"] || undefined,
      department: r["departamento"] || undefined,
      area: r["area"] || undefined,
      diretoria: r["diretoria"] || undefined,
      platformRole: (r["perfil_acesso"] as "rh" | "gestor" | "colaborador") || "colaborador",
      accessPassword: r["senha"] || undefined,
    }));
    importBulk.mutate({ rows });
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
        secondaryPlatformRole: (form.secondaryPlatformRole || null) as "rh" | "gestor" | "colaborador" | null | undefined,
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
        secondaryPlatformRole: (form.secondaryPlatformRole || null) as "rh" | "gestor" | "colaborador" | null | undefined,
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

  // Helper maps for new columns
  const nineboxByEmployee = new Map<number, { quadrant: string; isManuallyAdjusted: boolean }>();
  (allNineboxPositions ?? []).forEach((p) => {
    nineboxByEmployee.set(p.employeeId, { quadrant: p.quadrant, isManuallyAdjusted: p.isManuallyAdjusted });
  });

  const consequenceByEmployee = new Map<number, string>();
  (allConsequences ?? []).forEach((c) => {
    consequenceByEmployee.set(c.employeeId, c.consequence);
  });

  // Flash feedbacks: count completed per receiverId in current cycle
  const ffCompletedByEmployee = new Map<number, number>();
  const ffTotalByEmployee = new Map<number, number>();
  (allFlashFeedbacks ?? []).forEach((ff) => {
    const rid = ff.receiverId;
    ffTotalByEmployee.set(rid, (ffTotalByEmployee.get(rid) ?? 0) + 1);
    if (ff.status === "completed") {
      ffCompletedByEmployee.set(rid, (ffCompletedByEmployee.get(rid) ?? 0) + 1);
    }
  });

  // Expected flash feedbacks per semester by quadrant
  const ffExpectedBySemester = (quadrant: string): number => {
    if (quadrant === "Q1") return 6; // weekly ~6/semester
    if (quadrant === "Q2" || quadrant === "Q8" || quadrant === "Q9") return 3; // monthly
    return 2; // bimestral
  };

  const consequenceLabel: Record<string, { label: string; color: string }> = {
    merito: { label: "Mérito", color: "#22c55e" },
    promocao: { label: "Promoção", color: "#1840eb" },
    desligamento: { label: "Desligamento", color: "#ef4444" },
    plano_recuperacao: { label: "Plano de Rec.", color: "#f97316" },
    nenhuma: { label: "Nenhuma", color: "#8aa3c0" },
  };

  const quadrantColor = (q: string): string => {
    if (["Q7", "Q8", "Q9"].includes(q)) return "#22c55e";
    if (["Q4", "Q5", "Q6"].includes(q)) return "#eab308";
    return "#ef4444";
  };

  const roleColors = {
    rh: { color: "#d9f22a", bg: "#d9f22a15", label: "RH" },
    gestor: { color: "#1840eb", bg: "#1840eb15", label: "Gestor" },
    colaborador: { color: "#8aa3c0", bg: "#8aa3c015", label: "Colaborador" },
  };

  const inputStyle = { backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" };
  const labelStyle = { color: "#8aa3c0" };

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

        {/* Section Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
          {([
            { id: "colaboradores" as const, label: "Colaboradores", icon: <Users size={14} /> },
            { id: "fases" as const, label: "Fases do Ciclo", icon: <Calendar size={14} /> },
            { id: "relatorios" as const, label: "Relatórios", icon: <BarChart2 size={14} /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center"
              style={{
                backgroundColor: activeSection === tab.id ? "#d9f22a" : "transparent",
                color: activeSection === tab.id ? "#001023" : "#8aa3c0",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions bar */}
        {activeSection === "colaboradores" && <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={() => { setShowImportDialog(true); setCsvPreview([]); setCsvErrors([]); setImportResult(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#d9f22a40"; (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#0a3060"; (e.currentTarget as HTMLButtonElement).style.color = "#fdffdf"; }}
          >
            <Upload size={14} />
            Importar CSV
          </button>

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
        </div>}

        {activeSection === "colaboradores" && <>{/* Employee table */}
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#0a3060" }}>
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#001830", minWidth: "1100px" }}
        >
          <div
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#8aa3c0", borderBottom: "1px solid #0a3060", backgroundColor: "#001023" }}
          >
            <div className="grid gap-2" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1fr 1.5fr 0.8fr" }}>
              <span>Nome</span>
              <span>Cargo / Área</span>
              <span>Líder Direto</span>
              <span>Perfil</span>
              <span>9-Box Inicial</span>
              <span>9-Box Calibrado</span>
              <span>Consequência</span>
              <span>Flash Feedbacks</span>
              <span className="text-right">Ações</span>
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
              const nineboxData = nineboxByEmployee.get(emp.id);
              const initialQuadrant = nineboxData && !nineboxData.isManuallyAdjusted ? nineboxData.quadrant : null;
              const calibratedQuadrant = nineboxData && nineboxData.isManuallyAdjusted ? nineboxData.quadrant : null;
              // If manually adjusted, initial is unknown; if not adjusted, both show same
              const displayInitial = nineboxData ? (nineboxData.isManuallyAdjusted ? "—" : nineboxData.quadrant) : "—";
              const displayCalibrated = nineboxData && nineboxData.isManuallyAdjusted ? nineboxData.quadrant : (nineboxData ? nineboxData.quadrant : "—");
              const consq = consequenceByEmployee.get(emp.id) ?? null;
              const consqInfo = consq ? (consequenceLabel[consq] ?? null) : null;
              const ffCompleted = ffCompletedByEmployee.get(emp.id) ?? 0;
              const ffTotal = ffTotalByEmployee.get(emp.id) ?? 0;
              const ffExpected = nineboxData ? ffExpectedBySemester(nineboxData.quadrant) : 2;

              return (
                <div
                  key={emp.id}
                  className="grid gap-2 px-4 py-3 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr 0.8fr",
                    borderBottom: i < filtered.length - 1 ? "1px solid #0a3060" : "none",
                    opacity: isInactive ? 0.5 : 1,
                  }}
                >
                  {/* Nome */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#001023", color: "#d9f22a" }}
                    >
                      {emp.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "#fdffdf" }}>{emp.name}</p>
                      <p className="text-xs truncate" style={{ color: "#4a6080" }}>{emp.email}</p>
                    </div>
                  </div>

                  {/* Cargo / Área */}
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{emp.jobTitle ?? "—"}</p>
                    <p className="text-xs truncate" style={{ color: "#4a6080" }}>{(emp as any).area ?? ""}</p>
                  </div>

                  {/* Líder */}
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ color: "#8aa3c0" }}>{(emp as any).managerName ?? "Sem líder"}</p>
                  </div>

                  {/* Perfil */}
                  <div>
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: rc.bg, color: rc.color }}
                    >
                      {rc.label}
                    </span>
                  </div>

                  {/* 9-Box Inicial */}
                  <div>
                    {displayInitial !== "—" ? (
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${quadrantColor(displayInitial)}20`, color: quadrantColor(displayInitial), border: `1px solid ${quadrantColor(displayInitial)}40` }}
                      >
                        {displayInitial}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#4a6080" }}>—</span>
                    )}
                  </div>

                  {/* 9-Box Calibrado */}
                  <div>
                    {displayCalibrated !== "—" ? (
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${quadrantColor(displayCalibrated)}20`, color: quadrantColor(displayCalibrated), border: `1px solid ${quadrantColor(displayCalibrated)}40` }}
                      >
                        {displayCalibrated}
                        {nineboxData?.isManuallyAdjusted && (
                          <span className="ml-1 text-xs" title="Calibrado manualmente">✓</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#4a6080" }}>—</span>
                    )}
                  </div>

                  {/* Consequência */}
                  <div>
                    {consqInfo ? (
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: `${consqInfo.color}20`, color: consqInfo.color, border: `1px solid ${consqInfo.color}40` }}
                      >
                        {consqInfo.label}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#4a6080" }}>Pendente</span>
                    )}
                  </div>

                  {/* Flash Feedbacks */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold"
                        style={{ color: ffCompleted >= ffExpected ? "#22c55e" : ffCompleted > 0 ? "#eab308" : "#ef4444" }}
                      >
                        {ffCompleted}/{ffExpected}
                      </span>
                      <span className="text-xs" style={{ color: "#4a6080" }}>realizados</span>
                    </div>
                    <div className="w-full rounded-full h-1 mt-1" style={{ backgroundColor: "#0a3060" }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (ffCompleted / ffExpected) * 100)}%`,
                          backgroundColor: ffCompleted >= ffExpected ? "#22c55e" : ffCompleted > 0 ? "#eab308" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-end gap-1">
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
        </>
        }

        {activeSection === "fases" && <>
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
        </>
        }

        {/* Relatórios Section */}
        {activeSection === "relatorios" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black mb-1" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Relatórios de Gestão</h2>
              <p className="text-sm" style={{ color: "#8aa3c0" }}>Exporte dados do ciclo atual em formato XLSX para análise e apresentação.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                {
                  id: "colaboradores",
                  title: "Colaboradores",
                  description: "Lista completa com cargo, área, diretoria, líder e perfil de acesso.",
                  icon: <Users size={20} />,
                  color: "#8aa3c0",
                  endpoint: "/api/export/colaboradores",
                  filename: "colaboradores",
                },
                {
                  id: "avaliacoes",
                  title: "Avaliações",
                  description: "Notas por dimensão (Performance e Cultura) com comentários do gestor.",
                  icon: <TrendingUp size={20} />,
                  color: "#1840eb",
                  endpoint: "/api/export/avaliacoes",
                  filename: "avaliacoes",
                },
                {
                  id: "ninebox",
                  title: "9-Box",
                  description: "Posicionamento de cada colaborador com quadrante inicial e calibrado.",
                  icon: <Grid3X3 size={20} />,
                  color: "#d9f22a",
                  endpoint: "/api/export/ninebox",
                  filename: "ninebox",
                },
                {
                  id: "flash-feedbacks",
                  title: "Flash Feedbacks",
                  description: "Registros de FFs realizados com data, gestor, colaborador e pauta.",
                  icon: <MessageSquare size={20} />,
                  color: "#22c55e",
                  endpoint: "/api/export/flash-feedbacks",
                  filename: "flash-feedbacks",
                },
                {
                  id: "consequencias",
                  title: "Gestão de Consequência",
                  description: "Decisões de calibração: promoção, mérito, desligamento e plano de recuperação.",
                  icon: <Layers size={20} />,
                  color: "#f97316",
                  endpoint: "/api/export/consequencias",
                  filename: "consequencias",
                },
                {
                  id: "painel-geral",
                  title: "Painel Geral Consolidado",
                  description: "Visão completa: colaborador + avaliação + 9-Box + consequência em uma planilha.",
                  icon: <BookOpen size={20} />,
                  color: "#a855f7",
                  endpoint: "/api/export/painel-geral",
                  filename: "painel-geral",
                },
              ]).map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border p-5 flex flex-col gap-4"
                  style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${report.color}15`, color: report.color }}
                    >
                      {report.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>{report.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{report.description}</p>
                    </div>
                  </div>
                  <button
                    disabled={exportLoading === report.id}
                    onClick={async () => {
                      setExportLoading(report.id);
                      try {
                        const res = await fetch(report.endpoint);
                        if (res.status === 403) { toast.error("Acesso negado. Apenas o RH pode exportar."); return; }
                        if (res.status === 404) { toast.error("Nenhum ciclo ativo encontrado."); return; }
                        if (!res.ok) { toast.error("Erro ao gerar o relatório. Tente novamente."); return; }
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${report.filename}-stellar-${new Date().toISOString().slice(0,10)}.xlsx`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success(`Relatório "${report.title}" exportado com sucesso!`);
                      } catch {
                        toast.error("Falha na conexão ao exportar. Tente novamente.");
                      } finally {
                        setExportLoading(null);
                      }
                    }}
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full"
                    style={{
                      backgroundColor: exportLoading === report.id ? `${report.color}30` : `${report.color}15`,
                      color: report.color,
                      border: `1px solid ${report.color}40`,
                      opacity: exportLoading === report.id ? 0.7 : 1,
                      cursor: exportLoading === report.id ? "not-allowed" : "pointer",
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    {exportLoading === report.id ? "Gerando..." : "Exportar XLSX"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                        .filter((e) => {
                          // Include anyone with gestor as primary OR secondary role
                          const isGestor =
                            e.platformRole === "gestor" ||
                            (e as any).secondaryPlatformRole === "gestor";
                          return isGestor && e.id !== editingEmployee;
                        })
                        .map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                  </div>
            
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={labelStyle}>Perfil Principal</label>
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
                      <label className="text-xs font-semibold mb-1 block" style={labelStyle}>
                        Papel Secundário <span style={{ color: '#4a6080', fontWeight: 400 }}>(opcional)</span>
                      </label>
                      <select
                        value={form.secondaryPlatformRole}
                        onChange={(e) => setForm((p) => ({ ...p, secondaryPlatformRole: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={inputStyle}
                      >
                        <option value="">Nenhum</option>
                        {form.platformRole !== "colaborador" && <option value="colaborador">Colaborador</option>}
                        {form.platformRole !== "gestor" && <option value="gestor">Gestor</option>}
                        {form.platformRole !== "rh" && <option value="rh">RH</option>}
                      </select>
                      <p className="text-xs mt-1" style={{ color: '#4a6080' }}>Ex: RH que também lidera um time</p>
                    </div>
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

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setCsvPreview([]); setCsvErrors([]); setImportResult(null); } }}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>Importar Colaboradores via CSV</DialogTitle>
          </DialogHeader>

          {/* Step 1: Download template */}
          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}>
            <p className="text-sm font-semibold" style={{ color: "#8aa3c0" }}>1. Baixe o template CSV</p>
            <p className="text-xs" style={{ color: "#4a6080" }}>Colunas: <span style={{ color: "#fdffdf" }}>nome, email, cargo, departamento, area, diretoria, perfil_acesso, senha</span></p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "#0a3060", color: "#d9f22a", border: "1px solid #d9f22a30" }}
            >
              <Download size={14} />
              Baixar template_colaboradores.csv
            </button>
          </div>

          {/* Step 2: Upload file */}
          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}>
            <p className="text-sm font-semibold" style={{ color: "#8aa3c0" }}>2. Selecione o arquivo CSV preenchido</p>
            <label
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: "#0a3060", color: "#8aa3c0" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f); }}
            >
              <Upload size={24} />
              <span className="text-sm">Clique para selecionar ou arraste o arquivo CSV aqui</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
              />
            </label>
          </div>

          {/* Validation errors */}
          {csvErrors.length > 0 && (
            <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: "#2a0a0a", borderColor: "#ff4444" }}>
              <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#ff6666" }}>
                <AlertCircle size={12} /> {csvErrors.length} erro(s) encontrado(s)
              </p>
              {csvErrors.map((err, i) => (
                <p key={i} className="text-xs" style={{ color: "#ff9999" }}>{err}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {csvPreview.length > 0 && !importResult && (
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: "#8aa3c0" }}>
                3. Preview — {csvPreview.filter((r) => !r["_errors"]).length} válido(s) de {csvPreview.length} registro(s)
              </p>
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#0a3060" }}>
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr style={{ backgroundColor: "#001023" }}>
                      {["Nome", "E-mail", "Cargo", "Área", "Perfil"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#8aa3c0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 30).map((row, i) => {
                      const hasError = !!row["_errors"];
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #0a3060", backgroundColor: hasError ? "#2a0a0a" : undefined }}>
                          <td className="px-3 py-2">
                            <span style={{ color: hasError ? "#ff9999" : "#fdffdf" }}>{row["nome"] || "—"}</span>
                            {hasError && <p className="text-xs mt-0.5" style={{ color: "#ff6666" }}>{row["_errors"]}</p>}
                          </td>
                          <td className="px-3 py-2" style={{ color: hasError ? "#ff9999" : "#8aa3c0" }}>{row["email"] || "—"}</td>
                          <td className="px-3 py-2" style={{ color: "#8aa3c0" }}>{row["cargo"] || "—"}</td>
                          <td className="px-3 py-2" style={{ color: "#8aa3c0" }}>{row["area"] || "—"}</td>
                          <td className="px-3 py-2">
                            {hasError ? (
                              <span style={{ color: "#ff6666" }}><AlertCircle size={12} className="inline" /></span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                                backgroundColor: row["perfil_acesso"] === "rh" ? "#d9f22a15" : row["perfil_acesso"] === "gestor" ? "#1840eb15" : "#8aa3c015",
                                color: row["perfil_acesso"] === "rh" ? "#d9f22a" : row["perfil_acesso"] === "gestor" ? "#6080ff" : "#8aa3c0",
                              }}>{row["perfil_acesso"] || "colaborador"}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {csvPreview.length > 20 && (
                  <p className="px-3 py-2 text-xs" style={{ color: "#4a6080" }}>... e mais {csvPreview.length - 20} registro(s)</p>
                )}
              </div>
              <Button
                onClick={handleConfirmImport}
                disabled={importBulk.isPending || csvPreview.filter((r) => !r["_errors"]).length === 0}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {importBulk.isPending
                  ? "Importando..."
                  : `Confirmar importação de ${csvPreview.filter((r) => !r["_errors"]).length} colaborador(es) válido(s)`}
              </Button>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="space-y-3">
              <div className="flex gap-4 p-4 rounded-xl border" style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: "#d9f22a" }}>{importResult.imported}</p>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>Importados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: importResult.total - importResult.imported > 0 ? "#ff6666" : "#8aa3c0" }}>{importResult.total - importResult.imported}</p>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>Erros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: "#fdffdf" }}>{importResult.total}</p>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>Total</p>
                </div>
              </div>
              {importResult.results.filter((r) => r.status === "error").length > 0 && (
                <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: "#2a0a0a", borderColor: "#ff4444" }}>
                  <p className="text-xs font-semibold" style={{ color: "#ff6666" }}>Registros com erro:</p>
                  {importResult.results.filter((r) => r.status === "error").map((r) => (
                    <p key={r.row} className="text-xs flex items-center gap-1" style={{ color: "#ff9999" }}>
                      <AlertCircle size={10} /> Linha {r.row} — {r.name}: {r.error}
                    </p>
                  ))}
                </div>
              )}
              {importResult.imported > 0 && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: "#0a2a0a", borderColor: "#22c55e" }}>
                  <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#22c55e" }}>
                    <CheckCircle2 size={12} /> {importResult.imported} colaborador(es) adicionado(s) com sucesso!
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => { setShowImportDialog(false); setCsvPreview([]); setCsvErrors([]); setImportResult(null); }}
                className="w-full"
                style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </StellarLayout>
  );
}
