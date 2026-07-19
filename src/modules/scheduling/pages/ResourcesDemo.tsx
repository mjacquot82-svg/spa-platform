import { useMemo } from 'react';

import { useSchedulingResources } from '../hooks';
import {
  InMemorySchedulingResourceRepository,
  SchedulingResourceService,
} from '../services';
import {
  SCHEDULING_RESOURCE_TYPES,
  type SchedulingResource,
  type SchedulingResourceType,
} from '../types';

const demoBusinessId = 'demo-business';

const sampleResources: SchedulingResource[] = [
  { id: 'staff-avery', businessId: demoBusinessId, name: 'Avery Chen', type: 'staff', description: 'Massage therapist', color: '#315c49', active: true, metadata: { specialties: ['Swedish massage'] } },
  { id: 'staff-jordan', businessId: demoBusinessId, name: 'Jordan Lee', type: 'staff', description: 'Esthetician', color: '#4f7664', active: true, metadata: { specialties: ['Facials'] } },
  { id: 'room-serenity', businessId: demoBusinessId, name: 'Serenity Room', type: 'room', description: 'Quiet treatment room', color: '#715a9a', active: true, metadata: { floor: 1 } },
  { id: 'room-garden', businessId: demoBusinessId, name: 'Garden Suite', type: 'room', description: 'Couples treatment suite', color: '#9a5a69', active: true, metadata: { capacity: 2 } },
  { id: 'equipment-led', businessId: demoBusinessId, name: 'LED Therapy Panel', type: 'equipment', description: 'Portable light therapy unit', color: '#876923', active: true, metadata: { assetTag: 'LED-01' } },
  { id: 'equipment-sauna', businessId: demoBusinessId, name: 'Infrared Sauna', type: 'equipment', active: false, metadata: { assetTag: 'SAUNA-01' } },
];

const resourceService = new SchedulingResourceService(
  new InMemorySchedulingResourceRepository(sampleResources),
);

const headings: Record<SchedulingResourceType, string> = {
  staff: 'Staff',
  room: 'Rooms',
  equipment: 'Equipment',
};

export function ResourcesDemo() {
  const { data: resources, loading, error } = useSchedulingResources(
    resourceService,
    demoBusinessId,
  );
  const grouped = useMemo(() => Object.fromEntries(
    SCHEDULING_RESOURCE_TYPES.map((type) => [
      type,
      resources.filter((resource) => resource.type === type),
    ]),
  ) as Record<SchedulingResourceType, SchedulingResource[]>, [resources]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">
          Appointment resources
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950">
          Resources by type
        </h1>
        <p className="mt-3 text-slate-600">
          Reusable staff, rooms, and equipment scoped to one example business.
        </p>
      </header>

      {loading && <p className="mt-8 text-sm text-slate-600" role="status">Loading resources…</p>}
      {error && <p className="mt-8 text-sm text-red-700" role="alert">{error.message}</p>}

      {!loading && !error && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {SCHEDULING_RESOURCE_TYPES.map((type) => (
            <section key={type} className="rounded-2xl border border-jds-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-jds-950">{headings[type]}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {grouped[type].length}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {grouped[type].map((resource) => (
                  <li key={resource.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 size-3 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: resource.color ?? '#94a3b8' }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-slate-900">{resource.name}</h3>
                          {!resource.active && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Archived</span>
                          )}
                        </div>
                        {resource.description && <p className="mt-1 text-sm text-slate-600">{resource.description}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

export default ResourcesDemo;
