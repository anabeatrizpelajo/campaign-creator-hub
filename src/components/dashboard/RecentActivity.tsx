import { Clock } from "lucide-react";

interface Activity {
  id: string;
  action: string;
  target: string;
  time: string;
  status: "success" | "pending" | "error";
}

const activities: Activity[] = [
  { id: "1", action: "Campanha criada", target: "Black Friday 2024", time: "5 min atrás", status: "success" },
  { id: "2", action: "Conjunto de anúncios ativado", target: "Público Lookalike", time: "15 min atrás", status: "success" },
  { id: "3", action: "Anúncio pausado", target: "Carrossel Produtos", time: "1h atrás", status: "pending" },
  { id: "4", action: "Erro na sincronização", target: "BM Principal", time: "2h atrás", status: "error" },
  { id: "5", action: "Nova conta conectada", target: "Conta Empresa XYZ", time: "3h atrás", status: "success" },
];

export function RecentActivity() {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Atividade Recente</h3>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              activity.status === "success" ? "bg-success" :
              activity.status === "pending" ? "bg-warning" : "bg-destructive"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.action}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.target}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
