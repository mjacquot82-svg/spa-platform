import { NavLink } from 'react-router-dom';

import type { NavigationEntry, NavigationIcon } from './navigation';

interface NavigationItemProps extends NavigationEntry {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavigationItem({ label, to, icon, collapsed = false, onNavigate }: NavigationItemProps) {
  return (
    <NavLink to={to} onClick={onNavigate} title={collapsed ? label : undefined}
      className={({ isActive }) => `group relative flex min-h-10 items-center rounded-lg px-3 py-2 text-[0.875rem] font-medium ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-jds-100 text-jds-950 shadow-[inset_0_0_0_1px_rgb(49_92_73/0.06)]' : 'text-slate-500 hover:bg-slate-100/80 hover:text-jds-950'}`}>
      <NavigationIconGlyph name={icon} />
      {!collapsed && <span>{label}</span>}
      {collapsed && <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-jds-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus-visible:block">{label}</span>}
    </NavLink>
  );
}

function NavigationIconGlyph({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    appointments: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    booking: <><path d="M12 6v12M6 12h12" /><circle cx="12" cy="12" r="9" /></>,
    customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    catalog: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    reports: <><path d="M3 3v18h18" /><path d="M7 16l4-5 4 3 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.38.3.72.6 1 .28.25.64.4 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6.6z" /></>,
    developer: <><path d="M16 18l6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[1.125rem] shrink-0">{paths[name]}</svg>;
}
