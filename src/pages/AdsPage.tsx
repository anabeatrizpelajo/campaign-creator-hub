import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw, Trash2, FolderOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Campaign {
  id: string;
  name: string;
}

interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
}

interface AdPage {
  id: string;
  page_id: string;
  name: string;
}

interface InstagramAccount {
  id: string;
  instagram_actor_id: string;
  name: string;
  ad_page_id: string | null;
}

interface Website {
  id: string;
  name: string;
  url: string;
}

interface Ad {
  id: string;
  ad_set_id: string;
  name: string;
  status: string;
  headline: string | null;
  primary_text: string | null;
  call_to_action: string;
  link_url: string | null;
  video_drive_url: string | null;
  video_facebook_id: string | null;
  facebook_ad_id: string | null;
  sync_status: string;
  ad_sets: { name: string; campaigns: { name: string } | null } | null;
}

const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Saiba Mais" },
  { value: "SHOP_NOW", label: "Comprar Agora" },
  { value: "SIGN_UP", label: "Cadastre-se" },
  { value: "CONTACT_US", label: "Fale Conosco" },
  { value: "DOWNLOAD", label: "Baixar" },
  { value: "WATCH_MORE", label: "Assistir" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500">Ativo</Badge>;
    case "PAUSED":
      return <Badge className="bg-yellow-500 text-black">Pausado</Badge>;
    case "DRAFT":
      return <Badge variant="outline">Rascunho</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getSyncBadge = (status: string) => {
  switch (status) {
    case "synced":
      return <Badge className="bg-green-600">Sincronizado</Badge>;
    case "pending":
      return <Badge className="bg-blue-500">Pendente</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500 text-black">Processando</Badge>;
    case "error":
      return <Badge className="bg-red-500">Erro</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const initialFormState = {
  ad_set_id: "",
  name: "",
  headline: "",
  call_to_action: "SHOP_NOW",
  ad_page_id: "",
  instagram_account_id: "",
  website_id: "",
  utm_params: "",
  video_drive_url: "",
  enable_multi_advertiser: false,
};

export default function AdsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [newAd, setNewAd] = useState(initialFormState);

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const { data: allAdSets } = useQuery({
    queryKey: ["ad_sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_sets")
        .select("id, name, campaign_id")
        .order("name");
      if (error) throw error;
      return data as AdSet[];
    },
  });

  const { data: adPages } = useQuery({
    queryKey: ["ad_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_pages")
        .select("id, page_id, name")
        .order("name");
      if (error) throw error;
      return data as AdPage[];
    },
  });

  const { data: instagramAccounts } = useQuery({
    queryKey: ["instagram_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("id, instagram_actor_id, name, ad_page_id")
        .order("name");
      if (error) throw error;
      return data as InstagramAccount[];
    },
  });

  const { data: websites } = useQuery({
    queryKey: ["websites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("websites")
        .select("id, name, url")
        .order("name");
      if (error) throw error;
      return data as Website[];
    },
  });

  const filteredAdSets = selectedCampaignId
    ? allAdSets?.filter((as) => as.campaign_id === selectedCampaignId)
    : allAdSets;

  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, ad_sets(name, campaigns(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Ad[];
    },
  });

  const addAdMutation = useMutation({
    mutationFn: async (ad: typeof newAd) => {
      // Get website URL (without UTMs - UTMs go as url_tags)
      const selectedWebsite = websites?.find((w) => w.id === ad.website_id);
      const baseUrl = selectedWebsite?.url || "";

      // Get selected page and instagram info
      const selectedPage = adPages?.find((p) => p.id === ad.ad_page_id);
      const selectedInsta = instagramAccounts?.find(
        (i) => i.id === ad.instagram_account_id
      );

      const { data, error } = await supabase
        .from("ads")
        .insert({
          ad_set_id: ad.ad_set_id,
          name: ad.name,
          headline: ad.headline || null,
          call_to_action: ad.call_to_action,
          link_url: baseUrl || null,
          video_drive_url: ad.video_drive_url || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Send webhook to n8n
      try {
        await fetch("https://webhook2.uvepom.com/webhook/create-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ad_id: data.id,
            ad_set_id: ad.ad_set_id,
            campaign_id: selectedCampaignId,
            name: ad.name,
            headline: ad.headline || null,
            call_to_action: ad.call_to_action,
            link_url: baseUrl || null,
            url_tags: ad.utm_params || null,
            page_id: selectedPage?.page_id || null,
            instagram_actor_id: selectedInsta?.instagram_actor_id || null,
            video_drive_url: ad.video_drive_url || null,
            enable_multi_advertiser: ad.enable_multi_advertiser,
          }),
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setIsDialogOpen(false);
      setSelectedCampaignId("");
      setNewAd(initialFormState);
      toast({ title: "Anúncio criado! O vídeo será processado pelo n8n." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "Anúncio excluído" });
    },
  });

  const columns = [
    { key: "name", header: "Anúncio" },
    {
      key: "campaign",
      header: "Campanha",
      render: (ad: Ad) => ad.ad_sets?.campaigns?.name || "-",
    },
    {
      key: "ad_set",
      header: "Conjunto",
      render: (ad: Ad) => ad.ad_sets?.name || "-",
    },
    {
      key: "video",
      header: "Drive",
      render: (ad: Ad) =>
        ad.video_drive_url ? (
          <a href={ad.video_drive_url} target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent">
              <FolderOpen className="w-3 h-3" />
              Pasta
            </Badge>
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "sync_status",
      header: "Sincronização",
      render: (ad: Ad) => getSyncBadge(ad.sync_status),
    },
    {
      key: "status",
      header: "Status",
      render: (ad: Ad) => getStatusBadge(ad.status),
    },
    {
      key: "actions",
      header: "",
      render: (ad: Ad) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAdMutation.mutate(ad.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Anúncios"
        description="Crie anúncios com vídeos do Google Drive"
        action={
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setSelectedCampaignId("");
                setNewAd(initialFormState);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Anúncio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Campanha */}
                <div>
                  <Label>Campanha *</Label>
                  <Select
                    value={selectedCampaignId}
                    onValueChange={(value) => {
                      setSelectedCampaignId(value);
                      setNewAd({ ...newAd, ad_set_id: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma campanha" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conjunto de Anúncios */}
                <div>
                  <Label>Conjunto de Anúncios *</Label>
                  <Select
                    value={newAd.ad_set_id}
                    onValueChange={(value) => setNewAd({ ...newAd, ad_set_id: value })}
                    disabled={!selectedCampaignId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedCampaignId
                            ? "Selecione um conjunto"
                            : "Selecione uma campanha primeiro"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAdSets?.map((as) => (
                        <SelectItem key={as.id} value={as.id}>
                          {as.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Página de Anúncio (Facebook) */}
                <div>
                  <Label>Página de Anúncio (Facebook) *</Label>
                  <Select
                    value={newAd.ad_page_id}
                    onValueChange={(value) => setNewAd({ ...newAd, ad_page_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma página" />
                    </SelectTrigger>
                    <SelectContent>
                      {adPages?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          📘 {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conta Instagram */}
                <div>
                  <Label>Conta Instagram</Label>
                  <Select
                    value={newAd.instagram_account_id}
                    onValueChange={(value) =>
                      setNewAd({ ...newAd, instagram_account_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {instagramAccounts?.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          📸 {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional. Para veicular o anúncio também no Instagram.
                  </p>
                </div>

                {/* Nome do Anúncio */}
                <div>
                  <Label htmlFor="name">Nome do Anúncio *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Video Promo Black Friday"
                    value={newAd.name}
                    onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                  />
                </div>

                {/* Pasta do Drive */}
                <div>
                  <Label htmlFor="video_drive_url">Link da Pasta do Google Drive *</Label>
                  <Input
                    id="video_drive_url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newAd.video_drive_url}
                    onChange={(e) =>
                      setNewAd({ ...newAd, video_drive_url: e.target.value })
                    }
                  />
                </div>

                {/* Título */}
                <div>
                  <Label htmlFor="headline">Título *</Label>
                  <Input
                    id="headline"
                    placeholder="Ex: Oferta Imperdível!"
                    value={newAd.headline}
                    onChange={(e) => setNewAd({ ...newAd, headline: e.target.value })}
                  />
                </div>

                {/* CTA */}
                <div>
                  <Label>Call to Action</Label>
                  <Select
                    value={newAd.call_to_action}
                    onValueChange={(value) =>
                      setNewAd({ ...newAd, call_to_action: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((cta) => (
                        <SelectItem key={cta.value} value={cta.value}>
                          {cta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Website */}
                <div>
                  <Label>Site de Destino *</Label>
                  <Select
                    value={newAd.website_id}
                    onValueChange={(value) => setNewAd({ ...newAd, website_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um site" />
                    </SelectTrigger>
                    <SelectContent>
                      {websites?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* UTMs */}
                <div>
                  <Label htmlFor="utm_params">UTMs</Label>
                  <Input
                    id="utm_params"
                    placeholder="utm_source=fb&utm_medium=cpc&utm_campaign=promo"
                    value={newAd.utm_params}
                    onChange={(e) => setNewAd({ ...newAd, utm_params: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Parâmetros UTM serão adicionados à URL automaticamente.
                  </p>
                </div>

                {/* Configurações Avançadas */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <p className="text-sm font-medium">Configurações Avançadas</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_multi_advertiser" className="text-sm">
                        Anunciar com vários anunciantes
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Seu anúncio pode aparecer junto a outros
                      </p>
                    </div>
                    <Switch
                      id="enable_multi_advertiser"
                      checked={newAd.enable_multi_advertiser}
                      onCheckedChange={(checked) =>
                        setNewAd({ ...newAd, enable_multi_advertiser: checked })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => addAdMutation.mutate(newAd)}
                  disabled={
                    !newAd.ad_set_id ||
                    !newAd.name ||
                    !newAd.video_drive_url ||
                    !newAd.ad_page_id ||
                    !newAd.website_id ||
                    addAdMutation.isPending
                  }
                >
                  {addAdMutation.isPending ? "Criando..." : "Criar Anúncio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={ads || []} />
      )}
    </div>
  );
}
