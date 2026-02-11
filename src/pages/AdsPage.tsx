import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw, Trash2, Video } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdSet {
  id: string;
  name: string;
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
  ad_sets: { name: string } | null;
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

export default function AdsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAd, setNewAd] = useState({
    ad_set_id: "",
    name: "",
    headline: "",
    primary_text: "",
    call_to_action: "LEARN_MORE",
    link_url: "",
    video_drive_url: "",
  });

  const { data: adSets } = useQuery({
    queryKey: ["ad_sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_sets")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as AdSet[];
    },
  });

  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*, ad_sets(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Ad[];
    },
  });

  const addAdMutation = useMutation({
    mutationFn: async (ad: typeof newAd) => {
      const { error } = await supabase.from("ads").insert({
        ad_set_id: ad.ad_set_id,
        name: ad.name,
        headline: ad.headline || null,
        primary_text: ad.primary_text || null,
        call_to_action: ad.call_to_action,
        link_url: ad.link_url || null,
        video_drive_url: ad.video_drive_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setIsDialogOpen(false);
      setNewAd({
        ad_set_id: "",
        name: "",
        headline: "",
        primary_text: "",
        call_to_action: "LEARN_MORE",
        link_url: "",
        video_drive_url: "",
      });
      toast({ title: "Anúncio criado!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro", description: error.message });
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
      key: "ad_set",
      header: "Conjunto",
      render: (ad: Ad) => ad.ad_sets?.name || "-",
    },
    {
      key: "headline",
      header: "Título",
      render: (ad: Ad) => ad.headline || "-",
    },
    {
      key: "video",
      header: "Vídeo",
      render: (ad: Ad) =>
        ad.video_drive_url ? (
          <Badge variant="outline" className="gap-1">
            <Video className="w-3 h-3" />
            Drive
          </Badge>
        ) : (
          "-"
        ),
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
        description="Gerencie seus anúncios criativos"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <div>
                  <Label>Conjunto de Anúncios *</Label>
                  <Select
                    value={newAd.ad_set_id}
                    onValueChange={(value) => setNewAd({ ...newAd, ad_set_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um conjunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {adSets?.map((as) => (
                        <SelectItem key={as.id} value={as.id}>
                          {as.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Nome do Anúncio *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Video Promo Black Friday"
                    value={newAd.name}
                    onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="headline">Título (Headline)</Label>
                  <Input
                    id="headline"
                    placeholder="Ex: Oferta Imperdível!"
                    value={newAd.headline}
                    onChange={(e) => setNewAd({ ...newAd, headline: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="primary_text">Texto Principal</Label>
                  <Textarea
                    id="primary_text"
                    placeholder="Descrição do anúncio..."
                    value={newAd.primary_text}
                    onChange={(e) => setNewAd({ ...newAd, primary_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Call to Action</Label>
                  <Select
                    value={newAd.call_to_action}
                    onValueChange={(value) => setNewAd({ ...newAd, call_to_action: value })}
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
                <div>
                  <Label htmlFor="link_url">URL de Destino</Label>
                  <Input
                    id="link_url"
                    type="url"
                    placeholder="https://seusite.com/oferta"
                    value={newAd.link_url}
                    onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="video_drive_url">URL do Vídeo (Google Drive)</Label>
                  <Input
                    id="video_drive_url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={newAd.video_drive_url}
                    onChange={(e) => setNewAd({ ...newAd, video_drive_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole o link de compartilhamento do Drive
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => addAdMutation.mutate(newAd)}
                  disabled={!newAd.ad_set_id || !newAd.name || addAdMutation.isPending}
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
