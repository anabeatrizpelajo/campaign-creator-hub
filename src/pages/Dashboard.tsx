import { 
  Users, 
  Facebook, 
  Building2, 
  CreditCard, 
  Megaphone, 
  Layers, 
  FileImage,
  TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PageHeader } from "@/components/ui/page-header";

const stats = [
  { title: "Usuários", value: 24, icon: Users, trend: { value: 12, isPositive: true } },
  { title: "Perfis Facebook", value: 18, icon: Facebook, trend: { value: 8, isPositive: true } },
  { title: "Business Managers", value: 6, icon: Building2 },
  { title: "Contas de Anúncio", value: 32, icon: CreditCard, trend: { value: 15, isPositive: true } },
  { title: "Campanhas Ativas", value: 47, icon: Megaphone, trend: { value: 5, isPositive: false } },
  { title: "Conjuntos de Anúncios", value: 128, icon: Layers },
  { title: "Anúncios", value: 384, icon: FileImage, trend: { value: 22, isPositive: true } },
  { title: "Gasto Mensal", value: "R$ 45.8k", icon: TrendingUp, subtitle: "Meta API" },
];

export default function Dashboard() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral da sua plataforma de automação Facebook Ads"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Status das Integrações</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Meta API</span>
              </div>
              <span className="status-badge status-active">Conectado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">n8n Workflows</span>
              </div>
              <span className="status-badge status-active">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Lovable Cloud</span>
              </div>
              <span className="status-badge status-active">Operacional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
