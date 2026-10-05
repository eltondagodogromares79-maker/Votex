import React from "react";

interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description?: string;
  action?: React.ReactNode;
}

export default function AdminEmptyState({ icon, heading, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="w-12 h-12 text-border mb-4">{icon}</div>}
      {!icon && (
        <div className="w-12 h-12 bg-slate flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        </div>
      )}
      <p className="font-serif font-semibold text-charcoal text-h3 mb-1">{heading}</p>
      {description && <p className="text-small text-muted max-w-xs leading-relaxed mb-4">{description}</p>}
      {action}
    </div>
  );
}
