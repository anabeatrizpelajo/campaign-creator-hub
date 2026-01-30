import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface Profile {
  id: string;
  name: string;
  facebookId: string;
  email: string;
  status: "active" | "error";
  connectedAt: string;
}

const mockProfiles: Profile[] = [
  { id: "1", name: "Perfil Principal", facebookId: "100012345678", email: "perfil1@email.com", status: "active", connectedAt: "2024-01-10" },
  { id: "2", name: "Perfil Secundário", facebookId: "100098765432", email: "perfil2@email.com", status: "active", connectedAt: "2024-02-15" },
  { id: "3", name: "Perfil Marketing", facebookId: "100011223344", email: "marketing@email.com", status: "error", connectedAt: "2024-03-20" },
];

const columns = [
  { key: "name", header: "Nome" },
  { key: "facebookId", header: "ID Facebook" },
  { key: "email", header: "Email" },
  { 
    key: "status", 
    header: "Status",
    render: (profile: Profile) => (
      <StatusBadge status={profile.status} label={profile.status === "active" ? "Conectado" : "Erro"} />
    )
  },
  { key: "connectedAt", header: "Conectado em" },
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

export default function ProfilesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Perfis Facebook" 
        description="Gerencie os perfis conectados ao Facebook"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Conectar Perfil
          </Button>
        }
      />
      <DataTable columns={columns} data={mockProfiles} />
    </div>
  );
}
