import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
  createdAt: string;
}

const mockUsers: User[] = [
  { id: "1", name: "João Silva", email: "joao@empresa.com", role: "Admin", status: "active", createdAt: "2024-01-15" },
  { id: "2", name: "Maria Santos", email: "maria@empresa.com", role: "Gestor", status: "active", createdAt: "2024-02-20" },
  { id: "3", name: "Pedro Costa", email: "pedro@empresa.com", role: "Operador", status: "active", createdAt: "2024-03-10" },
  { id: "4", name: "Ana Oliveira", email: "ana@empresa.com", role: "Operador", status: "pending", createdAt: "2024-04-05" },
];

const columns = [
  { key: "name", header: "Nome" },
  { key: "email", header: "Email" },
  { key: "role", header: "Cargo" },
  { 
    key: "status", 
    header: "Status",
    render: (user: User) => <StatusBadge status={user.status} />
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

export default function UsersPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Usuários" 
        description="Gerencie os usuários da plataforma"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        }
      />
      <DataTable columns={columns} data={mockUsers} />
    </div>
  );
}
