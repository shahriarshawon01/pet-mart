import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionTo,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="p-4 bg-zinc-100 rounded-full mb-4 text-muted">
          <Icon size={36} />
        </div>
      )}
      <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {(action || actionTo) && (
        <Button
          as={actionTo ? 'link' : undefined}
          to={actionTo}
          onClick={action}
          variant="primary"
          size="md"
        >
          {actionLabel || 'Go Back'}
        </Button>
      )}
    </div>
  );
}
