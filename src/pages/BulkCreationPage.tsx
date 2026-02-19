import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    ArrowLeft,
    ArrowRight,
    Send,
    Loader2,
    ChevronRight,
    Megaphone,
    Layers,
    FileImage,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CAMPAIGN_OBJECTIVES = [
    { value: "OUTCOME_AWARENESS", label: "Reconhecimento" },
    { value: "OUTCOME_TRAFFIC", label: "Tráfego" },
    { value: "OUTCOME_ENGAGEMENT", label: "Engajamento" },
    { value: "OUTCOME_LEADS", label: "Cadastros (Leads)" },
    { value: "OUTCOME_SALES", label: "Vendas" },
];

const CTA_OPTIONS = [
    { value: "LEARN_MORE", label: "Saiba Mais" },
    { value: "SHOP_NOW", label: "Comprar Agora" },
    { value: "SIGN_UP", label: "Cadastre-se" },
    { value: "CONTACT_US", label: "Fale Conosco" },
    { value: "DOWNLOAD", label: "Baixar" },
    { value: "WATCH_MORE", label: "Assistir" },
];

const STEPS = ["Campanhas", "Conjuntos", "Anúncios", "Revisão"];

interface AdAccount { id: string; account_id: string; account_name: string; }
interface Pixel { id: string; name: string; pixel_id: string; }
interface AdPage { id: string; page_id: string; name: string; }
interface InstagramAccount { id: string; instagram_actor_id: string; name: string; }
interface Website { id: string; name: string; url: string; }

export default function BulkCreationPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState(0);

    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [campaignConfig, setCampaignConfig] = useState({
        name: "", quantity: 1, objective: "OUTCOME_SALES",
        daily_budget: "20", bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    });

    const [adSetConfig, setAdSetConfig] = useState({
        name: "", quantity: 1, age_min: "18", age_max: "65",
        genders: "0", countries: "BR", pixel_id: "",
        billing_event: "IMPRESSIONS", optimization_goal: "OFFSITE_CONVERSIONS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    });

    const [adConfig, setAdConfig] = useState({
        name: "", quantity: 1, ad_page_id: "", instagram_account_id: "",
        headline: "", call_to_action: "SHOP_NOW", website_id: "",
        utm_params: "", video_drive_url: "", enable_multi_advertiser: false,
    });

    const { data: adAccounts } = useQuery({
        queryKey: ["ad_accounts"],
        queryFn: async () => {
            const { data, error } = await supabase.from("ad_accounts").select("id, account_id, account_name").eq("status", "active");
            if (error) throw error;
            return data as AdAccount[];
        },
    });

    const { data: pixels } = useQuery({
        queryKey: ["pixels"],
        queryFn: async () => {
            const { data, error } = await supabase.from("pixels").select("id, name, pixel_id").order("name");
            if (error) throw error;
            return data as Pixel[];
        },
    });

    const { data: adPages } = useQuery({
        queryKey: ["ad_pages"],
        queryFn: async () => {
            const { data, error } = await supabase.from("ad_pages").select("id, page_id, name").order("name");
            if (error) throw error;
            return data as AdPage[];
        },
    });

    const { data: instagramAccounts } = useQuery({
        queryKey: ["instagram_accounts"],
        queryFn: async () => {
            const { data, error } = await supabase.from("instagram_accounts").select("id, instagram_actor_id, name").order("name");
            if (error) throw error;
            return data as InstagramAccount[];
        },
    });

    const { data: websites } = useQuery({
        queryKey: ["websites"],
        queryFn: async () => {
            const { data, error } = await supabase.from("websites").select("id, name, url").order("name");
            if (error) throw error;
            return data as Website[];
        },
    });

    const toggleAccount = (id: string) => {
        setSelectedAccounts((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
    };

    const totalCampaigns = campaignConfig.quantity * selectedAccounts.length;
    const totalSets = totalCampaigns * adSetConfig.quantity;
    const totalAds = totalSets * adConfig.quantity;

    // Build preview for review step
    const buildPreview = () => {
        const ads = Array.from({ length: adConfig.quantity }, (_, i) => ({
            name: adConfig.name.replace(/\{\{i\}\}/g, String(i + 1)),
        }));
        const adSets = Array.from({ length: adSetConfig.quantity }, (_, i) => ({
            name: adSetConfig.name.replace(/\{\{i\}\}/g, String(i + 1)),
            ads,
        }));
        const campaigns = Array.from({ length: campaignConfig.quantity }, (_, i) => ({
            name: campaignConfig.name.replace(/\{\{i\}\}/g, String(i + 1)),
            objective: campaignConfig.objective,
            ad_sets: adSets,
        }));
        return campaigns;
    };

    // Submit: insert into Supabase first, then send webhook with IDs
    const submitMutation = useMutation({
        mutationFn: async () => {
            const selectedPage = adPages?.find((p) => p.id === adConfig.ad_page_id);
            const selectedInsta = instagramAccounts?.find((i) => i.id === adConfig.instagram_account_id);
            const selectedWebsite = websites?.find((w) => w.id === adConfig.website_id);
            const selectedPixel = pixels?.find((p) => p.id === adSetConfig.pixel_id);
            const gendersArray = adSetConfig.genders === "0" ? [0] : adSetConfig.genders === "1" ? [1] : [2];
            const countriesArray = adSetConfig.countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
            const baseUrl = selectedWebsite?.url || "";

            const webhookCampaigns: any[] = [];

            for (const accountId of selectedAccounts) {
                for (let ci = 0; ci < campaignConfig.quantity; ci++) {
                    const campName = campaignConfig.name.replace(/\{\{i\}\}/g, String(ci + 1));

                    const { data: campaign, error: campError } = await supabase
                        .from("campaigns")
                        .insert({
                            ad_account_id: accountId, name: campName,
                            objective: campaignConfig.objective,
                            daily_budget: Math.round(parseFloat(campaignConfig.daily_budget) * 100),
                            bid_strategy: campaignConfig.bid_strategy,
                            status: "DRAFT", sync_status: "pending",
                        })
                        .select("id").single();
                    if (campError) throw campError;

                    const webhookAdSets: any[] = [];

                    for (let si = 0; si < adSetConfig.quantity; si++) {
                        const setName = adSetConfig.name.replace(/\{\{i\}\}/g, String(si + 1));

                        const { data: adSet, error: setError } = await supabase
                            .from("ad_sets")
                            .insert({
                                campaign_id: campaign.id, name: setName,
                                age_min: parseInt(adSetConfig.age_min),
                                age_max: parseInt(adSetConfig.age_max),
                                genders: gendersArray, targeting_countries: countriesArray,
                            })
                            .select("id").single();
                        if (setError) throw setError;

                        const webhookAds: any[] = [];

                        for (let ai = 0; ai < adConfig.quantity; ai++) {
                            const adName = adConfig.name.replace(/\{\{i\}\}/g, String(ai + 1));

                            const { data: ad, error: adError } = await supabase
                                .from("ads")
                                .insert({
                                    ad_set_id: adSet.id, name: adName,
                                    headline: adConfig.headline || null,
                                    call_to_action: adConfig.call_to_action,
                                    link_url: baseUrl || null,
                                    video_drive_url: adConfig.video_drive_url || null,
                                })
                                .select("id").single();
                            if (adError) throw adError;

                            webhookAds.push({
                                ad_id: ad.id, adset_id: adSet.id, campaign_id: campaign.id,
                                name: adName,
                                headline: adConfig.headline || null,
                                call_to_action: adConfig.call_to_action,
                                page_id: selectedPage?.page_id || null,
                                instagram_actor_id: selectedInsta?.instagram_actor_id || null,
                                video_drive_url: adConfig.video_drive_url || null,
                                link_url: baseUrl || null,
                                url_tags: adConfig.utm_params || null,
                                enable_multi_advertiser: adConfig.enable_multi_advertiser,
                            });
                        }

                        webhookAdSets.push({
                            adset_id: adSet.id, campaign_id: campaign.id, name: setName,
                            age_min: parseInt(adSetConfig.age_min),
                            age_max: parseInt(adSetConfig.age_max),
                            genders: gendersArray, countries: countriesArray,
                            pixel_id: selectedPixel?.pixel_id || null,
                            billing_event: adSetConfig.billing_event,
                            optimization_goal: adSetConfig.optimization_goal,
                            bid_strategy: adSetConfig.bid_strategy,
                            promoted_object: selectedPixel ? { pixel_id: selectedPixel.pixel_id, custom_event_type: "PURCHASE" } : undefined,
                            targeting_automation: { advantage_audience: 1 },
                            ads: webhookAds,
                        });
                    }

                    webhookCampaigns.push({
                        campaign_id: campaign.id, ad_account_id: accountId, name: campName,
                        objective: campaignConfig.objective,
                        daily_budget: Math.round(parseFloat(campaignConfig.daily_budget) * 100),
                        bid_strategy: campaignConfig.bid_strategy,
                        ad_sets: webhookAdSets,
                    });
                }
            }

            const res = await fetch("https://webhook.myflowhub.cloud/webhook/create-bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaigns: webhookCampaigns,
                    user_id: user?.id,
                    total_campaigns: totalCampaigns,
                    total_adsets: totalSets,
                    total_ads: totalAds,
                }),
            });
            if (!res.ok) throw new Error("Webhook falhou");
            return webhookCampaigns;
        },
        onSuccess: () => {
            toast({ title: "Enviado com sucesso!", description: `${totalCampaigns} campanhas, ${totalSets} conjuntos e ${totalAds} anúncios criados e enviados ao n8n.` });
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Erro ao criar", description: error.message });
        },
    });

    const canGoNext = () => {
        if (step === 0) return selectedAccounts.length > 0 && campaignConfig.name && campaignConfig.objective && campaignConfig.daily_budget;
        if (step === 1) return adSetConfig.name && adSetConfig.countries;
        if (step === 2) return adConfig.name && adConfig.ad_page_id && adConfig.video_drive_url && adConfig.website_id;
        return true;
    };

    // ── Step 0: Campaigns ──
    const renderStep0 = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Contas de Anúncio</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {adAccounts?.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-3">
                            <Checkbox id={acc.id} checked={selectedAccounts.includes(acc.id)} onCheckedChange={() => toggleAccount(acc.id)} />
                            <label htmlFor={acc.id} className="text-sm cursor-pointer">
                                {acc.account_name} <span className="text-muted-foreground">({acc.account_id})</span>
                            </label>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Configuração da Campanha</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Nome Base *</Label>
                            <Input placeholder='Ex: "BF {{i}}"' value={campaignConfig.name} onChange={(e) => setCampaignConfig({ ...campaignConfig, name: e.target.value })} />
                            <p className="text-xs text-muted-foreground mt-1">Use {"{{i}}"} para índice automático</p>
                        </div>
                        <div>
                            <Label>Quantidade *</Label>
                            <Input type="number" min={1} max={50} value={campaignConfig.quantity} onChange={(e) => setCampaignConfig({ ...campaignConfig, quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Objetivo *</Label>
                            <Select value={campaignConfig.objective} onValueChange={(v) => setCampaignConfig({ ...campaignConfig, objective: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CAMPAIGN_OBJECTIVES.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Orçamento Diário (R$) *</Label>
                            <Input type="number" min={5} value={campaignConfig.daily_budget} onChange={(e) => setCampaignConfig({ ...campaignConfig, daily_budget: e.target.value })} />
                        </div>
                        <div>
                            <Label>Bid Strategy</Label>
                            <Select value={campaignConfig.bid_strategy} onValueChange={(v) => setCampaignConfig({ ...campaignConfig, bid_strategy: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOWEST_COST_WITHOUT_CAP">Menor Custo</SelectItem>
                                    <SelectItem value="COST_CAP">Custo Alvo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // ── Step 1: Ad Sets ──
    const renderStep1 = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Configuração do Conjunto de Anúncios</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Nome Base *</Label>
                            <Input placeholder='Ex: "Conjunto {{i}}"' value={adSetConfig.name} onChange={(e) => setAdSetConfig({ ...adSetConfig, name: e.target.value })} />
                            <p className="text-xs text-muted-foreground mt-1">Use {"{{i}}"} para índice automático</p>
                        </div>
                        <div>
                            <Label>Quantidade *</Label>
                            <Input type="number" min={1} max={50} value={adSetConfig.quantity} onChange={(e) => setAdSetConfig({ ...adSetConfig, quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Pixel</Label>
                            <Select value={adSetConfig.pixel_id} onValueChange={(v) => setAdSetConfig({ ...adSetConfig, pixel_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{pixels?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Países *</Label>
                            <Input value={adSetConfig.countries} onChange={(e) => setAdSetConfig({ ...adSetConfig, countries: e.target.value })} placeholder="BR, US, PT" />
                        </div>
                        <div>
                            <Label>Gênero</Label>
                            <Select value={adSetConfig.genders} onValueChange={(v) => setAdSetConfig({ ...adSetConfig, genders: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Todos</SelectItem>
                                    <SelectItem value="1">Masculino</SelectItem>
                                    <SelectItem value="2">Feminino</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Idade Mínima</Label>
                            <Input type="number" min={13} max={65} value={adSetConfig.age_min} onChange={(e) => setAdSetConfig({ ...adSetConfig, age_min: e.target.value })} />
                        </div>
                        <div>
                            <Label>Idade Máxima</Label>
                            <Input type="number" min={13} max={65} value={adSetConfig.age_max} onChange={(e) => setAdSetConfig({ ...adSetConfig, age_max: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Billing Event</Label>
                            <Select value={adSetConfig.billing_event} onValueChange={(v) => setAdSetConfig({ ...adSetConfig, billing_event: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="IMPRESSIONS">Impressões</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Optimization Goal</Label>
                            <Select value={adSetConfig.optimization_goal} onValueChange={(v) => setAdSetConfig({ ...adSetConfig, optimization_goal: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OFFSITE_CONVERSIONS">Conversões</SelectItem>
                                    <SelectItem value="LINK_CLICKS">Cliques no Link</SelectItem>
                                    <SelectItem value="LANDING_PAGE_VIEWS">Visualizações da Página</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Bid Strategy</Label>
                            <Select value={adSetConfig.bid_strategy} onValueChange={(v) => setAdSetConfig({ ...adSetConfig, bid_strategy: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOWEST_COST_WITHOUT_CAP">Menor Custo</SelectItem>
                                    <SelectItem value="COST_CAP">Custo Alvo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // ── Step 2: Ads ──
    const renderStep2 = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Configuração do Anúncio</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Nome Base *</Label>
                            <Input placeholder='Ex: "Ad {{i}}"' value={adConfig.name} onChange={(e) => setAdConfig({ ...adConfig, name: e.target.value })} />
                            <p className="text-xs text-muted-foreground mt-1">Use {"{{i}}"} para índice automático</p>
                        </div>
                        <div>
                            <Label>Quantidade *</Label>
                            <Input type="number" min={1} max={50} value={adConfig.quantity} onChange={(e) => setAdConfig({ ...adConfig, quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Página de Anúncio *</Label>
                            <Select value={adConfig.ad_page_id} onValueChange={(v) => setAdConfig({ ...adConfig, ad_page_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{adPages?.map((p) => (<SelectItem key={p.id} value={p.id}>📘 {p.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Conta Instagram</Label>
                            <Select value={adConfig.instagram_account_id} onValueChange={(v) => setAdConfig({ ...adConfig, instagram_account_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Nenhuma (opcional)" /></SelectTrigger>
                                <SelectContent>{instagramAccounts?.map((i) => (<SelectItem key={i.id} value={i.id}>📸 {i.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Pasta do Drive *</Label>
                        <Input placeholder="https://drive.google.com/drive/folders/..." value={adConfig.video_drive_url} onChange={(e) => setAdConfig({ ...adConfig, video_drive_url: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Título *</Label>
                            <Input placeholder="Ex: Oferta Imperdível!" value={adConfig.headline} onChange={(e) => setAdConfig({ ...adConfig, headline: e.target.value })} />
                        </div>
                        <div>
                            <Label>Call to Action</Label>
                            <Select value={adConfig.call_to_action} onValueChange={(v) => setAdConfig({ ...adConfig, call_to_action: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CTA_OPTIONS.map((cta) => (<SelectItem key={cta.value} value={cta.value}>{cta.label}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Site de Destino *</Label>
                            <Select value={adConfig.website_id} onValueChange={(v) => setAdConfig({ ...adConfig, website_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{websites?.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name} ({w.url})</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>UTMs</Label>
                            <Input placeholder="utm_source=fb&utm_campaign=promo" value={adConfig.utm_params} onChange={(e) => setAdConfig({ ...adConfig, utm_params: e.target.value })} />
                        </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="bulk_multi_adv" className="text-sm">Anunciar com vários anunciantes</Label>
                                <p className="text-xs text-muted-foreground">Seu anúncio pode aparecer junto a outros</p>
                            </div>
                            <Switch id="bulk_multi_adv" checked={adConfig.enable_multi_advertiser} onCheckedChange={(checked) => setAdConfig({ ...adConfig, enable_multi_advertiser: checked })} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // ── Step 3: Review ──
    const renderStep3 = () => {
        const previewCampaigns = buildPreview();
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Megaphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p className="text-3xl font-bold">{totalCampaigns}</p>
                            <p className="text-sm text-muted-foreground">Campanhas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Layers className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p className="text-3xl font-bold">{totalSets}</p>
                            <p className="text-sm text-muted-foreground">Conjuntos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <FileImage className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p className="text-3xl font-bold">{totalAds}</p>
                            <p className="text-sm text-muted-foreground">Anúncios</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Estrutura</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm font-mono">
                            {selectedAccounts.map((accId) => {
                                const acc = adAccounts?.find((a) => a.id === accId);
                                return (
                                    <div key={accId}>
                                        <p className="font-semibold text-muted-foreground">🏢 {acc?.account_name || accId}</p>
                                        {previewCampaigns.map((c, ci) => (
                                            <div key={ci} className="ml-4">
                                                <p>📂 {c.name} <Badge variant="outline" className="text-xs ml-1">{CAMPAIGN_OBJECTIVES.find((o) => o.value === c.objective)?.label}</Badge></p>
                                                {c.ad_sets.map((as_item, asi) => (
                                                    <div key={asi} className="ml-4">
                                                        <p>📁 {as_item.name}</p>
                                                        {as_item.ads.map((ad, adi) => (
                                                            <p key={adi} className="ml-4 text-muted-foreground">📄 {ad.name}</p>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Button className="w-full" size="lg" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando e enviando ao n8n...</>
                    ) : (
                        <><Send className="w-4 h-4 mr-2" />Criar Tudo ({totalCampaigns + totalSets + totalAds} itens)</>
                    )}
                </Button>

                {submitMutation.isSuccess && (
                    <div className="flex items-center gap-2 text-green-600 justify-center">
                        <CheckCircle2 className="w-5 h-5" /><span>Criado e enviado com sucesso!</span>
                    </div>
                )}
                {submitMutation.isError && (
                    <div className="flex items-center gap-2 text-red-500 justify-center">
                        <XCircle className="w-5 h-5" /><span>Erro ao criar. Tente novamente.</span>
                    </div>
                )}
            </div>
        );
    };

    const renderCurrentStep = () => {
        switch (step) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Criação em Massa</h1>
                <p className="text-muted-foreground">Crie campanhas, conjuntos e anúncios em um único disparo</p>
            </div>

            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <button
                            onClick={() => i < step && setStep(i)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center ${i === step ? "bg-primary text-primary-foreground"
                                : i < step ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs">
                                {i < step ? "✓" : i + 1}
                            </span>
                            {label}
                        </button>
                        {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                ))}
            </div>

            {renderCurrentStep()}

            {step < 3 && (
                <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
                        <ArrowLeft className="w-4 h-4 mr-2" />Voltar
                    </Button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {totalCampaigns} campanhas · {totalSets} conjuntos · {totalAds} anúncios
                        </span>
                        <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
                            Próximo<ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
