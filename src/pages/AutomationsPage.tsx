import { Plus, Play, Pause, MoreHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  lastRun: string;
  runsToday: number;
  status: "active" | "paused";
}

const mockAutomations: Automation[] = [
  { id: "1", name: "Criar Campanha Automática", trigger: "Novo produto cadastrado", action: "Criar campanha + anúncio", lastRun: "Há 5 min", runsToday: 12, status: "active" },
  { id: "2", name: "Pausar Anúncios Baixo CTR", trigger: "CTR < 0.5%", action: "Pausar anúncio", lastRun: "Há 1h", runsToday: 3, status: "active" },
  { id: "3", name: "Escalar Budget Vencedores", trigger: "ROAS > 3", action: "Aumentar budget 20%", lastRun: "Há 30 min", runsToday: 8, status: "active" },
  { id: "4", name: "Notificar Erros", trigger: "Status = Erro", action: "Enviar alerta Slack", lastRun: "Há 2h", runsToday: 1, status: "paused" },
  { id: "5", name: "Duplicar Conjuntos", trigger: "Conjunto aprovado", action: "Duplicar para outras contas", lastRun: "Ontem", runsToday: 0, status: "paused" },
];

const columns = [
  { 
    key: "name", 
    header: "Automação",
    render: (automation: Automation) => (
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="font-medium">{automation.name}</span>
      </div>
    )
  },
  { key: "trigger", header: "Gatilho" },
  { key: "action", header: "Ação" },
  { key: "lastRun", header: "Última Execução" },
  { 
    key: "runsToday", 
    header: "Execuções Hoje",
    render: (automation: Automation) => (
      <span className="font-medium">{automation.runsToday}</span>
    )
  },
  { 
    key: "status", 
    header: "Status",
    render: (automation: Automation) => <StatusBadge status={automation.status} />
  },
  {
    key: "actions",
    header: "",
    render: (automation: Automation) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          {automation.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    )
  }
];

export default function AutomationsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Automações" 
        description="Gerencie as automações n8n conectadas à plataforma"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Automação
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Automações Ativas</p>
          <p className="text-2xl font-bold mt-1">3</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Execuções Hoje</p>
          <p className="text-2xl font-bold mt-1">24</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
          <p className="text-2xl font-bold mt-1 text-success">98.5%</p>
        </div>
      </div>

      <DataTable columns={columns} data={mockAutomations} />
    </div>
  );
}
