import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-semibold tracking-[-0.025em] text-jds-950 sm:text-[1.875rem]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</header>;
}
