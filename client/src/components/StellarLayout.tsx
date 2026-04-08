import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Grid3x3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: ("rh" | "gestor" | "colaborador")[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Ciclo 2.0",
    href: "/ciclo",
    icon: <BookOpen size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "Avaliação",
    href: "/avaliacao",
    icon: <ClipboardList size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "9-Box",
    href: "/9box",
    icon: <Grid3x3 size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "Flash Feedbacks",
    href: "/flash-feedback",
    icon: <Zap size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "Devolutiva",
    href: "/relatorio",
    icon: <FileText size={18} />,
    roles: ["rh", "gestor", "colaborador"],
  },
  {
    label: "Painel RH",
    href: "/rh",
    icon: <Users size={18} />,
    roles: ["rh"],
  },
  {
    label: "Calibração",
    href: "/calibracao",
    icon: <BarChart3 size={18} />,
    roles: ["rh"],
  },
];

interface StellarLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function StellarLayout({ children, title }: StellarLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const platformRole = (user as any)?.platformRole ?? "colaborador";

  const visibleNav = navItems.filter((item) => item.roles.includes(platformRole));

  const roleLabel = {
    rh: "RH",
    gestor: "Gestor",
    colaborador: "Colaborador",
  }[platformRole as string] ?? "Colaborador";

  const roleColor = {
    rh: "bg-[#1840eb]/20 text-[#7ba7ff] border-[#1840eb]/30",
    gestor: "bg-[#d9f22a]/10 text-[#d9f22a] border-[#d9f22a]/20",
    colaborador: "bg-[#fdffdf]/10 text-[#fdffdf] border-[#fdffdf]/20",
  }[platformRole as string] ?? "bg-[#fdffdf]/10 text-[#fdffdf] border-[#fdffdf]/20";

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#001023" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
        style={{
          backgroundColor: "#000d1a",
          borderColor: "#0a3060",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "#0a3060" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#d9f22a" }}
          >
            <BrainCircuit size={16} style={{ color: "#001023" }} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs font-bold leading-none" style={{ color: "#d9f22a" }}>
                STELLAR
              </p>
              <p className="text-xs leading-none mt-0.5" style={{ color: "#8aa3c0" }}>
                Performance 2.0
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-1">
            {visibleNav.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
                      isActive
                        ? "text-[#001023]"
                        : "text-[#8aa3c0] hover:text-[#fdffdf]"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: "#d9f22a" }
                        : { backgroundColor: "transparent" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#001830";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span className={cn("flex-shrink-0", isActive ? "text-[#001023]" : "")}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom */}
        <div className="p-2 border-t" style={{ borderColor: "#0a3060" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg transition-colors"
            style={{ color: "#8aa3c0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}
        >
          <div>
            {title && (
              <h1 className="text-lg font-bold" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link href="/dashboard">
              <button
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: "#8aa3c0" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fdffdf";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8aa3c0";
                }}
              >
                <Bell size={18} />
                {unreadCount && unreadCount > 0 ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ color: "#fdffdf" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium leading-none" style={{ color: "#fdffdf" }}>
                      {user?.name ?? "Usuário"}
                    </p>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded border mt-0.5 inline-block",
                        roleColor
                      )}
                    >
                      {roleLabel}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{
                  backgroundColor: "#001830",
                  border: "1px solid #0a3060",
                  color: "#fdffdf",
                }}
              >
                <DropdownMenuItem asChild>
                  <Link href="/perfil">
                    <Settings size={14} className="mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: "#0a3060" }} />
                <DropdownMenuItem
                  onClick={logout}
                  style={{ color: "#ef4444" }}
                  className="cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: "#001023" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
