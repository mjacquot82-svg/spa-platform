import { NavigationItem } from './NavigationItem';
import type { NavigationGroup } from './navigation';

interface NavigationSectionProps extends NavigationGroup {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavigationSection({ label, items, collapsed = false, onNavigate }: NavigationSectionProps) {
  return (
    <section className="space-y-1">
      {label && !collapsed && <h2 className="px-3 pb-1 pt-2 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</h2>}
      {label && collapsed && <div className="mx-3 my-3 border-t border-slate-200" />}
      {items.map((item) => <NavigationItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />)}
    </section>
  );
}
