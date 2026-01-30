import { Save, Key, Link, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Configurações" 
        description="Configure as integrações e preferências da plataforma"
      />

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link className="w-4 h-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Meta API</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="app-id">App ID</Label>
                <Input id="app-id" placeholder="Seu App ID do Facebook" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="app-secret">App Secret</Label>
                <Input id="app-secret" type="password" placeholder="••••••••••••••••" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="access-token">Access Token</Label>
                <Input id="access-token" type="password" placeholder="••••••••••••••••" className="mt-1" />
              </div>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">n8n Webhook</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="n8n-url">URL do n8n</Label>
                <Input id="n8n-url" placeholder="https://seu-n8n.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <Input id="webhook-secret" type="password" placeholder="••••••••••••••••" className="mt-1" />
              </div>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Integrações Ativas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Meta Business Suite</p>
                  <p className="text-sm text-muted-foreground">Gerenciamento de campanhas e anúncios</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">n8n Automation</p>
                  <p className="text-sm text-muted-foreground">Workflows automatizados</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">Notificações e alertas</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Preferências de Notificação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Erro</p>
                  <p className="text-sm text-muted-foreground">Notificar quando houver erros em campanhas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatórios Diários</p>
                  <p className="text-sm text-muted-foreground">Receber resumo diário por email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automações Executadas</p>
                  <p className="text-sm text-muted-foreground">Notificar sobre execuções de automação</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Segurança</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessões Ativas</p>
                  <p className="text-sm text-muted-foreground">Gerenciar dispositivos conectados</p>
                </div>
                <Button variant="outline" size="sm">Gerenciar</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logs de Atividade</p>
                  <p className="text-sm text-muted-foreground">Visualizar histórico de ações</p>
                </div>
                <Button variant="outline" size="sm">Ver Logs</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
