import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StellarLayout from "@/components/StellarLayout";
import { Bell, CheckCircle, Clock, AlertTriangle, ChevronRight, Zap, ClipboardList, Grid3x3, FileText, Users } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const platformRole = (user as any)?.platformRole ?? "colaborador";

  const { data: notifications } = trpc.notifications.list.useQuery();
  const { data: cycle } = trpc.cycles.active.useQuery();
  const { data: myProfile } = trpc.employees.myProfile.useQuery();
  const utils = trpc.useUtils();

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const unreadNotifs = notifications?.filter((n) => !n.isRead) ?? [];
  const recentNotifs = notifications?.slice(0, 5) ?? [];

  const notifIcon = (type: string) => {
    switch (type) {
      case "flash_feedback_scheduled": return <Zap size={14} style={{ color: "#d9f22a" }} />;
      case "flash_feedback_due_soon": return <Clock size={14} style={{ color: "#f59e0b" }} />;
      case "flash_feedback_overdue": return <AlertTriangle size={14} style={{ color: "#ef4444" }} />;
      case "report_sent": return <FileText size={14} style={{ color: "#22c55e" }} />;
      default: return <Bell size={14} style={{ color: "#8aa3c0" }} />;
    }
  };

  const quickLinks = {
    rh: [
      { label: "Painel RH", href: "/rh", icon: <Users size={18} />, desc: "Visão global da empresa" },
      { label: "9-Box Global", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Posicionamento de todos" },
      { label: "Calibração", href: "/calibracao", icon: <ClipboardList size={18} />, desc: "Comitês de calibração" },
      { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Acompanhamento geral" },
    ],
    gestor: [
      { label: "Avaliar Time", href: "/avaliacao", icon: <ClipboardList size={18} />, desc: "Avalie seus liderados" },
      { label: "9-Box do Time", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Posicionamento do time" },
      { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Feedbacks do time" },
      { label: "Devolutivas", href: "/relatorio", icon: <FileText size={18} />, desc: "Envie resultados" },
    ],
    colaborador: [
      { label: "Autoavaliação", href: "/avaliacao", icon: <ClipboardList size={18} />, desc: "Faça sua autoavaliação" },
      { label: "Meu 9-Box", href: "/9box", icon: <Grid3x3 size={18} />, desc: "Veja seu posicionamento" },
      { label: "Flash Feedbacks", href: "/flash-feedback", icon: <Zap size={18} />, desc: "Agende com seu gestor" },
      { label: "Minha Devolutiva", href: "/relatorio", icon: <FileText size={18} />, desc: "Resultado da avaliação" },
    ],
  };

  const links = quickLinks[platformRole as keyof typeof quickLinks] ?? quickLinks.colaborador;

  const greetingName = user?.name?.split(" ")[0] ?? "Stellar";

  return (
    <StellarLayout title="Dashboard">
      <div className="p-6 space-y-6 max-w-5xl">
        {/* Greeting */}
        <div
          className="p-6 rounded-xl border"
          style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}
              >
                Olá, {greetingName}! 👋
              </h2>
              <p style={{ color: "#8aa3c0" }} className="text-sm">
                {cycle
                  ? `Ciclo ativo: ${cycle.name} · Encerra em ${new Date(cycle.endDate).toLocaleDateString("pt-BR")}`
                  : "Nenhum ciclo ativo no momento."}
              </p>
            </div>
            {myProfile && (
              <div
                className="text-right hidden sm:block"
              >
                <p className="text-xs" style={{ color: "#8aa3c0" }}>Cargo</p>
                <p className="text-sm font-medium" style={{ color: "#fdffdf" }}>{myProfile.jobTitle ?? "—"}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{myProfile.department ?? "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "#8aa3c0", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            Acesso Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className="p-4 rounded-xl border cursor-pointer transition-all group"
                  style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#d9f22a40";
                    el.style.backgroundColor = "#00213f";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#0a3060";
                    el.style.backgroundColor = "#001830";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: "#d9f22a15", color: "#d9f22a" }}
                  >
                    {link.icon}
                  </div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "#fdffdf" }}>
                    {link.label}
                  </p>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-sm font-semibold"
              style={{ color: "#8aa3c0", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Notificações {unreadNotifs.length > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                >
                  {unreadNotifs.length}
                </span>
              )}
            </h3>
            {unreadNotifs.length > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs transition-colors"
                style={{ color: "#8aa3c0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#d9f22a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0"; }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: "#001830", borderColor: "#0a3060" }}
          >
            {recentNotifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-3" style={{ color: "#0a3060" }} />
                <p className="text-sm" style={{ color: "#8aa3c0" }}>Nenhuma notificação ainda.</p>
              </div>
            ) : (
              recentNotifs.map((notif, i) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-4"
                  style={{
                    borderBottom: i < recentNotifs.length - 1 ? "1px solid #0a3060" : "none",
                    backgroundColor: notif.isRead ? "transparent" : "#d9f22a08",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#001023" }}
                  >
                    {notifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: notif.isRead ? "#8aa3c0" : "#fdffdf" }}>
                      {notif.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{notif.message}</p>
                    <p className="text-xs mt-1" style={{ color: "#4a6a8a" }}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ backgroundColor: "#d9f22a" }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </StellarLayout>
  );
}
