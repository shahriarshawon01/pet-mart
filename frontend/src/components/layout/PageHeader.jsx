import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';

export function PageHeader({ title, subtitle, breadcrumbs, action, className = '' }) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
export default PageHeader;

