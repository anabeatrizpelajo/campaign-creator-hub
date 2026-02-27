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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BusinessManager {
  id: number;
  name: string;
  business_manager_id: string;
  access_token: string | null;
  ad_accounts: { id: number; account_name: string }[];
}

export default function BusinessManagersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBM, setNewBM] = useState({
    name: "",
    business_manager_id: "",
    access_token: "",
  });

  const { data: businessManagers, isLoading } = useQuery({
    queryKey: ["business_managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_managers")
        .select("*, ad_accounts(id, account_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as BusinessManager[];
    },
  });

  const addBMMutation = useMutation({
    mutationFn: async (bm: typeof newBM) => {
      const { error } = await supabase.from("business_managers").insert({
        name: bm.name,
        business_manager_id: bm.business_manager_id,
        access_token: bm.access_token || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_managers"] });
      setIsDialogOpen(false);
      setNewBM({ name: "", business_manager_id: "", access_token: "" });
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
    mutationFn: async (id: number) => {
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

  const columns = [
    { key: "name", header: "Nome" },
    { key: "business_manager_id", header: "BM ID" },
    {
      key: "access_token",
      header: "Token",
      render: (bm: BusinessManager) =>
        bm.access_token ? (
          <Badge className="bg-green-500">Configurado</Badge>
        ) : (
          <Badge variant="outline">Sem token</Badge>
        ),
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
        description="Visualize seus Business Managers do Meta"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo BM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Business Manager</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="bm_name">Nome *</Label>
                  <Input
                    id="bm_name"
                    placeholder="Ex: BM Principal"
                    value={newBM.name}
                    onChange={(e) => setNewBM({ ...newBM, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bm_id">Business Manager ID *</Label>
                  <Input
                    id="bm_id"
                    placeholder="Ex: 123456789"
                    value={newBM.business_manager_id}
                    onChange={(e) => setNewBM({ ...newBM, business_manager_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="access_token">Access Token</Label>
                  <Input
                    id="access_token"
                    placeholder="Token de acesso (opcional)"
                    value={newBM.access_token}
                    onChange={(e) => setNewBM({ ...newBM, access_token: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addBMMutation.mutate(newBM)}
                  disabled={!newBM.name || !newBM.business_manager_id || addBMMutation.isPending}
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
