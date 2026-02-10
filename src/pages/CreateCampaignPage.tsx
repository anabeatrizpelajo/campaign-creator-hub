import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CAMPAIGN_OBJECTIVES = [
    { value: "OUTCOME_AWARENESS", label: "Reconhecimento", minBudget: 5 },
    { value: "OUTCOME_TRAFFIC", label: "Tráfego", minBudget: 5 },
    { value: "OUTCOME_ENGAGEMENT", label: "Engajamento", minBudget: 5 },
    { value: "OUTCOME_LEADS", label: "Cadastros (Leads)", minBudget: 10 },
    { value: "OUTCOME_SALES", label: "Vendas", minBudget: 20 },
];

interface AdAccount {
    id: string;
    account_id: string;
    account_name: string;
}

export default function CreateCampaignPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        objective: "",
        daily_budget: "",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    });

    // Fetch ad accounts for selection
    const { data: adAccounts, isLoading: loadingAccounts } = useQuery({
        queryKey: ["ad_accounts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("ad_accounts")
                .select("id, account_id, account_name")
                .eq("status", "active");
            if (error) throw error;
            return data as AdAccount[];
        },
    });

    // Get minimum budget based on selected objective
    const selectedObjective = CAMPAIGN_OBJECTIVES.find(
        (obj) => obj.value === formData.objective
    );
    const minBudget = selectedObjective?.minBudget || 5;

    // Toggle account selection
    const toggleAccount = (accountId: string) => {
        setSelectedAccounts((prev) =>
            prev.includes(accountId)
                ? prev.filter((id) => id !== accountId)
                : [...prev, accountId]
        );
    };

    // Create campaign mutation (supports multiple accounts)
    const createCampaignMutation = useMutation({
        mutationFn: async () => {
            const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_CREATE;
            const createdCampaigns = [];

            // Create one campaign per selected account
            for (const accountId of selectedAccounts) {
                const { data: campaign, error } = await supabase
                    .from("campaigns")
                    .insert({
                        user_id: user?.id,
                        ad_account_id: accountId,
                        name: formData.name,
                        objective: formData.objective,
                        daily_budget: Math.round(parseFloat(formData.daily_budget) * 100),
                        bid_strategy: formData.bid_strategy,
                        status: "DRAFT",
                        sync_status: "pending",
                    })
                    .select()
                    .single();

                if (error) throw error;
                createdCampaigns.push(campaign);

                // Trigger n8n webhook for each campaign
                if (n8nWebhookUrl) {
                    try {
                        await fetch(n8nWebhookUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                campaign_id: campaign.id,
                                user_id: user?.id,
                            }),
                        });
                    } catch (e) {
                        console.warn("n8n webhook not reachable:", e);
                    }
                }
            }

            return createdCampaigns;
        },
        onSuccess: (campaigns) => {
            toast({
                title: `${campaigns.length} campanha(s) criada(s)!`,
                description: "As campanhas foram salvas e serão sincronizadas em breve.",
            });
            navigate("/campaigns");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro ao criar campanha",
                description: error.message,
            });
        },
    });

    const budgetValue = parseFloat(formData.daily_budget) || 0;
    const isBudgetValid = budgetValue >= minBudget;

    const isFormValid =
        selectedAccounts.length > 0 &&
        formData.name &&
        formData.objective &&
        formData.daily_budget &&
        isBudgetValid;

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Criar Nova Campanha</CardTitle>
                    <CardDescription>
                        Preencha os dados abaixo para criar uma campanha no Facebook Ads
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Ad Account Selection - Multi Select */}
                    <div className="space-y-3">
                        <Label>Contas de Anúncio</Label>
                        <p className="text-sm text-muted-foreground">
                            Selecione uma ou mais contas para criar a campanha
                        </p>
                        <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                            {loadingAccounts ? (
                                <p className="text-sm text-muted-foreground">Carregando...</p>
                            ) : adAccounts?.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma conta encontrada
                                </p>
                            ) : (
                                adAccounts?.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center space-x-3"
                                    >
                                        <Checkbox
                                            id={account.id}
                                            checked={selectedAccounts.includes(account.id)}
                                            onCheckedChange={() => toggleAccount(account.id)}
                                        />
                                        <label
                                            htmlFor={account.id}
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            {account.account_name}{" "}
                                            <span className="text-muted-foreground">
                                                ({account.account_id})
                                            </span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        {selectedAccounts.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {selectedAccounts.length} conta(s) selecionada(s)
                            </p>
                        )}
                    </div>

                    {/* Campaign Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Campanha</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Black Friday 2024"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                        />
                    </div>

                    {/* Objective */}
                    <div className="space-y-2">
                        <Label htmlFor="objective">Objetivo</Label>
                        <Select
                            value={formData.objective}
                            onValueChange={(value) =>
                                setFormData({ ...formData, objective: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {CAMPAIGN_OBJECTIVES.map((obj) => (
                                    <SelectItem key={obj.value} value={obj.value}>
                                        {obj.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formData.objective === "OUTCOME_SALES" && (
                            <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    O objetivo <strong>Vendas</strong> requer um orçamento mínimo
                                    de <strong>R$ 20,00</strong> por dia.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Daily Budget */}
                    <div className="space-y-2">
                        <Label htmlFor="daily_budget">Orçamento Diário (R$)</Label>
                        <Input
                            id="daily_budget"
                            type="number"
                            min={minBudget}
                            step="0.01"
                            placeholder={minBudget.toFixed(2)}
                            value={formData.daily_budget}
                            onChange={(e) =>
                                setFormData({ ...formData, daily_budget: e.target.value })
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo para {selectedObjective?.label || "este objetivo"}:{" "}
                            <strong>R$ {minBudget.toFixed(2)}</strong>
                        </p>
                        {formData.daily_budget && !isBudgetValid && (
                            <p className="text-xs text-destructive">
                                O orçamento deve ser no mínimo R$ {minBudget.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Bid Strategy */}
                    <div className="space-y-2">
                        <Label>Estratégia de Lance</Label>
                        <Select
                            value={formData.bid_strategy}
                            onValueChange={(value) =>
                                setFormData({ ...formData, bid_strategy: value })
                            }
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
                        <p className="text-xs text-muted-foreground">
                            {formData.bid_strategy === "LOWEST_COST_WITHOUT_CAP" && "O Meta busca o maior volume de resultados pelo menor custo."}
                            {formData.bid_strategy === "LOWEST_COST_WITH_BID_CAP" && "Define um lance máximo por resultado (bid_amount obrigatório no ad set)."}
                            {formData.bid_strategy === "COST_CAP" && "Define um custo-alvo médio por resultado (bid_amount obrigatório no ad set)."}
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={!isFormValid || createCampaignMutation.isPending}
                        onClick={() => createCampaignMutation.mutate()}
                    >
                        {createCampaignMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Criar Campanha{selectedAccounts.length > 1 ? "s" : ""}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
