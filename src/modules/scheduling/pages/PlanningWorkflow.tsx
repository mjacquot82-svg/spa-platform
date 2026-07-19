import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApplicationServices } from '../../../app/useApplicationServices';
import type { AppointmentSuggestion, AvailabilityException, PlanningPeriod, WorkingHours } from '../types';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PlanningWorkflow() {
  const { businessId, planningPeriods, workingHours, availabilityExceptions: exceptions, scheduling, resources, catalogItems } = useApplicationServices();
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [selected, setSelected] = useState<PlanningPeriod | null>(null);
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [periodExceptions, setPeriodExceptions] = useState<AvailabilityException[]>([]);
  const [preview, setPreview] = useState<AppointmentSuggestion[]>([]);
  const [notice, setNotice] = useState('');
  const [exceptionType, setExceptionType] = useState<'vacation' | 'special'>('vacation');
  const [exceptionDate, setExceptionDate] = useState('2026-09-08');
  const [providerId, setProviderId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');

  const refresh = useCallback(async () => {
    const [nextPeriods, nextResources, nextCatalogItems] = await Promise.all([planningPeriods.listPeriods(businessId), resources.listResources(businessId, { active: true }), catalogItems.list(businessId, { type: 'Service', active: true })]);
    const nextProviderId = providerId || nextResources[0]?.id || '';
    if (!providerId && nextProviderId) setProviderId(nextProviderId);
    if (!catalogItemId && nextCatalogItems[0]) setCatalogItemId(nextCatalogItems[0].id);
    const nextHours = nextProviderId ? await workingHours.listWorkingHoursForResource(businessId, nextProviderId) : [];
    setPeriods(nextPeriods); setHours(nextHours);
    setSelected((current) => current ? nextPeriods.find((item) => item.id === current.id) ?? null : null);
  }, [businessId, catalogItemId, catalogItems, planningPeriods, providerId, resources, workingHours]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!selected || !providerId || !catalogItemId) { setPeriodExceptions([]); setPreview([]); return; }
    const start = `${selected.year}-${String(selected.month).padStart(2, '0')}-01T00:00:00Z`;
    setExceptionDate(start.slice(0, 10));
    const end = new Date(Date.UTC(selected.year, selected.month, 1)).toISOString();
    void Promise.all([
      exceptions.listExceptions(businessId, { endsAfter: start, startsBefore: end, active: true }),
      scheduling.findNextAvailableAppointments({ businessId, catalogItemId, preferredResourceId: providerId, preferredDate: start.slice(0, 10), numberOfSuggestions: 3 }),
    ]).then(([nextExceptions, suggestions]) => { setPeriodExceptions(nextExceptions); setPreview(suggestions.filter((item) => item.start.slice(0, 7) === start.slice(0, 7))); });
  }, [businessId, catalogItemId, exceptions, providerId, scheduling, selected]);

  const groups = useMemo(() => ({ current: periods.slice(0, 1), next: periods.slice(1, 2), future: periods.slice(2) }), [periods]);
  const publish = async () => { if (!selected) return; const updated = await planningPeriods.publishPeriod(businessId, selected.year, selected.month); setSelected(updated); setNotice(`${monthName(updated)} is now bookable.`); await refresh(); };
  const toggleDay = async (item: WorkingHours) => { await workingHours.updateWorkingHours(businessId, item.id, { enabled: !item.enabled }); setHours(await workingHours.listWorkingHoursForResource(businessId, providerId)); };
  const updateTime = async (item: WorkingHours, field: 'startTime' | 'endTime', value: string) => { const range = item.timeRanges[0] ?? { startTime: '09:00', endTime: '17:00' }; await workingHours.updateWorkingHours(businessId, item.id, { timeRanges: [{ ...range, [field]: value }] }); setHours(await workingHours.listWorkingHoursForResource(businessId, providerId)); };
  const addException = async () => {
    const special = exceptionType === 'special';
    await exceptions.createException(businessId, { resourceId: providerId, start: `${exceptionDate}T${special ? '10:00' : '00:00'}:00Z`, end: `${exceptionDate}T${special ? '15:00' : '23:59'}:00Z`, type: special ? 'available' : 'unavailable', title: special ? 'Special opening hours' : 'Vacation', reason: special ? 'Additional bookable hours' : 'Practitioner vacation', metadata: {}, active: true });
    setNotice(special ? 'Special opening hours added.' : 'Vacation added.');
    if (selected) { const start = `${selected.year}-${String(selected.month).padStart(2, '0')}-01T00:00:00Z`; const end = new Date(Date.UTC(selected.year, selected.month, 1)).toISOString(); setPeriodExceptions(await exceptions.listExceptions(businessId, { endsAfter: start, startsBefore: end, active: true })); }
  };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Availability planning</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Plan future schedules</h1><p className="mt-2 max-w-2xl text-slate-600">Prepare Michelle’s availability before customers can book it. Publishing is the final step.</p></header>
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{notice}</p>}
    <section className="grid gap-5 lg:grid-cols-3"><MonthGroup title="Current month" periods={groups.current} selected={selected} onSelect={setSelected} /><MonthGroup title="Next month" periods={groups.next} selected={selected} onSelect={setSelected} /><MonthGroup title="Future months" periods={groups.future} selected={selected} onSelect={setSelected} /></section>
    {selected && <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
      <div className="space-y-6"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Planning mode</p><h2 className="mt-1 text-2xl font-semibold">{monthName(selected)}</h2><p className="mt-1 text-sm text-slate-500">Changes remain hidden from Booking until this month is published.</p></div><Status status={selected.status} /></div><div className="mt-6 space-y-2">{hours.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[8rem_5rem_1fr] sm:items-center"><span className="font-medium">{weekdays[item.dayOfWeek]}</span><button type="button" onClick={() => void toggleDay(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.enabled ? 'Available' : 'Off'}</button><div className="flex items-center gap-2"><input type="time" disabled={!item.enabled} value={item.timeRanges[0]?.startTime ?? '09:00'} onChange={(event) => void updateTime(item, 'startTime', event.target.value)} className="min-w-0 rounded-lg border border-slate-200 px-2" /><span>to</span><input type="time" disabled={!item.enabled} value={item.timeRanges[0]?.endTime ?? '17:00'} onChange={(event) => void updateTime(item, 'endTime', event.target.value)} className="min-w-0 rounded-lg border border-slate-200 px-2" /></div></div>)}</div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold">Vacations and special hours</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={exceptionType} onChange={(event) => setExceptionType(event.target.value as 'vacation' | 'special')} className="rounded-lg border border-slate-300 px-3"><option value="vacation">Vacation</option><option value="special">Special opening hours</option></select><input type="date" min={`${selected.year}-${String(selected.month).padStart(2, '0')}-01`} max={new Date(Date.UTC(selected.year, selected.month, 0)).toISOString().slice(0, 10)} value={exceptionDate} onChange={(event) => setExceptionDate(event.target.value)} className="rounded-lg border border-slate-300 px-3" /><button type="button" onClick={() => void addException()} className="rounded-lg bg-jds-700 px-4 py-2.5 text-sm font-semibold text-white">Add</button></div><div className="mt-4 space-y-2">{periodExceptions.map((item) => <div key={item.id} className={`rounded-xl border p-3 ${item.type === 'available' ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}`}><p className="font-medium">{item.title}</p><p className="text-sm text-slate-600">{new Date(item.start).toLocaleDateString()}</p></div>)}{!periodExceptions.length && <p className="text-sm text-slate-500">No exceptions planned for this month.</p>}</div></article></div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Booking status</h2><p className="mt-2 text-sm text-slate-600">{selected.status === 'published' ? 'Customers can book this month.' : selected.status === 'archived' ? 'This month is closed and cannot be republished.' : 'Customers cannot see availability in this month yet.'}</p><div className={`mt-4 rounded-xl p-4 ${preview.length ? 'bg-emerald-50' : 'bg-slate-100'}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Booking preview</p>{preview.length ? <><p className="mt-2 font-semibold text-emerald-800">Appointments available</p><p className="text-sm text-emerald-700">First opening: {preview[0].friendlyDate} at {preview[0].friendlyTime}</p></> : <p className="mt-2 font-semibold text-slate-600">Hidden from Booking</p>}</div>{selected.status === 'draft' && <button type="button" onClick={() => void publish()} className="mt-5 w-full rounded-lg bg-jds-700 px-4 py-3 font-semibold text-white shadow-sm hover:bg-jds-950">Publish schedule</button>}</aside>
    </section>}
  </div></main>;
}


function MonthGroup({ title, periods, selected, onSelect }: { title: string; periods: PlanningPeriod[]; selected: PlanningPeriod | null; onSelect: (period: PlanningPeriod) => void }) { return <section><h2 className="mb-2 text-sm font-semibold text-slate-500">{title}</h2><div className="space-y-2">{periods.map((period) => <button key={period.id} type="button" onClick={() => onSelect(period)} className={`flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left shadow-sm hover:border-jds-700 ${selected?.id === period.id ? 'border-jds-700 ring-2 ring-jds-700/10' : 'border-slate-200'}`}><span className="font-semibold">{monthName(period)}</span><Status status={period.status} /></button>)}</div></section>; }
function Status({ status }: { status: PlanningPeriod['status'] }) { const style = { draft: 'bg-amber-50 text-amber-700', published: 'bg-emerald-50 text-emerald-700', archived: 'bg-slate-100 text-slate-500' }; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${style[status]}`}>{status}</span>; }
function monthName(period: Pick<PlanningPeriod, 'year' | 'month'>): string { return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(period.year, period.month - 1, 1))); }
