interface StatusBadgeProps {
  status: "active" | "paused" | "error" | "pending";
  label?: string;
}

const statusConfig = {
  active: { className: "status-badge status-active", defaultLabel: "Ativo" },
  paused: { className: "status-badge status-paused", defaultLabel: "Pausado" },
  error: { className: "status-badge status-error", defaultLabel: "Erro" },
  pending: { className: "status-badge bg-muted text-muted-foreground", defaultLabel: "Pendente" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={config.className}>
      {label || config.defaultLabel}
    </span>
  );
}
