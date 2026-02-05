import { Link } from "react-router-dom";
import { Plus, MoreHorizontal, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  sync_status: string;
  daily_budget: number | null;
  ad_accounts: {
    account_name: string;
  } | null;
}

const formatBudget = (cents: number | null) => {
  if (!cents) return "-";
  return `R$ ${(cents / 100).toFixed(2)}`;
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
      return <Badge variant="secondary">Pausado</Badge>;
    case "DRAFT":
      return <Badge variant="outline">Rascunho</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, ad_accounts(account_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const columns = [
    { key: "name", header: "Campanha" },
    { key: "objective", header: "Objetivo" },
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
      key: "status",
      header: "Status",
      render: (campaign: Campaign) => getStatusBadge(campaign.status),
    },
    {
      key: "sync_status",
      header: "Sincronização",
      render: (campaign: Campaign) => getSyncBadge(campaign.sync_status),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
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
