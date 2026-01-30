import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
  businessManager: string;
  spendLimit: string;
  status: "active" | "paused" | "error";
  currency: string;
}

const mockAccounts: AdAccount[] = [
  { id: "1", name: "Conta Principal", accountId: "act_123456789", businessManager: "BM Principal", spendLimit: "R$ 50.000", status: "active", currency: "BRL" },
  { id: "2", name: "Conta E-commerce", accountId: "act_987654321", businessManager: "BM Principal", spendLimit: "R$ 30.000", status: "active", currency: "BRL" },
  { id: "3", name: "Conta Lead Gen", accountId: "act_112233445", businessManager: "BM Clientes", spendLimit: "R$ 20.000", status: "paused", currency: "BRL" },
  { id: "4", name: "Conta Teste", accountId: "act_556677889", businessManager: "BM Backup", spendLimit: "R$ 5.000", status: "error", currency: "BRL" },
];

const columns = [
  { key: "name", header: "Nome" },
  { key: "accountId", header: "ID da Conta" },
  { key: "businessManager", header: "Business Manager" },
  { key: "spendLimit", header: "Limite de Gasto" },
  { 
    key: "status", 
    header: "Status",
    render: (account: AdAccount) => <StatusBadge status={account.status} />
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

export default function AdAccountsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Contas de Anúncio" 
        description="Gerencie suas contas de anúncio do Facebook Ads"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        }
      />
      <DataTable columns={columns} data={mockAccounts} />
    </div>
  );
}
