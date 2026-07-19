import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

const searchItems = [
  { id: 'appointment-ava', type: 'Appointment', title: 'Ava Morgan', detail: 'Signature Massage · 9:00 AM · 555-0101', terms: 'ava morgan 555-0101 ava@example.test appointment signature massage', to: '/dashboard?appointment=appointment-ava' },
  { id: 'appointment-noah', type: 'Appointment', title: 'Noah Williams', detail: 'Restorative Facial · 11:00 AM · 555-0102', terms: 'noah williams 555-0102 noah@example.test appointment restorative facial', to: '/dashboard?appointment=appointment-noah' },
  { id: 'appointment-mia', type: 'Appointment', title: 'Mia Thompson', detail: 'Wellness Ritual · 2:00 PM · 555-0103', terms: 'mia thompson 555-0103 mia@example.test appointment wellness ritual', to: '/dashboard?appointment=appointment-mia' },
  { id: 'customer-ava', type: 'Customer', title: 'Ava Morgan', detail: '555-0101 · ava@example.test', terms: 'ava morgan 555-0101 ava@example.test customer', to: '/customers?customer=customer-ava' },
  { id: 'customer-noah', type: 'Customer', title: 'Noah Williams', detail: '555-0102 · noah@example.test', terms: 'noah williams 555-0102 noah@example.test customer', to: '/customers?customer=customer-noah' },
  { id: 'customer-mia', type: 'Customer', title: 'Mia Thompson', detail: '555-0103 · mia@example.test', terms: 'mia thompson 555-0103 mia@example.test customer', to: '/customers?customer=customer-mia' },
];

export function TopBar({ breadcrumbs, onOpenMobile }: { breadcrumbs: BreadcrumbItem[]; onOpenMobile: () => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const results = query.trim() ? searchItems.filter((item) => item.terms.includes(query.trim().toLowerCase())).slice(0, 6) : [];
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!searchRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const select = (to: string) => { setQuery(''); setOpen(false); navigate(to); };
  return (
    <header className="sticky top-0 z-30 flex min-h-[4.5rem] flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2 backdrop-blur-xl sm:flex-nowrap sm:px-6">
      <button type="button" onClick={onOpenMobile} className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden" aria-label="Open navigation">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div className="hidden min-w-0 flex-1 xl:block"><Breadcrumbs items={breadcrumbs} /></div>
      <div ref={searchRef} className="relative order-last w-full sm:order-none sm:w-[min(28rem,45vw)]">
        <label className="sr-only" htmlFor="global-search">Search customers and appointments</label>
        <input id="global-search" type="search" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Search name, phone, email or treatment…" autoComplete="off" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:bg-white" />
        {open && query.trim() && <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" role="listbox">
          {results.map((item) => <button key={item.id} type="button" onClick={() => select(item.to)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-jds-100" role="option"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-jds-700">{item.title.split(' ').map((word) => word[0]).join('')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span><span className="block truncate text-xs text-slate-500">{item.detail}</span></span><span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{item.type}</span></button>)}
          {results.length === 0 && <p className="px-4 py-5 text-center text-sm text-slate-500">No matching appointments or customers</p>}
        </div>}
      </div>
      <button type="button" className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 sm:flex" aria-label="Choose business"><span className="grid size-5 place-items-center rounded bg-jds-100 text-[0.625rem] font-bold text-jds-700">J</span>JDS Business <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" className="size-3.5 text-slate-400"><path d="m6 8 4 4 4-4" /></svg></button>
      <button type="button" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100" aria-label="Open user menu">
        <span className="grid size-8 place-items-center rounded-full bg-jds-100 text-xs font-bold text-jds-700 ring-1 ring-jds-700/10">JD</span>
        <span className="hidden text-left text-sm md:block"><span className="block font-medium leading-tight text-slate-800">Jamie Davis</span><span className="block text-[0.6875rem] text-slate-500">Receptionist</span></span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" className="hidden size-3.5 text-slate-400 md:block"><path d="m6 8 4 4 4-4" /></svg>
      </button>
    </header>
  );
}
