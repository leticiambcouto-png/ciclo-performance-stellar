import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { toast } from "sonner";
import {
  Mail, Briefcase, Building2, Save, Lock, Eye, EyeOff, Loader2,
  AlertTriangle, CheckCircle2, ChevronRight, Shield, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Password strength helper
function getStrength(pwd: string) {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: score, label: "Fraca", color: "#ef4444" };
  if (score <= 2) return { level: score, label: "Razoável", color: "#f59e0b" };
  if (score <= 3) return { level: score, label: "Boa", color: "#3b82f6" };
  return { level: score, label: "Forte", color: "#22c55e" };
}

export default function Perfil() {
  const { user, logout, refreshUser } = useStellarAuth();
  const platformRole = user?.platformRole ?? "colaborador";
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const utils = trpc.useUtils();

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    jobTitle: myProfile?.jobTitle ?? "",
    department: myProfile?.department ?? "",
  });

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const isMustChange = user?.mustChangePassword === true;
  const strength = getStrength(pwForm.next);

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
    gestor: { label: "Gestor", color: "#6080ff" },
    colaborador: { label: "Colaborador", color: "#8aa3c0" },
  };
  const roleInfo = roleLabels[platformRole as keyof typeof roleLabels] ?? roleLabels.colaborador;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Preencha todos os campos.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("As senhas não coincidem.");
      return;
    }
    if (pwForm.next === pwForm.current) {
      setPwError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess("Senha alterada com sucesso!");
        setPwForm({ current: "", next: "", confirm: "" });
        setChangingPassword(false);
        await refreshUser(); // clears mustChangePassword flag in context
        toast.success("Senha alterada com sucesso!");
      } else {
        setPwError(data.error || "Erro ao alterar senha.");
      }
    } catch {
      setPwError("Erro de conexão. Tente novamente.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <StellarLayout title="Meu Perfil">
      <div className="p-6 max-w-xl space-y-5">

        {/* ── Temporary password banner ── */}
        {isMustChange && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ backgroundColor: "#2a1500", borderColor: "#f59e0b" }}
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>
                Você está usando uma senha temporária
              </p>
              <p className="text-xs mt-1" style={{ color: "#d97706" }}>
                Por segurança, defina uma senha pessoal antes de continuar usando a plataforma.
                Use o formulário abaixo para criar sua nova senha.
              </p>
            </div>
          </div>
        )}

        {/* ── Avatar + name card ── */}
        <div
          className="p-5 rounded-xl border flex items-center gap-4"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ backgroundColor: "#d9f22a20", color: "#d9f22a", fontFamily: "Space Grotesk" }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
              {user?.name ?? "Usuário"}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${roleInfo.color}20`, color: roleInfo.color }}
            >
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* ── Info card ── */}
        <div
          className="p-5 rounded-xl border space-y-4"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={14} style={{ color: "#8aa3c0" }} />
              <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>Informações</p>
            </div>
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
            { icon: <Shield size={14} />, label: "Perfil de acesso", value: roleInfo.label, editable: false },
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

        {/* ── Password change card ── */}
        <div
          className="p-5 rounded-xl border space-y-4"
          style={{
            backgroundColor: "#001830",
            borderColor: isMustChange ? "#f59e0b" : "#0a3060",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={14} style={{ color: "#8aa3c0" }} />
              <p className="text-sm font-semibold" style={{ color: "#fdffdf" }}>
                {isMustChange ? "Definir nova senha" : "Segurança"}
              </p>
            </div>
            {!isMustChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPwForm({ current: "", next: "", confirm: "" });
                  setPwError("");
                  setPwSuccess("");
                  setChangingPassword(!changingPassword);
                }}
                style={{ borderColor: "#0a3060", color: "#8aa3c0", backgroundColor: "transparent" }}
              >
                {changingPassword ? "Cancelar" : "Alterar senha"}
              </Button>
            )}
          </div>

          {!changingPassword && !isMustChange && (
            <p className="text-sm" style={{ color: "#4a7ab5" }}>
              Mantenha sua conta segura com uma senha forte e única.
            </p>
          )}

          {(changingPassword || isMustChange) && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              {/* Current / temp password */}
              <div>
                <p className="text-xs mb-1" style={{ color: "#8aa3c0" }}>
                  {isMustChange ? "Senha temporária atual" : "Senha atual"}
                </p>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    disabled={pwLoading}
                    className="pr-10 h-9 text-sm"
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    style={{ color: "#fdffdf" }}
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <p className="text-xs mb-1" style={{ color: "#8aa3c0" }}>Nova senha</p>
                <div className="relative">
                  <Input
                    type={showNext ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={pwForm.next}
                    onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                    disabled={pwLoading}
                    className="pr-10 h-9 text-sm"
                    style={{ backgroundColor: "#001023", border: "1px solid #0a3060", color: "#fdffdf" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    style={{ color: "#fdffdf" }}
                  >
                    {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Strength bar */}
                {pwForm.next && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{ backgroundColor: i <= strength.level ? strength.color : "#0a3060" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>Força: {strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <p className="text-xs mb-1" style={{ color: "#8aa3c0" }}>Confirmar nova senha</p>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    disabled={pwLoading}
                    className="pr-10 h-9 text-sm"
                    style={{
                      backgroundColor: "#001023",
                      border: `1px solid ${pwForm.confirm && pwForm.confirm !== pwForm.next ? "#ef4444" : "#0a3060"}`,
                      color: "#fdffdf",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    style={{ color: "#fdffdf" }}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>As senhas não coincidem</p>
                )}
                {pwForm.confirm && pwForm.confirm === pwForm.next && pwForm.next.length >= 8 && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#22c55e" }}>
                    <CheckCircle2 size={11} /> Senhas conferem
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="p-3 rounded-xl space-y-1" style={{ backgroundColor: "#001023" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#4a6080" }}>Dicas para uma senha segura:</p>
                {[
                  { ok: pwForm.next.length >= 8, text: "Mínimo 8 caracteres" },
                  { ok: /[A-Z]/.test(pwForm.next), text: "Pelo menos uma letra maiúscula" },
                  { ok: /[0-9]/.test(pwForm.next), text: "Pelo menos um número" },
                  { ok: /[^A-Za-z0-9]/.test(pwForm.next), text: "Pelo menos um símbolo (@, #, !, etc.)" },
                ].map(({ ok, text }) => (
                  <p key={text} className="text-xs flex items-center gap-1.5" style={{ color: ok ? "#22c55e" : "#4a6080" }}>
                    <ChevronRight size={10} />
                    {text}
                  </p>
                ))}
              </div>

              {/* Error / success */}
              {pwError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={{ backgroundColor: "#2a0a0a", borderColor: "#ef4444" }}
                >
                  <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                  <p className="text-xs" style={{ color: "#ff9999" }}>{pwError}</p>
                </div>
              )}
              {pwSuccess && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={{ backgroundColor: "#0a2a0a", borderColor: "#22c55e" }}
                >
                  <CheckCircle2 size={13} style={{ color: "#22c55e" }} />
                  <p className="text-xs" style={{ color: "#22c55e" }}>{pwSuccess}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="w-full flex items-center gap-2"
                style={{ backgroundColor: "#d9f22a", color: "#001023" }}
              >
                {pwLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                ) : (
                  <><Lock size={14} />{isMustChange ? "Definir nova senha e continuar" : "Confirmar nova senha"}</>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* ── Logout ── */}
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
