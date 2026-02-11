import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
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

interface Pixel {
  id: string;
  name: string;
  pixel_id: string;
}

interface AdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  daily_budget: number | null;
  age_min: number;
  age_max: number;
  genders: number[];
  targeting_countries: string[];
  facebook_adset_id: string | null;
  sync_status: string;
  campaigns: { name: string } | null;
}

const formatBudget = (cents: number | null) => {
  if (!cents) return "-";
  return `R$ ${(cents / 100).toFixed(2)}`;
};

const formatGender = (genders: number[] | null) => {
  if (!genders || genders.length === 0 || genders.includes(0)) return "Todos";
  if (genders.includes(1)) return "Masculino";
  if (genders.includes(2)) return "Feminino";
  return "Todos";
};

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

export default function AdSetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdSet, setNewAdSet] = useState({
    campaign_id: "",
    name: "",
    age_min: "18",
    age_max: "65",
    genders: "0",
    countries: "BR",
    pixel_id: "",
    billing_event: "IMPRESSIONS",
    optimization_goal: "OFFSITE_CONVERSIONS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  });

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

  const { data: pixels } = useQuery({
    queryKey: ["pixels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pixels")
        .select("id, name, pixel_id")
        .order("name");
      if (error) throw error;
      return data as Pixel[];
    },
  });

  const { data: adSets, isLoading } = useQuery({
    queryKey: ["ad_sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_sets")
        .select("*, campaigns(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as AdSet[];
    },
  });

  const addAdSetMutation = useMutation({
    mutationFn: async (adSet: typeof newAdSet) => {
      const gendersArray = adSet.genders === "0" ? [0] : adSet.genders === "1" ? [1] : [2];
      const countriesArray = adSet.countries.split(",").map(c => c.trim().toUpperCase()).filter(Boolean);

      const { data, error } = await supabase.from("ad_sets").insert({
        campaign_id: adSet.campaign_id,
        name: adSet.name,
        age_min: parseInt(adSet.age_min),
        age_max: parseInt(adSet.age_max),
        genders: gendersArray,
        targeting_countries: countriesArray,
      }).select().single();
      if (error) throw error;

      // Get pixel info
      const selectedPixel = pixels?.find(p => p.id === adSet.pixel_id);

      // Send webhook
      try {
        await fetch("https://webhook2.uvepom.com/webhook/create-adset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adset_id: data.id,
            campaign_id: adSet.campaign_id,
            name: adSet.name,
            age_min: parseInt(adSet.age_min),
            age_max: parseInt(adSet.age_max),
            genders: gendersArray,
            countries: countriesArray,
            billing_event: adSet.billing_event,
            optimization_goal: adSet.optimization_goal,
            bid_strategy: adSet.bid_strategy,
            promoted_object: selectedPixel ? {
              pixel_id: selectedPixel.pixel_id,
              custom_event_type: "PURCHASE",
            } : undefined,
            targeting_automation: {
              advantage_audience: 1,
            },
          }),
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_sets"] });
      setIsDialogOpen(false);
      setNewAdSet({ campaign_id: "", name: "", age_min: "18", age_max: "65", genders: "0", countries: "BR", pixel_id: "", billing_event: "IMPRESSIONS", optimization_goal: "OFFSITE_CONVERSIONS", bid_strategy: "LOWEST_COST_WITHOUT_CAP" });
      toast({ title: "Conjunto criado!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    },
  });

  const deleteAdSetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_sets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_sets"] });
      toast({ title: "Conjunto excluído" });
    },
  });

  const columns = [
    { key: "name", header: "Conjunto" },
    {
      key: "campaign",
      header: "Campanha",
      render: (adSet: AdSet) => adSet.campaigns?.name || "-",
    },
    {
      key: "targeting",
      header: "Idade",
      render: (adSet: AdSet) => `${adSet.age_min}-${adSet.age_max}`,
    },
    {
      key: "genders",
      header: "Gênero",
      render: (adSet: AdSet) => formatGender(adSet.genders),
    },
    {
      key: "countries",
      header: "Países",
      render: (adSet: AdSet) => adSet.targeting_countries?.join(", ") || "BR",
    },
    {
      key: "status",
      header: "Status",
      render: (adSet: AdSet) => getStatusBadge(adSet.status),
    },
    {
      key: "actions",
      header: "",
      render: (adSet: AdSet) => (
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
                  <AlertDialogTitle>Excluir conjunto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os anúncios vinculados também serão excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAdSetMutation.mutate(adSet.id)}>
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
        title="Conjuntos de Anúncios"
        description="Gerencie os conjuntos de anúncios das suas campanhas"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Conjunto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Conjunto de Anúncios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Campanha *</Label>
                  <Select
                    value={newAdSet.campaign_id}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, campaign_id: value })}
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
                <div>
                  <Label htmlFor="name">Nome do Conjunto *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Lookalike Compradores"
                    value={newAdSet.name}
                    onChange={(e) => setNewAdSet({ ...newAdSet, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pixel do Facebook *</Label>
                  <Select
                    value={newAdSet.pixel_id}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, pixel_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pixel" />
                    </SelectTrigger>
                    <SelectContent>
                      {pixels?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.pixel_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="countries">Países (códigos separados por vírgula)</Label>
                  <Input
                    id="countries"
                    placeholder="BR, US, PT"
                    value={newAdSet.countries}
                    onChange={(e) => setNewAdSet({ ...newAdSet, countries: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age_min">Idade Mínima</Label>
                    <Input
                      id="age_min"
                      type="number"
                      value={newAdSet.age_min}
                      onChange={(e) => setNewAdSet({ ...newAdSet, age_min: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age_max">Idade Máxima</Label>
                    <Input
                      id="age_max"
                      type="number"
                      value={newAdSet.age_max}
                      onChange={(e) => setNewAdSet({ ...newAdSet, age_max: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Gênero</Label>
                  <Select
                    value={newAdSet.genders}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, genders: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos</SelectItem>
                      <SelectItem value="1">Masculino</SelectItem>
                      <SelectItem value="2">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Billing Event</Label>
                  <Select
                    value={newAdSet.billing_event}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, billing_event: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMPRESSIONS">Impressões</SelectItem>
                      <SelectItem value="LINK_CLICKS">Cliques no Link</SelectItem>
                      <SelectItem value="THRUPLAY">ThruPlay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Objetivo de Otimização</Label>
                  <Select
                    value={newAdSet.optimization_goal}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, optimization_goal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OFFSITE_CONVERSIONS">Conversões Offsite</SelectItem>
                      <SelectItem value="CONVERSIONS">Conversões</SelectItem>
                      <SelectItem value="LINK_CLICKS">Cliques no Link</SelectItem>
                      <SelectItem value="IMPRESSIONS">Impressões</SelectItem>
                      <SelectItem value="REACH">Alcance</SelectItem>
                      <SelectItem value="LANDING_PAGE_VIEWS">Visualizações da Página</SelectItem>
                      <SelectItem value="THRUPLAY">ThruPlay</SelectItem>
                      <SelectItem value="VIDEO_VIEWS">Visualizações de Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estratégia de Lance</Label>
                  <Select
                    value={newAdSet.bid_strategy}
                    onValueChange={(value) => setNewAdSet({ ...newAdSet, bid_strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOWEST_COST_WITHOUT_CAP">Volume Mais Alto</SelectItem>
                      <SelectItem value="LOWEST_COST_WITH_BID_CAP">Limite de Lance</SelectItem>
                      <SelectItem value="COST_CAP">Custo por Resultado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => addAdSetMutation.mutate(newAdSet)}
                  disabled={!newAdSet.campaign_id || !newAdSet.name || !newAdSet.pixel_id || addAdSetMutation.isPending}
                >
                  {addAdSetMutation.isPending ? "Criando..." : "Criar Conjunto"}
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
        <DataTable columns={columns} data={adSets || []} />
      )}
    </div>
  );
}
