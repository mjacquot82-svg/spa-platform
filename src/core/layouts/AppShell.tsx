import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { navigationLabel } from './navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentLabel = navigationLabel(location.pathname) ?? titleFromPath(location.pathname);
  const breadcrumbs = location.pathname === '/dashboard'
    ? [{ label: 'Dashboard' }]
    : [{ label: 'Dashboard', to: '/dashboard' }, { label: currentLabel }];

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onToggleCollapsed={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar breadcrumbs={breadcrumbs} onOpenMobile={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}

function titleFromPath(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'Dashboard';
  return segment.split('-').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}
