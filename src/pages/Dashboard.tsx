import { useQuery } from "@tanstack/react-query";
import { Building2, CreditCard, Megaphone, Layers, FileImage, Copy, Rocket } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2, Clock } from "lucide-react";

interface BulkTemplate { id: string; name: string; description: string | null; config: any; created_at: string; }

export default function Dashboard() {
  const { data: bms } = useQuery({ queryKey: ["dash_bms"], queryFn: async () => { const { count } = await supabase.from("business_managers").select("*", { count: "exact", head: true }); return count || 0; } });
  const { data: accounts } = useQuery({ queryKey: ["dash_accounts"], queryFn: async () => { const { count } = await supabase.from("ad_accounts").select("*", { count: "exact", head: true }); return count || 0; } });
  const { data: campaigns } = useQuery({ queryKey: ["dash_campaigns"], queryFn: async () => { const { count } = await supabase.from("campaigns").select("*", { count: "exact", head: true }); return count || 0; } });
  const { data: adSets } = useQuery({ queryKey: ["dash_adsets"], queryFn: async () => { const { count } = await supabase.from("ad_sets").select("*", { count: "exact", head: true }); return count || 0; } });
  const { data: ads } = useQuery({ queryKey: ["dash_ads"], queryFn: async () => { const { count } = await supabase.from("ads").select("*", { count: "exact", head: true }); return count || 0; } });
  const { data: templateCount } = useQuery({ queryKey: ["dash_templates_count"], queryFn: async () => { const { count } = await supabase.from("bulk_templates").select("*", { count: "exact", head: true }); return count || 0; } });

  const { data: recentCampaigns } = useQuery({
    queryKey: ["dash_recent_campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, name, status, created_at").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["dash_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bulk_templates").select("*").order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data as BulkTemplate[];
    },
  });

  const stats = [
    { title: "Business Managers", value: bms ?? "—", icon: Building2 },
    { title: "Contas de Anúncio", value: accounts ?? "—", icon: CreditCard },
    { title: "Campanhas", value: campaigns ?? "—", icon: Megaphone },
    { title: "Conjuntos", value: adSets ?? "—", icon: Layers },
    { title: "Anúncios", value: ads ?? "—", icon: FileImage },
    { title: "Templates", value: templateCount ?? "—", icon: Copy },
  ];

  const statusLabel: Record<string, string> = { draft: "Rascunho", active: "Ativo", paused: "Pausado", archived: "Arquivado" };
  const statusColor: Record<string, string> = { draft: "secondary", active: "default", paused: "outline", archived: "destructive" };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    return `${days}d atrás`;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua plataforma de automação Facebook Ads"
        action={
          <Button asChild>
            <Link to="/bulk"><Rocket className="w-4 h-4 mr-2" />Criação em Massa</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Atividade Recente</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {!recentCampaigns ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma campanha criada ainda</p>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === "active" ? "bg-green-500" : c.status === "paused" ? "bg-yellow-500" : "bg-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={statusColor[c.status] as any || "secondary"} className="shrink-0 text-xs">
                      {statusLabel[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Templates Disponíveis</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/templates">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!templates ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum template salvo. Crie um na criação em massa.</p>
            ) : (
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Copy className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tpl.name}</p>
                        {tpl.description && <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {new Date(tpl.created_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
