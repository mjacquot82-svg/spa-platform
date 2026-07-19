import type { ApplicationSeed } from './application-composition';
import { createApplicationServices } from './application-composition';
import type { CatalogItem } from '../modules/catalog/types';
import type { SchedulingResource } from '../modules/scheduling/types';

export const demoBusinessId = 'demo-business';
const now = new Date().toISOString();
const resources: SchedulingResource[] = [
  { id: 'provider-michelle', businessId: demoBusinessId, name: 'Michelle', type: 'staff', active: true, color: '#315c49', metadata: {} },
  { id: 'provider-jordan', businessId: demoBusinessId, name: 'Jordan', type: 'staff', active: true, color: '#7c3aed', metadata: {} },
];
const catalogItems: CatalogItem[] = [
  treatment('treatment-planning', 'Signature Massage', 'Massage', 60),
  treatment('treatment-consultation', 'Express Consultation', 'Consultation', 30),
  treatment('treatment-facial', 'Restorative Facial', 'Skin Care', 45),
  treatment('treatment-ritual', 'Full Wellness Ritual', 'Wellness', 90, 15, 15),
];
const seed: ApplicationSeed = {
  catalogItems,
  customers: [
    { id: 'customer-ava', businessId: demoBusinessId, firstName: 'Ava', lastName: 'Morgan', email: 'ava@example.test', phone: '555-0101', address: { line1: '12 Cedar Way', country: 'US' }, notes: '', active: true, createdAt: now, updatedAt: now, deletedAt: null },
    { id: 'customer-noah', businessId: demoBusinessId, firstName: 'Noah', lastName: 'Williams', email: 'noah@example.test', phone: '555-0102', address: { line1: '8 Willow Road', country: 'US' }, notes: '', active: true, createdAt: now, updatedAt: now, deletedAt: null },
  ],
  resources,
  appointments: [
    { id: 'appointment-ava', businessId: demoBusinessId, customerId: 'customer-ava', catalogItemId: 'treatment-planning', resourceIds: ['provider-michelle'], start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z', status: 'confirmed', notes: '', metadata: { title: 'Signature Massage · Ava Morgan' }, active: true },
    { id: 'appointment-noah', businessId: demoBusinessId, customerId: 'customer-noah', catalogItemId: 'treatment-facial', resourceIds: ['provider-jordan'], start: '2026-07-20T11:00:00Z', end: '2026-07-20T11:45:00Z', status: 'confirmed', notes: '', metadata: { title: 'Restorative Facial · Noah Williams' }, active: true },
  ],
  workingHours: resources.flatMap((resource) => Array.from({ length: 7 }, (_, dayOfWeek) => ({ id: `${resource.id}-${dayOfWeek}`, businessId: demoBusinessId, resourceId: resource.id, dayOfWeek, enabled: dayOfWeek > 0 && dayOfWeek < 6, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] }))),
  planningPeriods: [
    { id: 'period-july', businessId: demoBusinessId, year: 2026, month: 7, status: 'published' },
    { id: 'period-august', businessId: demoBusinessId, year: 2026, month: 8, status: 'published' },
    { id: 'period-september', businessId: demoBusinessId, year: 2026, month: 9, status: 'draft' },
    { id: 'period-october', businessId: demoBusinessId, year: 2026, month: 10, status: 'archived' },
  ],
  forms: [
    { id: 'form-intake', businessId: demoBusinessId, name: 'Spa Intake Form', description: 'Health and contact intake.', version: 1, published: true, archived: false, metadata: {}, fields: [] },
    { id: 'form-consent', businessId: demoBusinessId, name: 'Treatment Consent', description: 'General treatment consent.', version: 1, published: true, archived: false, metadata: {}, fields: [] },
  ],
  appointmentForms: [
    { id: 'assignment-ava', businessId: demoBusinessId, appointmentId: 'appointment-ava', formId: 'form-intake', status: 'pending', assignedAt: now, completedAt: null },
  ],
};
export function createDemoApplication() { return createApplicationServices(demoBusinessId, seed); }
function treatment(id: string, name: string, category: string, durationMinutes: number, bufferBeforeMinutes = 0, bufferAfterMinutes = 0): CatalogItem { return { id, businessId: demoBusinessId, type: 'Service', name, description: '', category, image: null, active: true, durationMinutes, bufferBeforeMinutes, bufferAfterMinutes, resourceTypesRequired: ['staff'], createdAt: now, updatedAt: now, deletedAt: null }; }
