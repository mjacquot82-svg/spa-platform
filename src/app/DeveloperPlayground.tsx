import { useMemo } from 'react';

import { demoPages, type DemoPageRegistration } from '../core/routing';

export function DeveloperPlayground() {
  const demosByModule = useMemo(() => groupByModule(demoPages), []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">
          Developer playground
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950 sm:text-4xl">
          JDS module demos
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Open isolated module demos without application authentication or Supabase configuration.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {[...demosByModule.entries()].map(([moduleName, demos]) => (
          <section key={moduleName} aria-labelledby={`module-${slugify(moduleName)}`}>
            <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
              <h2 id={`module-${slugify(moduleName)}`} className="text-xl font-semibold text-jds-950">
                {moduleName}
              </h2>
              <span className="text-sm text-slate-500">
                {demos.length} {demos.length === 1 ? 'demo' : 'demos'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {demos.map((demo) => (
                <a
                  key={demo.path}
                  href={demo.path}
                  className="group rounded-2xl border border-jds-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-jds-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jds-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-jds-950 group-hover:text-jds-700">
                      {demo.title}
                    </h3>
                    <span aria-hidden="true" className="text-jds-600 transition group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{demo.description}</p>
                  <code className="mt-4 block text-xs text-slate-500">{demo.path}</code>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function groupByModule(
  demos: readonly DemoPageRegistration[],
): Map<string, DemoPageRegistration[]> {
  const groups = new Map<string, DemoPageRegistration[]>();
  for (const demo of demos) {
    const group = groups.get(demo.module) ?? [];
    group.push(demo);
    groups.set(demo.module, group);
  }
  return groups;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default DeveloperPlayground;
