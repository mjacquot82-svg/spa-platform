import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm font-medium text-slate-400">
        {items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" className="size-3"><path d="m6 3 5 5-5 5" /></svg>}
          {item.to ? <Link to={item.to} className="hover:text-jds-700">{item.label}</Link> : <span aria-current="page" className="text-slate-700">{item.label}</span>}
        </li>)}
      </ol>
    </nav>
  );
}
