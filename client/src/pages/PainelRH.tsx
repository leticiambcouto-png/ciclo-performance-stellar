import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Plus, Building2, Search, ChevronRight, Shield, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function PainelRH() {
  const { user } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const [search, setSearch] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    jobTitle: "",
    department: "",
    managerId: "",
    platformRole: "colaborador" as "rh" | "gestor" | "colaborador",
  });

  const utils = trpc.useUtils();
  const { data: employees } = trpc.employees.all.useQuery();
  const { data: calibrationRooms } = trpc.calibration.rooms.useQuery({});

  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Colaborador criado com sucesso!");
      setShowAddEmployee(false);
      setNewEmployee({ name: "", email: "", jobTitle: "", department: "", managerId: "", platformRole: "colaborador" });
      utils.employees.all.invalidate();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateRole = trpc.employees.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      utils.employees.all.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  if (platformRole !== "rh") {
    return (
      <StellarLayout title="Painel RH">
        <div className="p-6">
          <div
            className="p-12 rounded-xl border text-center"
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

  const filtered = employees?.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.jobTitle?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const roleColors = {
    rh: { color: "#d9f22a", bg: "#d9f22a15", label: "RH" },
    gestor: { color: "#1840eb", bg: "#1840eb15", label: "Gestor" },
    colaborador: { color: "#8aa3c0", bg: "#8aa3c015", label: "Colaborador" },
  };

  return (
    <StellarLayout title="Painel RH">
      <div className="p-6 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", count: employees?.length ?? 0, color: "#fdffdf", icon: <Users size={18} /> },
            { label: "Gestores", count: employees?.filter((e) => e.platformRole === "gestor").length ?? 0, color: "#1840eb", icon: <UserCheck size={18} /> },
            { label: "Colaboradores", count: employees?.filter((e) => e.platformRole === "colaborador").length ?? 0, color: "#8aa3c0", icon: <User size={18} /> },
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

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
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
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center gap-2"
            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
          >
            <Plus size={14} />
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
        </div>

        {/* Employee table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div
            className="grid grid-cols-5 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#8aa3c0", borderBottom: "1px solid #0a3060" }}
          >
            <span className="col-span-2">Nome</span>
            <span>Cargo</span>
            <span>Departamento</span>
            <span>Perfil</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
              <p className="text-sm" style={{ color: "#8aa3c0" }}>Nenhum colaborador encontrado.</p>
            </div>
          ) : (
            filtered.map((emp, i) => {
              const role = emp.platformRole as keyof typeof roleColors ?? "colaborador";
              const rc = roleColors[role] ?? roleColors.colaborador;
              return (
                <div
                  key={emp.id}
                  className="grid grid-cols-5 gap-4 px-4 py-3 items-center"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #0a3060" : "none" }}
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "#001023", color: "#d9f22a" }}
                    >
                      {emp.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>{emp.name}</p>
                      <p className="text-xs" style={{ color: "#8aa3c0" }}>{emp.email}</p>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: "#8aa3c0" }}>{emp.jobTitle ?? "—"}</p>
                  <p className="text-sm" style={{ color: "#8aa3c0" }}>{emp.department ?? "—"}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={emp.platformRole ?? "colaborador"}
                      onChange={(e) => updateRole.mutate({ employeeId: emp.id, platformRole: e.target.value as any })}
                      className="text-xs px-2 py-1 rounded-lg border"
                      style={{
                        backgroundColor: rc.bg,
                        borderColor: `${rc.color}40`,
                        color: rc.color,
                      }}
                    >
                      <option value="colaborador">Colaborador</option>
                      <option value="gestor">Gestor</option>
                      <option value="rh">RH</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Employee Dialog */}
        <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
          <DialogContent style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                Novo Colaborador
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {[
                { label: "Nome *", key: "name", placeholder: "Nome completo" },
                { label: "E-mail", key: "email", placeholder: "email@stellar.com" },
                { label: "Cargo", key: "jobTitle", placeholder: "Ex: Analista de Marketing" },
                { label: "Departamento", key: "department", placeholder: "Ex: Marketing" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                    {field.label}
                  </label>
                  <Input
                    placeholder={field.placeholder}
                    value={(newEmployee as any)[field.key]}
                    onChange={(e) => setNewEmployee((p) => ({ ...p, [field.key]: e.target.value }))}
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                  Gestor direto
                </label>
                <select
                  value={newEmployee.managerId}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, managerId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                >
                  <option value="">Nenhum</option>
                  {employees?.filter((e) => e.platformRole === "gestor").map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#8aa3c0" }}>
                  Perfil de acesso
                </label>
                <select
                  value={newEmployee.platformRole}
                  onChange={(e) => setNewEmployee((p) => ({ ...p, platformRole: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="gestor">Gestor</option>
                  <option value="rh">RH</option>
                </select>
              </div>
              <Button
                onClick={() => {
                  if (!newEmployee.name) return toast.error("Nome é obrigatório.");
                  createEmployee.mutate({
                    name: newEmployee.name,
                    email: newEmployee.email || undefined,
                    jobTitle: newEmployee.jobTitle || undefined,
                    department: newEmployee.department || undefined,
                    managerId: newEmployee.managerId ? Number(newEmployee.managerId) : undefined,
                    platformRole: newEmployee.platformRole,
                  });
                }}
                disabled={createEmployee.isPending}
                className="w-full"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                Criar colaborador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StellarLayout>
  );
}
