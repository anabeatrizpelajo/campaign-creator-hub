import { Plus, MoreHorizontal, Copy, Megaphone, Layers, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  description: string;
  type: "campaign" | "adset" | "ad" | "full";
  usageCount: number;
  lastUsed: string;
  status: "active" | "paused";
}

const mockTemplates: Template[] = [
  { id: "1", name: "Campanha Black Friday", description: "Campanha completa com 3 conjuntos e 6 anúncios", type: "full", usageCount: 45, lastUsed: "Hoje", status: "active" },
  { id: "2", name: "Lead Gen Padrão", description: "Campanha de leads com formulário integrado", type: "campaign", usageCount: 32, lastUsed: "Ontem", status: "active" },
  { id: "3", name: "Remarketing 7 dias", description: "Conjunto para visitantes recentes", type: "adset", usageCount: 28, lastUsed: "Há 2 dias", status: "active" },
  { id: "4", name: "Carrossel Produtos", description: "Anúncio carrossel com 5 cards", type: "ad", usageCount: 56, lastUsed: "Hoje", status: "active" },
  { id: "5", name: "Stories Promocional", description: "Anúncio vertical para stories", type: "ad", usageCount: 41, lastUsed: "Há 3 dias", status: "active" },
  { id: "6", name: "Lookalike Compradores", description: "Conjunto com público lookalike 1%", type: "adset", usageCount: 23, lastUsed: "Há 1 semana", status: "paused" },
  { id: "7", name: "Conversão E-commerce", description: "Campanha otimizada para compras", type: "campaign", usageCount: 19, lastUsed: "Há 5 dias", status: "active" },
];

const typeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  campaign: { label: "Campanha", icon: Megaphone },
  adset: { label: "Conjunto", icon: Layers },
  ad: { label: "Anúncio", icon: FileImage },
  full: { label: "Completo", icon: Copy },
};

const columns = [
  { 
    key: "name", 
    header: "Template",
    render: (template: Template) => {
      const TypeIcon = typeLabels[template.type].icon;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <TypeIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
      )
    }
  },
  { 
    key: "type", 
    header: "Tipo",
    render: (template: Template) => (
      <span className="text-sm">{typeLabels[template.type].label}</span>
    )
  },
  { 
    key: "usageCount", 
    header: "Usos",
    render: (template: Template) => (
      <span className="font-medium">{template.usageCount}</span>
    )
  },
  { key: "lastUsed", header: "Último Uso" },
  { 
    key: "status", 
    header: "Status",
    render: (template: Template) => <StatusBadge status={template.status} />
  },
  {
    key: "actions",
    header: "",
    render: () => (
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm">
          Usar
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    )
  }
];

export default function TemplatesPage() {
  const campaignTemplates = mockTemplates.filter(t => t.type === "campaign");
  const adsetTemplates = mockTemplates.filter(t => t.type === "adset");
  const adTemplates = mockTemplates.filter(t => t.type === "ad");
  const fullTemplates = mockTemplates.filter(t => t.type === "full");

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Templates" 
        description="Crie e gerencie templates para ações em massa"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Copy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fullTemplates.length}</p>
              <p className="text-sm text-muted-foreground">Completos</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaignTemplates.length}</p>
              <p className="text-sm text-muted-foreground">Campanhas</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adsetTemplates.length}</p>
              <p className="text-sm text-muted-foreground">Conjuntos</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adTemplates.length}</p>
              <p className="text-sm text-muted-foreground">Anúncios</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="full">Completos</TabsTrigger>
          <TabsTrigger value="campaign">Campanhas</TabsTrigger>
          <TabsTrigger value="adset">Conjuntos</TabsTrigger>
          <TabsTrigger value="ad">Anúncios</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable columns={columns} data={mockTemplates} />
        </TabsContent>
        <TabsContent value="full">
          <DataTable columns={columns} data={fullTemplates} />
        </TabsContent>
        <TabsContent value="campaign">
          <DataTable columns={columns} data={campaignTemplates} />
        </TabsContent>
        <TabsContent value="adset">
          <DataTable columns={columns} data={adsetTemplates} />
        </TabsContent>
        <TabsContent value="ad">
          <DataTable columns={columns} data={adTemplates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
