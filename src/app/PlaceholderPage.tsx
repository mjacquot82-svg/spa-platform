import { PageContainer, PageHeader } from '../core/layouts';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <PageContainer><PageHeader title={title} description={description} /><section className="grid min-h-72 place-items-center rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-[var(--jds-shadow-sm)]"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-jds-100 text-jds-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5"><path d="M12 3v18M3 12h18" /></svg></span><h2 className="mt-4 font-semibold text-slate-900">Nothing here yet</h2><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">This workspace is ready for your business information.</p></div></section></PageContainer>;
}
