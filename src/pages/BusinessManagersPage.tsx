import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw, Trash2, AlertCircle } from "lucide-react";
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

interface Profile {
  id: string;
  name: string;
}

interface BusinessManager {
  id: string;
  profile_id: string;
  name: string;
  facebook_business_manager_id: string;
  access_token: string | null;
  token_expires_at: string | null;
  token_type: string;
  status: string;
  profiles: { name: string } | null;
  ad_accounts: { id: string; account_name: string }[];
}

export default function BusinessManagersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBM, setNewBM] = useState({
    profile_id: "",
    name: "",
    facebook_business_manager_id: "",
    access_token: "",
    token_expires_at: "",
    token_type: "system_user",
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: businessManagers, isLoading } = useQuery({
    queryKey: ["business_managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_managers")
        .select("*, profiles(name), ad_accounts(id, account_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BusinessManager[];
    },
  });

  const addBMMutation = useMutation({
    mutationFn: async (bm: typeof newBM) => {
      const { error } = await supabase.from("business_managers").insert({
        profile_id: bm.profile_id,
        name: bm.name,
        facebook_business_manager_id: bm.facebook_business_manager_id,
        access_token: bm.access_token || null,
        token_expires_at: bm.token_expires_at || null,
        token_type: bm.token_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_managers"] });
      setIsDialogOpen(false);
      setNewBM({
        profile_id: "",
        name: "",
        facebook_business_manager_id: "",
        access_token: "",
        token_expires_at: "",
        token_type: "system_user",
      });
      toast({ title: "Business Manager adicionado!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: error.message,
      });
    },
  });

  const deleteBMMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_managers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_managers"] });
      toast({ title: "Business Manager excluído" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    },
  });

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === "banned") {
      return <Badge variant="destructive">Banido</Badge>;
    }
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge className="bg-yellow-500 text-black">Token Expirado</Badge>;
    }
    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const columns = [
    { key: "name", header: "Nome" },
    {
      key: "profile",
      header: "Perfil",
      render: (bm: BusinessManager) => bm.profiles?.name || "-",
    },
    { key: "facebook_business_manager_id", header: "BM ID" },
    { key: "token_type", header: "Tipo Token" },
    {
      key: "token_expires_at",
      header: "Expira em",
      render: (bm: BusinessManager) => formatDate(bm.token_expires_at),
    },
    {
      key: "ad_accounts_count",
      header: "Contas",
      render: (bm: BusinessManager) => {
        const count = bm.ad_accounts?.length || 0;
        return (
          <Badge variant="outline" title={bm.ad_accounts?.map(a => a.account_name).join(", ") || "Nenhuma conta"}>
            {count} {count === 1 ? "conta" : "contas"}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (bm: BusinessManager) => getStatusBadge(bm.status, bm.token_expires_at),
    },
    {
      key: "actions",
      header: "",
      render: (bm: BusinessManager) => (
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
                  <AlertDialogTitle>Excluir Business Manager?</AlertDialogTitle>
                  <AlertDialogDescription>
                    As contas de anúncio vinculadas perderão a referência.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteBMMutation.mutate(bm.id)}>
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
        title="Business Managers"
        description="Gerencie seus Business Managers do Meta"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova BM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Business Manager</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Perfil *</Label>
                  <Select
                    value={newBM.profile_id}
                    onValueChange={(value) => setNewBM({ ...newBM, profile_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bm_name">Nome da BM *</Label>
                  <Input
                    id="bm_name"
                    placeholder="Ex: BM Principal"
                    value={newBM.name}
                    onChange={(e) => setNewBM({ ...newBM, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bm_id">ID da Business Manager *</Label>
                  <Input
                    id="bm_id"
                    placeholder="123456789012345"
                    value={newBM.facebook_business_manager_id}
                    onChange={(e) =>
                      setNewBM({ ...newBM, facebook_business_manager_id: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="access_token">Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    placeholder="Token do System User"
                    value={newBM.access_token}
                    onChange={(e) => setNewBM({ ...newBM, access_token: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="token_expires">Data de Expiração do Token</Label>
                  <Input
                    id="token_expires"
                    type="date"
                    value={newBM.token_expires_at}
                    onChange={(e) =>
                      setNewBM({ ...newBM, token_expires_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Tipo de Token</Label>
                  <Select
                    value={newBM.token_type}
                    onValueChange={(value) => setNewBM({ ...newBM, token_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_user">System User</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => addBMMutation.mutate(newBM)}
                  disabled={
                    !newBM.profile_id ||
                    !newBM.name ||
                    !newBM.facebook_business_manager_id ||
                    addBMMutation.isPending
                  }
                >
                  {addBMMutation.isPending ? "Salvando..." : "Salvar"}
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
        <DataTable columns={columns} data={businessManagers || []} />
      )}
    </div>
  );
}
