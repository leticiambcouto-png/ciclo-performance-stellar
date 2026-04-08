import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BrainCircuit, ChevronRight, BarChart3, Zap, Grid3x3, Target } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/ciclo");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#001023" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#d9f22a" }}
          >
            <BrainCircuit size={24} style={{ color: "#001023" }} />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "#d9f22a",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Grid3x3 size={20} />,
      title: "9-Box Interativo",
      desc: "Visualize e simule posicionamentos com cálculo automático por critério.",
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Curva da Área",
      desc: "Compare sua distribuição de talentos com a curva esperada da Stellar.",
    },
    {
      icon: <Zap size={20} />,
      title: "Flash Feedbacks",
      desc: "Agende, formalize e acompanhe feedbacks contínuos ao longo do ciclo.",
    },
    {
      icon: <BrainCircuit size={20} />,
      title: "IA Integrada",
      desc: "IA que estrutura feedbacks completos e ajuda na preparação de pautas.",
    },
    {
      icon: <Target size={20} />,
      title: "Avaliação por Critério",
      desc: "8 perguntas-âncora em dois eixos: Potencial e Performance.",
    },
    {
      icon: <ChevronRight size={20} />,
      title: "Comitê de Calibração",
      desc: "RH cria salas de calibração e alinha posicionamentos com os gestores.",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#001023" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: "#0a3060" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#d9f22a" }}
          >
            <BrainCircuit size={18} style={{ color: "#001023" }} />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "#d9f22a", fontFamily: "Space Grotesk" }}>
              STELLAR GAMING
            </span>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              Ciclo de Performance 2.0
            </p>
          </div>
        </div>
        <a
          href={getLoginUrl()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
          style={{ backgroundColor: "#d9f22a", color: "#001023" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#c8e020";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#d9f22a";
          }}
        >
          Entrar
          <ChevronRight size={16} />
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border"
          style={{
            backgroundColor: "#d9f22a10",
            borderColor: "#d9f22a30",
            color: "#d9f22a",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#d9f22a] animate-pulse" />
          Ciclo S1/2026 em andamento
        </div>

        <h1
          className="text-5xl md:text-6xl font-black mb-6 max-w-3xl leading-tight"
          style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}
        >
          Performance com{" "}
          <span style={{ color: "#d9f22a" }}>critério.</span>
          <br />
          Não com intenção.
        </h1>

        <p
          className="text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: "#8aa3c0" }}
        >
          A plataforma de gestão de performance da Stellar Gaming. Avaliações por critério,
          9-box automático, flash feedbacks e IA para estruturar conversas que geram resultado.
        </p>

        <a
          href={getLoginUrl()}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all"
          style={{ backgroundColor: "#d9f22a", color: "#001023" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#c8e020";
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#d9f22a";
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
          }}
        >
          Acessar plataforma
          <ChevronRight size={18} />
        </a>
      </main>

      {/* Features */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border"
              style={{
                backgroundColor: "#001830",
                borderColor: "#0a3060",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}
              >
                {f.icon}
              </div>
              <h3
                className="font-semibold text-sm mb-1"
                style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}
              >
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#8aa3c0" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-center py-6 border-t text-xs"
        style={{ borderColor: "#0a3060", color: "#4a6a8a" }}
      >
        Stellar Gaming · Ciclo de Performance 2.0 · Confidencial
      </footer>
    </div>
  );
}
