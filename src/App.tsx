import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import VATConsole from "./pages/VATConsole";
import PIT from "./pages/PIT";
import CIT from "./pages/CIT";
import CGT from "./pages/CGT";
import Compliance from "./pages/Compliance";
import FreeZone from "./pages/FreeZone";
import NonResidentTax from "./pages/NonResidentTax";
import IndustryModules from "./pages/IndustryModules";
import AIAdvisor from "./pages/AIAdvisor";
import ProConsole from "./pages/ProConsole";
import ClientPortal from "./pages/ClientPortal";
import Exceptions from "./pages/Exceptions";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import Knowledge from "./pages/Knowledge";
import TaxQA from "./pages/TaxQA";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import FilingEvents from "./pages/FilingEvents";
import Stamp from "./pages/Stamp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/cgt" element={<CGT />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/free-zone" element={<FreeZone />} />
          <Route path="/non-resident" element={<NonResidentTax />} />
          <Route path="/industry" element={<IndustryModules />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/pro-console" element={<ProConsole />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/tax-qa" element={<TaxQA />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/filing-events" element={<FilingEvents />} />
          <Route path="/stamp" element={<Stamp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
