import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ciclo" component={CicloOverview} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/avaliacao" component={Avaliacao} />
      <Route path="/9box" component={NineBox} />
      <Route path="/flash-feedback" component={FlashFeedback} />
      <Route path="/relatorio" component={Relatorio} />
      <Route path="/rh" component={PainelRH} />
      <Route path="/calibracao" component={Calibracao} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
