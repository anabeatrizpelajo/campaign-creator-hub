import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Megaphone,
  Layers,
  FileImage,
  Settings,
  Zap,
  Copy,
  Rocket,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Business Managers", url: "/business-managers", icon: Building2 },
  { title: "Contas de Anúncio", url: "/ad-accounts", icon: CreditCard },
  { title: "Campanhas", url: "/campaigns", icon: Megaphone },
  { title: "Conjuntos de Anúncios", url: "/ad-sets", icon: Layers },
  { title: "Anúncios", url: "/ads", icon: FileImage },
  { title: "Criação em Massa", url: "/bulk", icon: Rocket },
  { title: "Templates", url: "/templates", icon: Copy },
];

const automationItems = [
  { title: "Automações", url: "/automations", icon: Zap },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();

  const userEmail = user?.email || "";
  const userInitials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : "??";
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0] || "Usuário";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-primary-foreground text-sm">
              Ads Manager
            </h1>
            <p className="text-xs text-sidebar-muted">Automação</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider mb-2">
            Gerenciamento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider mb-2">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {automationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-muted truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sair"
            className="shrink-0 h-8 w-8 text-sidebar-muted hover:text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
