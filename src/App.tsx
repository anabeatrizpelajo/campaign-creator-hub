import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import TemplatesPage from "./pages/TemplatesPage";
import UsersPage from "./pages/UsersPage";
import ProfilesPage from "./pages/ProfilesPage";
import BusinessManagersPage from "./pages/BusinessManagersPage";
import AdAccountsPage from "./pages/AdAccountsPage";
import CampaignsPage from "./pages/CampaignsPage";
import AdSetsPage from "./pages/AdSetsPage";
import AdsPage from "./pages/AdsPage";
import AutomationsPage from "./pages/AutomationsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/business-managers" element={<BusinessManagersPage />} />
            <Route path="/ad-accounts" element={<AdAccountsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/ad-sets" element={<AdSetsPage />} />
            <Route path="/ads" element={<AdsPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
