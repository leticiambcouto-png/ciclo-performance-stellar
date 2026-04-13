import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Informe seu e-mail cadastrado.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origin: window.location.origin }),
      });
      const data = await res.json() as { success?: boolean; error?: string; _devResetUrl?: string };

      if (!res.ok) {
        setError(data.error || "Erro ao processar solicitação.");
        return;
      }

      // In dev mode, show the reset URL directly (SMTP not configured)
      if (data._devResetUrl) {
        console.info("[Dev] Reset URL:", data._devResetUrl);
      }

      setSent(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Stellar Gaming</h1>
          <p className="text-muted-foreground text-sm mt-1">Ciclo de Performance 2.0</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">E-mail enviado!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Se o e-mail <strong className="text-foreground">{email}</strong> estiver cadastrado na plataforma, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-muted-foreground text-xs mb-6">
                Verifique também a pasta de spam. O link é válido por <strong>1 hora</strong>.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">Esqueci minha senha</h2>
                <p className="text-muted-foreground text-sm">
                  Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login">
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Voltar para o login
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Problemas para acessar? Fale com o RH da Stellar Gaming.
        </p>
      </div>
    </div>
  );
}
