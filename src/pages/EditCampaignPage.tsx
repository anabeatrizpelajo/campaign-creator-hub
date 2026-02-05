import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const CAMPAIGN_OBJECTIVES = [
    { value: "OUTCOME_AWARENESS", label: "Reconhecimento", minBudget: 5 },
    { value: "OUTCOME_TRAFFIC", label: "Tráfego", minBudget: 5 },
    { value: "OUTCOME_ENGAGEMENT", label: "Engajamento", minBudget: 5 },
    { value: "OUTCOME_LEADS", label: "Cadastros (Leads)", minBudget: 10 },
    { value: "OUTCOME_SALES", label: "Vendas", minBudget: 20 },
];

interface Campaign {
    id: string;
    name: string;
    objective: string;
    daily_budget: number;
    facebook_campaign_id: string | null;
    ad_account_id: string;
}

export default function EditCampaignPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        objective: "",
        daily_budget: "",
    });

    // Fetch campaign data
    const { data: campaign, isLoading } = useQuery({
        queryKey: ["campaign", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("campaigns")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as Campaign;
        },
        enabled: !!id,
    });

    // Populate form when campaign loads
    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name,
                objective: campaign.objective,
                daily_budget: (campaign.daily_budget / 100).toFixed(2),
            });
        }
    }, [campaign]);

    // Get minimum budget based on selected objective
    const selectedObjective = CAMPAIGN_OBJECTIVES.find(
        (obj) => obj.value === formData.objective
    );
    const minBudget = selectedObjective?.minBudget || 5;
    const budgetValue = parseFloat(formData.daily_budget) || 0;
    const isBudgetValid = budgetValue >= minBudget;

    // Update campaign mutation
    const updateCampaignMutation = useMutation({
        mutationFn: async () => {
            const newBudget = Math.round(parseFloat(formData.daily_budget) * 100);

            // 1. Update in Supabase
            const { error } = await supabase
                .from("campaigns")
                .update({
                    name: formData.name,
                    objective: formData.objective,
                    daily_budget: newBudget,
                    sync_status: "pending",
                })
                .eq("id", id);

            if (error) throw error;

            // 2. Trigger n8n webhook if it has a facebook ID
            if (campaign?.facebook_campaign_id) {
                const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_EDIT;
                if (n8nWebhookUrl) {
                    try {
                        await fetch(n8nWebhookUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                action: "update",
                                campaign_id: id,
                                facebook_campaign_id: campaign.facebook_campaign_id,
                                name: formData.name,
                                objective: formData.objective,
                                daily_budget: newBudget,
                            }),
                        });
                    } catch (e) {
                        console.warn("n8n webhook error:", e);
                    }
                }
            }
        },
        onSuccess: () => {
            toast({
                title: "Campanha atualizada!",
                description: "As alterações foram salvas e serão sincronizadas em breve.",
            });
            navigate("/campaigns");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        },
    });

    const isFormValid = formData.name && formData.objective && formData.daily_budget && isBudgetValid;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Editar Campanha</CardTitle>
                    <CardDescription>
                        Altere os dados da sua campanha
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                    O objetivo <strong>Vendas</strong> requer orçamento mínimo de{" "}
                                    <strong>R$ 20,00</strong>.
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

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={!isFormValid || updateCampaignMutation.isPending}
                        onClick={() => updateCampaignMutation.mutate()}
                    >
                        {updateCampaignMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
