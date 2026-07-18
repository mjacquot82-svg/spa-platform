import { lazy, Suspense } from 'react';

import { findDemoPage } from './core/routing';

const DeveloperPlayground = lazy(() => import('./app/DeveloperPlayground'));
const PlatformApp = lazy(() => import('./app/PlatformApp'));

const calendarDemoPath = '/calendar-demo';
const playgroundPath = '/playground';

function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <p className="text-sm text-slate-600" role="status">
        Loading…
      </p>
    </main>
  );
}

function SupabaseConfigurationRequired() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-amber-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Configuration required
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-jds-950">
          Supabase is not configured.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to use
          this part of the platform. The local calendar demo remains available at{' '}
          <a className="font-medium text-jds-700 underline" href={calendarDemoPath}>
            {calendarDemoPath}
          </a>
          .
        </p>
      </section>
    </main>
  );
}

export default function App() {
  if (import.meta.env.DEV && window.location.pathname === playgroundPath) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <DeveloperPlayground />
      </Suspense>
    );
  }

  const demo = findDemoPage(window.location.pathname);
  if (demo) {
    const DemoComponent = demo.component;
    return (
      <Suspense fallback={<LoadingScreen />}>
        <DemoComponent />
      </Suspense>
    );
  }

  const hasSupabaseConfiguration = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );

  if (!hasSupabaseConfiguration) {
    return <SupabaseConfigurationRequired />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <PlatformApp />
    </Suspense>
  );
}
