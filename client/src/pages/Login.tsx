import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";

export default function Login() {
  const { login, user, loading } = useStellarAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Read optional redirect param from URL (safe: only allow relative paths)
  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }
    return "/ciclo";
  };

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      navigate(getRedirectPath());
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha o email e a senha.");
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      toast.success("Bem-vindo de volta!");
      navigate(getRedirectPath());
    } else {
      toast.error(result.error || "Erro ao fazer login.");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#001023" }}
      >
        <Loader2 className="animate-spin w-8 h-8" style={{ color: "#d9f22a" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#001023" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #d9f22a 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#d9f22a" }}
          >
            <Zap className="w-8 h-8" style={{ color: "#001023" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#fdffdf" }}>
            Stellar Gaming
          </h1>
          <p className="text-sm mt-1" style={{ color: "#4a7ab5" }}>
            Ciclo de Performance 2.0
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <h2 className="text-xl font-semibold mb-1" style={{ color: "#fdffdf" }}>
            Bem-vindo de volta
          </h2>
          <p className="text-sm mb-6" style={{ color: "#4a7ab5" }}>
            Entre com seu email e senha para acessar a plataforma.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "#fdffdf" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={submitting}
                className="border-0 focus-visible:ring-1"
                style={{
                  backgroundColor: "#001023",
                  color: "#fdffdf",
                  outline: "1px solid #0a3060",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "#fdffdf" }}>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="border-0 focus-visible:ring-1 pr-10"
                  style={{
                    backgroundColor: "#001023",
                    color: "#fdffdf",
                    outline: "1px solid #0a3060",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: "#fdffdf" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-semibold text-base h-11 mt-2"
              style={{ backgroundColor: "#d9f22a", color: "#001023" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="text-center mt-3">
              <Link href="/esqueci-senha">
                <button
                  type="button"
                  className="text-sm transition-colors hover:underline"
                  style={{ color: "#4a7ab5" }}
                >
                  Esqueci minha senha
                </button>
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#2a4a6b" }}>
          Problemas para acessar? Fale com o RH da Stellar Gaming.
        </p>
      </div>
    </div>
  );
}
