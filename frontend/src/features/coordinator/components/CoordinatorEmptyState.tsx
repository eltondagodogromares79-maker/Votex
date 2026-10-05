interface CoordinatorEmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description?: string;
  action?: React.ReactNode;
}

export default function CoordinatorEmptyState({ icon, heading, description, action }: CoordinatorEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface border border-border">
      {icon && (
        <div className="w-14 h-14 bg-navy/6 flex items-center justify-center text-navy/40 mb-5">{icon}</div>
      )}
      <p className="font-serif font-bold text-charcoal text-h3 mb-2">{heading}</p>
      {description && <p className="text-small text-muted leading-relaxed max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
