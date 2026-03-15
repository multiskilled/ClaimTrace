import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Shell from "@/components/layout/Shell";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreateClaim from "@/pages/CreateClaim";
import ClaimDetail from "@/pages/ClaimDetail";
import PortalDemo from "@/pages/PortalDemo";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Shell>
      <Component />
    </Shell>
  )
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/claims/new"><ProtectedRoute component={CreateClaim} /></Route>
      <Route path="/claims/:id"><ProtectedRoute component={ClaimDetail} /></Route>
      <Route path="/portal-demo"><ProtectedRoute component={PortalDemo} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
