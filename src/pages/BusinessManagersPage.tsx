import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface BusinessManager {
  id: string;
  name: string;
  bmId: string;
  adAccountsCount: number;
  status: "active" | "paused";
  createdAt: string;
}

const mockBMs: BusinessManager[] = [
  { id: "1", name: "BM Principal", bmId: "1234567890", adAccountsCount: 12, status: "active", createdAt: "2024-01-05" },
  { id: "2", name: "BM Clientes", bmId: "0987654321", adAccountsCount: 8, status: "active", createdAt: "2024-02-10" },
  { id: "3", name: "BM Backup", bmId: "1122334455", adAccountsCount: 3, status: "paused", createdAt: "2024-03-15" },
];

const columns = [
  { key: "name", header: "Nome" },
  { key: "bmId", header: "ID do BM" },
  { 
    key: "adAccountsCount", 
    header: "Contas de Anúncio",
    render: (bm: BusinessManager) => <span className="font-medium">{bm.adAccountsCount}</span>
  },
  { 
    key: "status", 
    header: "Status",
    render: (bm: BusinessManager) => <StatusBadge status={bm.status} />
  },
  { key: "createdAt", header: "Criado em" },
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

export default function BusinessManagersPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Business Managers" 
        description="Gerencie seus Business Managers do Facebook"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar BM
          </Button>
        }
      />
      <DataTable columns={columns} data={mockBMs} />
    </div>
  );
}
