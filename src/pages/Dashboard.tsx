import { 
  Users, 
  Facebook, 
  Building2, 
  CreditCard, 
  Megaphone, 
  Layers, 
  FileImage,
  TrendingUp,
  Copy
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

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

const quickTemplates = [
  { id: "1", name: "Campanha Black Friday", type: "Campanha + Conjunto + Anúncio", usageCount: 45 },
  { id: "2", name: "Lead Gen Padrão", type: "Campanha + Conjunto", usageCount: 32 },
  { id: "3", name: "Remarketing Básico", type: "Conjunto + Anúncio", usageCount: 28 },
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Templates Rápidos</h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/templates">Ver todos</a>
            </Button>
          </div>
          <div className="space-y-3">
            {quickTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <Copy className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{template.usageCount}x usado</span>
                  <Button size="sm" variant="secondary">Usar</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
