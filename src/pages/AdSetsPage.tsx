import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface AdSet {
  id: string;
  name: string;
  campaign: string;
  audience: string;
  budget: string;
  spent: string;
  status: "active" | "paused";
  delivery: string;
}

const mockAdSets: AdSet[] = [
  { id: "1", name: "Lookalike Compradores", campaign: "Black Friday 2024", audience: "Lookalike 1%", budget: "R$ 3.000/dia", spent: "R$ 1.500", status: "active", delivery: "Ativo" },
  { id: "2", name: "Interesse Moda", campaign: "Black Friday 2024", audience: "Interesse: Moda", budget: "R$ 2.000/dia", spent: "R$ 980", status: "active", delivery: "Ativo" },
  { id: "3", name: "Remarketing 7d", campaign: "Remarketing Carrinho", audience: "Visitantes 7 dias", budget: "R$ 500/dia", spent: "R$ 350", status: "active", delivery: "Aprendendo" },
  { id: "4", name: "Público Frio", campaign: "Lead Generation Q1", audience: "Demográfico 25-45", budget: "R$ 1.000/dia", spent: "R$ 800", status: "paused", delivery: "Pausado" },
];

const columns = [
  { key: "name", header: "Conjunto" },
  { key: "campaign", header: "Campanha" },
  { key: "audience", header: "Público" },
  { key: "budget", header: "Orçamento" },
  { key: "spent", header: "Gasto" },
  { key: "delivery", header: "Entrega" },
  { 
    key: "status", 
    header: "Status",
    render: (adSet: AdSet) => <StatusBadge status={adSet.status} />
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

export default function AdSetsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Conjuntos de Anúncios" 
        description="Gerencie os conjuntos de anúncios das suas campanhas"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Conjunto
          </Button>
        }
      />
      <DataTable columns={columns} data={mockAdSets} />
    </div>
  );
}
