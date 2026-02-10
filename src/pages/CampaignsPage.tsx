import { Link } from "react-router-dom";
import { Plus, MoreHorizontal, RefreshCw, Pencil, Trash2, Archive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  sync_status: string;
  daily_budget: number | null;
  bid_strategy: string | null;
  facebook_campaign_id: string | null;
  ad_account_id: string;
  ad_accounts: {
    id: string;
    account_name: string;
  } | null;
}

const formatBudget = (cents: number | null) => {
  if (!cents) return "-";
  return `R$ ${(cents / 100).toFixed(2)}`;
};

const formatObjective = (objective: string) => {
  const objectives: Record<string, string> = {
    OUTCOME_AWARENESS: "Reconhecimento",
    OUTCOME_TRAFFIC: "Tráfego",
    OUTCOME_ENGAGEMENT: "Engajamento",
    OUTCOME_LEADS: "Cadastros",
    OUTCOME_SALES: "Vendas",
  };
  return objectives[objective] || objective;
};

const formatBidStrategy = (strategy: string | null) => {
  const strategies: Record<string, string> = {
    LOWEST_COST_WITHOUT_CAP: "Volume Mais Alto",
    LOWEST_COST_WITH_BID_CAP: "Limite de Lance",
    COST_CAP: "Custo por Resultado",
  };
  return strategy ? (strategies[strategy] || strategy) : "-";
};

const getSyncBadge = (sync_status: string) => {
  switch (sync_status) {
    case "synced":
      return <Badge variant="default">Sincronizado</Badge>;
    case "syncing":
      return <Badge variant="secondary">Sincronizando...</Badge>;
    case "error":
      return <Badge variant="destructive">Erro</Badge>;
    default:
      return <Badge variant="outline">Pendente</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500">Ativo</Badge>;
    case "PAUSED":
      return <Badge className="bg-yellow-500 text-black">Pausado</Badge>;
    case "ARCHIVED":
      return <Badge variant="outline">Arquivado</Badge>;
    case "DRAFT":
      return <Badge variant="outline">Rascunho</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, ad_accounts(id, account_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Toggle status mutation (ACTIVE <-> PAUSED)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ campaign, newStatus }: { campaign: Campaign; newStatus: string }) => {
      // 1. Optimistic update in Supabase
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus, sync_status: "pending" })
        .eq("id", campaign.id);

      if (error) throw error;

      // 2. Trigger n8n webhook if it has a facebook ID
      if (campaign.facebook_campaign_id) {
        const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_EDIT;
        if (n8nWebhookUrl) {
          try {
            await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "status_change",
                campaign_id: campaign.id,
                facebook_campaign_id: campaign.facebook_campaign_id,
                new_status: newStatus,
              }),
            });
          } catch (e) {
            console.warn("n8n webhook error:", e);
          }
        }
      }

      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: newStatus === "ACTIVE" ? "Campanha ativada" : "Campanha pausada",
        description: "A alteração será sincronizada com o Facebook.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: error.message,
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: "ARCHIVED", sync_status: "pending" })
        .eq("id", campaign.id);

      if (error) throw error;

      if (campaign.facebook_campaign_id) {
        const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_EDIT;
        if (n8nWebhookUrl) {
          try {
            await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "status_change",
                campaign_id: campaign.id,
                facebook_campaign_id: campaign.facebook_campaign_id,
                new_status: "ARCHIVED",
              }),
            });
          } catch (e) {
            console.warn("n8n webhook error:", e);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campanha arquivada" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaign.id);

      if (error) throw error;

      if (campaign.facebook_campaign_id) {
        const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_DELETE;
        if (n8nWebhookUrl) {
          try {
            await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "delete",
                campaign_id: campaign.id,
                facebook_campaign_id: campaign.facebook_campaign_id,
                ad_account_id: campaign.ad_account_id,
              }),
            });
          } catch (e) {
            console.warn("n8n webhook error:", e);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campanha excluída" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    },
  });

  const handleToggle = (campaign: Campaign) => {
    if (campaign.status === "ARCHIVED") return; // Can't toggle archived
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    toggleStatusMutation.mutate({ campaign, newStatus });
  };

  const columns = [
    { key: "name", header: "Campanha" },
    {
      key: "objective",
      header: "Objetivo",
      render: (campaign: Campaign) => formatObjective(campaign.objective),
    },
    {
      key: "ad_account",
      header: "Conta",
      render: (campaign: Campaign) => campaign.ad_accounts?.account_name || "-",
    },
    {
      key: "daily_budget",
      header: "Orçamento Diário",
      render: (campaign: Campaign) => formatBudget(campaign.daily_budget),
    },
    {
      key: "bid_strategy",
      header: "Estratégia de Lance",
      render: (campaign: Campaign) => formatBidStrategy(campaign.bid_strategy),
    },
    {
      key: "status",
      header: "Status",
      render: (campaign: Campaign) => getStatusBadge(campaign.status),
    },
    {
      key: "toggle",
      header: "Ativo",
      render: (campaign: Campaign) => (
        <Switch
          checked={campaign.status === "ACTIVE"}
          disabled={campaign.status === "ARCHIVED" || toggleStatusMutation.isPending}
          onCheckedChange={() => handleToggle(campaign)}
          aria-label={campaign.status === "ACTIVE" ? "Desativar campanha" : "Ativar campanha"}
        />
      ),
    },
    {
      key: "sync_status",
      header: "Sincronização",
      render: (campaign: Campaign) => (
        <div className="flex items-center gap-2">
          {getSyncBadge(campaign.sync_status)}
          {campaign.facebook_campaign_id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Sincronizar com Meta"
              onClick={async () => {
                const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_EDIT;
                if (n8nWebhookUrl) {
                  try {
                    await fetch(n8nWebhookUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "sync",
                        campaign_id: campaign.id,
                        facebook_campaign_id: campaign.facebook_campaign_id,
                      }),
                    });
                    toast({ title: "Sincronização iniciada" });
                    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["campaigns"] }), 2000);
                  } catch (e) {
                    console.warn("Sync error:", e);
                  }
                }
              }}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (campaign: Campaign) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/campaigns/${campaign.id}/edit`} className="flex items-center">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </DropdownMenuItem>

            {campaign.status !== "ARCHIVED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => archiveMutation.mutate(campaign)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Campanha?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A campanha será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteCampaignMutation.mutate(campaign)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campanhas"
        description="Gerencie suas campanhas de anúncio"
        action={
          <Button asChild>
            <Link to="/campaigns/create">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={campaigns || []} />
      )}
    </div>
  );
}
