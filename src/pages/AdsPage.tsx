import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

interface Ad {
  id: string;
  name: string;
  adSet: string;
  format: string;
  impressions: string;
  clicks: string;
  ctr: string;
  status: "active" | "paused" | "error";
}

const mockAds: Ad[] = [
  { id: "1", name: "Carrossel Produtos Top", adSet: "Lookalike Compradores", format: "Carrossel", impressions: "125.4K", clicks: "2.3K", ctr: "1.83%", status: "active" },
  { id: "2", name: "Video Institucional", adSet: "Lookalike Compradores", format: "Vídeo", impressions: "89.2K", clicks: "1.1K", ctr: "1.23%", status: "active" },
  { id: "3", name: "Imagem Oferta", adSet: "Interesse Moda", format: "Imagem", impressions: "67.8K", clicks: "890", ctr: "1.31%", status: "active" },
  { id: "4", name: "Stories Promo", adSet: "Remarketing 7d", format: "Stories", impressions: "23.5K", clicks: "456", ctr: "1.94%", status: "active" },
  { id: "5", name: "Reels Produto", adSet: "Público Frio", format: "Reels", impressions: "0", clicks: "0", ctr: "0%", status: "paused" },
  { id: "6", name: "Teste A/B", adSet: "Interesse Moda", format: "Imagem", impressions: "0", clicks: "0", ctr: "0%", status: "error" },
];

const columns = [
  { key: "name", header: "Anúncio" },
  { key: "adSet", header: "Conjunto" },
  { key: "format", header: "Formato" },
  { key: "impressions", header: "Impressões" },
  { key: "clicks", header: "Cliques" },
  { key: "ctr", header: "CTR" },
  { 
    key: "status", 
    header: "Status",
    render: (ad: Ad) => <StatusBadge status={ad.status} />
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

export default function AdsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Anúncios" 
        description="Gerencie seus anúncios criativos"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Anúncio
          </Button>
        }
      />
      <DataTable columns={columns} data={mockAds} />
    </div>
  );
}
