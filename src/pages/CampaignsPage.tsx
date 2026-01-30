import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  adAccount: string;
  budget: string;
  spent: string;
  status: "active" | "paused" | "error";
  results: string;
}

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Black Friday 2024", objective: "Conversões", adAccount: "Conta Principal", budget: "R$ 10.000", spent: "R$ 4.532", status: "active", results: "234 vendas" },
  { id: "2", name: "Lead Generation Q1", objective: "Leads", adAccount: "Conta Lead Gen", budget: "R$ 5.000", spent: "R$ 3.200", status: "active", results: "890 leads" },
  { id: "3", name: "Brand Awareness", objective: "Alcance", adAccount: "Conta Principal", budget: "R$ 8.000", spent: "R$ 8.000", status: "paused", results: "1.2M alcance" },
  { id: "4", name: "Remarketing Carrinho", objective: "Conversões", adAccount: "Conta E-commerce", budget: "R$ 3.000", spent: "R$ 1.850", status: "active", results: "89 vendas" },
  { id: "5", name: "Teste Criativo", objective: "Engajamento", adAccount: "Conta Teste", budget: "R$ 500", spent: "R$ 0", status: "error", results: "-" },
];

const columns = [
  { key: "name", header: "Campanha" },
  { key: "objective", header: "Objetivo" },
  { key: "adAccount", header: "Conta" },
  { key: "budget", header: "Orçamento" },
  { key: "spent", header: "Gasto" },
  { key: "results", header: "Resultados" },
  { 
    key: "status", 
    header: "Status",
    render: (campaign: Campaign) => <StatusBadge status={campaign.status} />
  },
  {
    key: "actions",
    header: "",
    render: () => (
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    )
  }
];

export default function CampaignsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Campanhas" 
        description="Gerencie suas campanhas de anúncio"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        }
      />
      <DataTable columns={columns} data={mockCampaigns} />
    </div>
  );
}
