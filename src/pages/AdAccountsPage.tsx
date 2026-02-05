import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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

interface BusinessManager {
  id: string;
  name: string;
}

interface AdAccount {
  id: string;
  account_id: string;
  account_name: string;
  business_manager_id: string | null;
  currency: string;
  status: "active" | "paused" | "error";
  business_managers: { name: string } | null;
}

export default function AdAccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_id: "",
    account_name: "",
    business_manager_id: "",
  });

  const { data: businessManagers } = useQuery({
    queryKey: ["business_managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_managers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as BusinessManager[];
    },
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["ad_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_accounts")
        .select("*, business_managers(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdAccount[];
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (account: typeof newAccount) => {
      const { error } = await supabase.from("ad_accounts").insert({
        user_id: user?.id,
        account_id: account.account_id,
        account_name: account.account_name,
        business_manager_id: account.business_manager_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
      setIsDialogOpen(false);
      setNewAccount({ account_id: "", account_name: "", business_manager_id: "" });
      toast({ title: "Conta adicionada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar conta",
        description: error.message,
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
      toast({ title: "Conta excluída" });
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
    { key: "account_name", header: "Nome" },
    { key: "account_id", header: "ID da Conta" },
    {
      key: "business_manager",
      header: "Business Manager",
      render: (account: AdAccount) => account.business_managers?.name || "-",
    },
    { key: "currency", header: "Moeda" },
    {
      key: "status",
      header: "Status",
      render: (account: AdAccount) => <StatusBadge status={account.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (account: AdAccount) => (
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
                  <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    As campanhas vinculadas também serão excluídas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccountMutation.mutate(account.id)}
                  >
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
        title="Contas de Anúncio"
        description="Gerencie suas contas de anúncio do Facebook Ads"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Conta de Anúncio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Business Manager *</Label>
                  <Select
                    value={newAccount.business_manager_id}
                    onValueChange={(value) =>
                      setNewAccount({ ...newAccount, business_manager_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma BM" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessManagers?.map((bm) => (
                        <SelectItem key={bm.id} value={bm.id}>
                          {bm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account_name">Nome da Conta *</Label>
                  <Input
                    id="account_name"
                    placeholder="Ex: Conta Principal"
                    value={newAccount.account_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="account_id">ID da Conta (act_XXXXX) *</Label>
                  <Input
                    id="account_id"
                    placeholder="act_123456789"
                    value={newAccount.account_id}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_id: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addAccountMutation.mutate(newAccount)}
                  disabled={
                    !newAccount.account_id ||
                    !newAccount.account_name ||
                    !newAccount.business_manager_id ||
                    addAccountMutation.isPending
                  }
                >
                  {addAccountMutation.isPending ? "Salvando..." : "Salvar Conta"}
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
        <DataTable columns={columns} data={accounts || []} />
      )}
    </div>
  );
}
