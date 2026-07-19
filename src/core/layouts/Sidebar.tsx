import { applicationNavigation } from './navigation';
import { NavigationSection } from './NavigationSection';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: SidebarProps) {
  const content = (mobile = false) => (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-xl">
      <div className={`flex h-[4.5rem] items-center border-b border-slate-200/80 px-4 ${collapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-jds-950 text-sm font-bold text-white shadow-sm ring-1 ring-black/5">J</span>
        {(!collapsed || mobile) && <div className="min-w-0"><p className="truncate font-semibold tracking-tight text-jds-950">JDS Spa</p><p className="truncate text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-slate-400">Front desk</p></div>}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Primary navigation">
        {applicationNavigation.map((group, index) => <NavigationSection key={group.label ?? index} {...group} collapsed={collapsed && !mobile} onNavigate={mobile ? onCloseMobile : undefined} />)}
      </nav>
      {!mobile && <button type="button" onClick={onToggleCollapsed} className={`m-3 flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 ${collapsed ? 'justify-center' : 'gap-2'}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`size-4 ${collapsed ? 'rotate-180' : ''}`}><path d="m15 18-6-6 6-6" /></svg>{!collapsed && 'Collapse'}</button>}
    </div>
  );

  return <>
    <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/80 lg:block ${collapsed ? 'w-[4.75rem]' : 'w-64'}`}>{content()}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onCloseMobile} aria-label="Close navigation" /><aside className="relative h-full w-72 max-w-[85vw] shadow-2xl">{content(true)}</aside></div>}
  </>;
}
