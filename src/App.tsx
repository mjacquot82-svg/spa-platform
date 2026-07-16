import { AuthProvider, useAuth } from './core/auth';
import { BusinessService } from './core/business';
import { supabase } from './core/database';
import { CatalogItemService } from './modules/catalog';

const modules = [
  { name: 'Authentication', implementation: AuthProvider },
  { name: 'Business', implementation: BusinessService },
  { name: 'Catalog', implementation: CatalogItemService },
] as const;

function PlatformStatus() {
  const { loading, user } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-jds-100 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">
          JDS Platform
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-jds-950">
          Application foundation is ready.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          React, Vite, TypeScript, Tailwind CSS, and Supabase are configured.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {modules.map(({ name, implementation }) => (
            <div className="rounded-xl bg-jds-100 p-4" key={name}>
              <p className="font-medium text-jds-950">{name}</p>
              <p className="mt-1 text-sm text-jds-700">
                {implementation.name} loaded
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-500" role="status">
          Authentication: {loading ? 'hydrating session…' : user ? 'session active' : 'ready'}
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider supabase={supabase}>
      <PlatformStatus />
    </AuthProvider>
  );
}
