import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import VATConsole from "./pages/VATConsole";
import PIT from "./pages/PIT";
import CIT from "./pages/CIT";
import ProConsole from "./pages/ProConsole";
import ClientPortal from "./pages/ClientPortal";
import Exceptions from "./pages/Exceptions";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/vat" element={<VATConsole />} />
          <Route path="/pit" element={<PIT />} />
          <Route path="/cit" element={<CIT />} />
          <Route path="/pro-console" element={<ProConsole />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
