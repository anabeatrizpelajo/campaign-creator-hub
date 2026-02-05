import { useState } from "react";
import { Plus, MoreHorizontal, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdAccount {
  id: string;
  account_id: string;
  account_name: string;
  access_token: string | null;
  currency: string;
  status: "active" | "paused" | "error";
}

export default function AdAccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_id: "",
    account_name: "",
    access_token: "",
  });

  // Fetch ad accounts from Supabase
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["ad_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdAccount[];
    },
  });

  // Add new ad account
  const addAccountMutation = useMutation({
    mutationFn: async (account: typeof newAccount) => {
      const { error } = await supabase.from("ad_accounts").insert({
        user_id: user?.id,
        account_id: account.account_id,
        account_name: account.account_name,
        access_token: account.access_token || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_accounts"] });
      setIsDialogOpen(false);
      setNewAccount({ account_id: "", account_name: "", access_token: "" });
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

  const columns = [
    { key: "account_name", header: "Nome" },
    { key: "account_id", header: "ID da Conta" },
    { key: "currency", header: "Moeda" },
    {
      key: "access_token",
      header: "Token",
      render: (account: AdAccount) => (
        <span className="text-muted-foreground">
          {account.access_token ? "••••••••" : "Não configurado"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (account: AdAccount) => <StatusBadge status={account.status} />,
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
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
                  <Label htmlFor="account_name">Nome da Conta</Label>
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
                  <Label htmlFor="account_id">ID da Conta (act_XXXXX)</Label>
                  <Input
                    id="account_id"
                    placeholder="act_123456789"
                    value={newAccount.account_id}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_id: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="access_token">Access Token (opcional)</Label>
                  <Input
                    id="access_token"
                    type="password"
                    placeholder="Token da API do Facebook"
                    value={newAccount.access_token}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, access_token: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addAccountMutation.mutate(newAccount)}
                  disabled={!newAccount.account_id || !newAccount.account_name}
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
