interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusConfig: Record<string, { className: string; defaultLabel: string }> = {
  active: { className: "status-badge status-active", defaultLabel: "Ativo" },
  inactive: { className: "status-badge status-inactive", defaultLabel: "Inativo" },
  paused: { className: "status-badge status-paused", defaultLabel: "Pausado" },
  error: { className: "status-badge status-error", defaultLabel: "Erro" },
  pending: { className: "status-badge bg-muted text-muted-foreground", defaultLabel: "Pendente" },
};

const fallbackConfig = { className: "status-badge bg-muted text-muted-foreground", defaultLabel: "" };

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status?.toLowerCase()] || fallbackConfig;
  return (
    <span className={config.className}>
      {label || config.defaultLabel || status}
    </span>
  );
}
