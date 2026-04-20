import { useStellarAuth } from "@/contexts/StellarAuthContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Grid3x3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Target,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  group?: "main" | "admin";
}

const navItems: NavItem[] = [
  {
    label: "Ciclo 2.0",
    href: "/ciclo",
    icon: <BookOpen size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "main",
  },
  {
    label: "9-Box",
    href: "/9box",
    icon: <Grid3x3 size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "main",
  },
  {
    label: "Avaliação",
    href: "/avaliacao",
    icon: <ClipboardList size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "main",
  },
  {
    label: "Feedback",
    href: "/feedback",
    icon: <MessageSquare size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "main",
  },
  {
    label: "PDI",
    href: "/pdi",
    icon: <Target size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "main",
  },
  {
    label: "Calibração",
    href: "/calibracao",
    icon: <BarChart3 size={18} />,
    roles: ["rh"],
    group: "main",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["rh", "gestor", "colaborador"],
    group: "admin",
  },
  {
    label: "Painel RH",
    href: "/rh",
    icon: <Users size={18} />,
    roles: ["rh"],
    group: "admin",
  },
];

interface StellarLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function StellarLayout({ children, title }: StellarLayoutProps) {
  const { user, logout } = useStellarAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const platformRole = (user as any)?.platformRole ?? "colaborador";
  const secondaryRole = (user as any)?.secondaryPlatformRole ?? null;
  // A user can see a nav item if their primary OR secondary role is in the allowed list
  const visibleNav = navItems.filter((item) =>
    item.roles.includes(platformRole) || (secondaryRole && item.roles.includes(secondaryRole))
  );

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

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center px-4 py-4 border-b flex-shrink-0" style={{ borderColor: "#0a3060" }}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#d9f22a" }}>
            <BrainCircuit size={16} style={{ color: "#001023" }} />
          </div>
        ) : (
          <div className="flex flex-col items-center w-full gap-2">
            <img
              src="/manus-storage/stellar-gaming-logo_7497063a.svg"
              alt="Stellar Gaming"
              className="w-full max-w-[140px] h-auto object-contain"
            />
            <div
              className="w-full text-center px-3 py-1 rounded"
              style={{ backgroundColor: "#d9f22a" }}
            >
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: "#001023" }}>Performance 2.0</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2">
          {/* Main navigation group */}
          <div className="space-y-1">
            {visibleNav.filter(i => i.group !== "admin").map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                      isActive ? "text-[#001023]" : "text-[#8aa3c0] hover:text-[#fdffdf]"
                    )}
                    style={isActive ? { backgroundColor: "#d9f22a" } : { backgroundColor: "transparent" }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#001830";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <span className={cn("flex-shrink-0", isActive ? "text-[#001023]" : "")}>{item.icon}</span>
                    {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin group separator + items */}
          {visibleNav.some(i => i.group === "admin") && (
            <>
              <div className="my-3 border-t" style={{ borderColor: "#0a3060" }} />
              {!collapsed && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4a6a90" }}>Gestão</p>
              )}
              <div className="space-y-1">
                {visibleNav.filter(i => i.group === "admin").map((item) => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                          isActive ? "text-[#001023]" : "text-[#8aa3c0] hover:text-[#fdffdf]"
                        )}
                        style={isActive ? { backgroundColor: "#d9f22a" } : { backgroundColor: "transparent" }}
                        onMouseEnter={(e) => {
                          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#001830";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <span className={cn("flex-shrink-0", isActive ? "text-[#001023]" : "")}>{item.icon}</span>
                        {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Bottom collapse toggle (desktop only) */}
      <div className="p-2 border-t hidden lg:block" style={{ borderColor: "#0a3060" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors"
          style={{ color: "#8aa3c0" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#001023" }}>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#000d1a", borderRight: "1px solid #0a3060" }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg"
          style={{ color: "#8aa3c0" }}
        >
          <X size={18} />
        </button>
        <NavContent onItemClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
        style={{ backgroundColor: "#000d1a", borderColor: "#0a3060" }}
      >
        <NavContent />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b flex-shrink-0"
          style={{ backgroundColor: "#001023", borderColor: "#0a3060" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger (mobile only) */}
            <button
              className="lg:hidden p-2 rounded-lg flex-shrink-0"
              style={{ color: "#8aa3c0" }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            {title && (
              <h1 className="text-base lg:text-lg font-bold truncate" style={{ color: "#fdffdf", fontFamily: "Space Grotesk" }}>
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
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
                  className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-lg transition-colors"
                  style={{ color: "#fdffdf" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#001830"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "#d9f22a", color: "#001023" }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium leading-none truncate max-w-[120px]" style={{ color: "#fdffdf" }}>
                      {user?.name ?? "Usuário"}
                    </p>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border mt-0.5 inline-block", roleColor)}>
                      {roleLabel}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{ backgroundColor: "#001830", border: "1px solid #0a3060", color: "#fdffdf" }}
              >
                <DropdownMenuItem asChild>
                  <Link href="/perfil">
                    <Settings size={14} className="mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: "#0a3060" }} />
                <DropdownMenuItem onClick={logout} style={{ color: "#ef4444" }} className="cursor-pointer">
                  <LogOut size={14} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Temporary password banner */}
        {user?.mustChangePassword && (
          <Link href="/perfil">
            <div
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#2a1500", borderBottom: "1px solid #f59e0b" }}
            >
              <AlertTriangle size={15} style={{ color: "#f59e0b" }} className="shrink-0" />
              <p className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
                Você está usando uma senha temporária.
              </p>
              <span className="text-xs underline ml-auto whitespace-nowrap" style={{ color: "#f59e0b" }}>Definir minha senha</span>
            </div>
          </Link>
        )}
        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: "#001023" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
