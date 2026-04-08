import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Briefcase, Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Perfil() {
  const { user, logout } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    jobTitle: myProfile?.jobTitle ?? "",
    department: myProfile?.department ?? "",
  });

  const updateProfile = trpc.employees.updateMyProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      setEditing(false);
      utils.employees.myProfile.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  const roleLabels = {
    rh: { label: "RH", color: "#d9f22a" },
    gestor: { label: "Gestor", color: "#1840eb" },
    colaborador: { label: "Colaborador", color: "#8aa3c0" },
  };
  const roleInfo = roleLabels[platformRole as keyof typeof roleLabels] ?? roleLabels.colaborador;

  return (
    <StellarLayout title="Meu Perfil">
      <div className="p-6 max-w-xl space-y-6">
        {/* Avatar + name */}
        <div
          className="p-6 rounded-xl border flex items-center gap-4"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
            style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}
          >
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
              {user?.name ?? "—"}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${roleInfo.color}20`, color: roleInfo.color }}
            >
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Info */}
        <div
          className="p-5 rounded-xl border space-y-4"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>Informações</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm({ jobTitle: myProfile?.jobTitle ?? "", department: myProfile?.department ?? "" });
                setEditing(!editing);
              }}
              style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
            >
              {editing ? "Cancelar" : "Editar"}
            </Button>
          </div>

          {[
            { icon: <Mail size={14} />, label: "E-mail", value: user?.email ?? "—", editable: false },
            { icon: <Briefcase size={14} />, label: "Cargo", value: myProfile?.jobTitle ?? "—", key: "jobTitle", editable: true },
            { icon: <Building2 size={14} />, label: "Departamento", value: myProfile?.department ?? "—", key: "department", editable: true },
          ].map((field) => (
            <div key={field.label} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "#001023", color: "#8aa3c0" }}
              >
                {field.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs mb-0.5" style={{ color: "#8aa3c0" }}>{field.label}</p>
                {editing && field.editable ? (
                  <Input
                    value={(form as any)[field.key!]}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key!]: e.target.value }))}
                    className="h-8 text-sm"
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                ) : (
                  <p className="text-sm" style={{ color: "#fdffdf" }}>{field.value}</p>
                )}
              </div>
            </div>
          ))}

          {editing && (
            <Button
              onClick={() => updateProfile.mutate({ jobTitle: form.jobTitle, department: form.department })}
              disabled={updateProfile.isPending}
              className="w-full flex items-center gap-2"
              style={{ backgroundColor: "#d9f22a", color: "#001023" }}
            >
              <Save size={14} />
              Salvar alterações
            </Button>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={logout}
          className="w-full"
          style={{ borderColor: "#ef444430", color: "#ef4444", backgroundColor: "transparent" }}
        >
          Sair da conta
        </Button>
      </div>
    </StellarLayout>
  );
}
