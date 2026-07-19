export type NavigationIcon = 'dashboard' | 'calendar' | 'appointments' | 'booking' | 'customers' | 'catalog' | 'reports' | 'settings' | 'developer';

export interface NavigationEntry {
  label: string;
  to: string;
  icon: NavigationIcon;
}

export interface NavigationGroup {
  label?: string;
  items: NavigationEntry[];
}

export const applicationNavigation: NavigationGroup[] = [
  { items: [{ label: 'Dashboard', to: '/dashboard', icon: 'dashboard' }] },
  {
    label: 'Appointments',
    items: [
      { label: 'Schedule', to: '/calendar', icon: 'calendar' },
      { label: 'Resources', to: '/appointments', icon: 'appointments' },
      { label: 'New appointment', to: '/booking', icon: 'booking' },
    ],
  },
  {
    items: [
      { label: 'Customers', to: '/customers', icon: 'customers' },
      { label: 'Catalog', to: '/catalog', icon: 'catalog' },
      { label: 'Reports', to: '/reports', icon: 'reports' },
      { label: 'Settings', to: '/settings', icon: 'settings' },
    ],
  },
];

export function navigationLabel(pathname: string): string | undefined {
  return applicationNavigation.flatMap((group) => group.items).find((item) => item.to === pathname)?.label;
}
