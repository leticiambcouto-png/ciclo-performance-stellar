import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StellarAuthProvider, useStellarAuth } from "./contexts/StellarAuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Avaliacao from "./pages/Avaliacao";
import NineBox from "./pages/NineBox";
import FlashFeedback from "./pages/FlashFeedback";
import Relatorio from "./pages/Relatorio";
import PainelRH from "./pages/PainelRH";
import Calibracao from "./pages/Calibracao";
import Perfil from "./pages/Perfil";
import CicloOverview from "./pages/CicloOverview";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useStellarAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

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

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#001023" }}
      >
        <Loader2 className="animate-spin w-8 h-8" style={{ color: "#d9f22a" }} />
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Login} />
      <Route path="/ciclo">
        <ProtectedRoute component={CicloOverview} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/avaliacao">
        <ProtectedRoute component={Avaliacao} />
      </Route>
      <Route path="/9box">
        <ProtectedRoute component={NineBox} />
      </Route>
      <Route path="/flash-feedback">
        <ProtectedRoute component={FlashFeedback} />
      </Route>
      <Route path="/relatorio">
        <ProtectedRoute component={Relatorio} />
      </Route>
      <Route path="/rh">
        <ProtectedRoute component={PainelRH} />
      </Route>
      <Route path="/calibracao">
        <ProtectedRoute component={Calibracao} />
      </Route>
      <Route path="/perfil">
        <ProtectedRoute component={Perfil} />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <StellarAuthProvider>
          <TooltipProvider>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "#001830",
                  border: "1px solid #0a3060",
                  color: "#fdffdf",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </StellarAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
