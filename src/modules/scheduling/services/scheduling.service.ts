import {
  findAvailableSlotsForDay,
  hasAppointmentConflict,
  hasUnavailableException,
  intervalsOverlap,
  isWithinWorkingHours,
} from './availability.service';
import type { CatalogItemService } from '../../catalog';
import type { AppointmentSuggestion, FindNextAvailableAppointmentsInput, SchedulingResource } from '../types';
import type { AppointmentService } from './appointment.service';
import type { AvailabilityExceptionService } from './availability-exception.service';
import type { SchedulingResourceService } from './resource.service';
import type { WorkingHoursService } from './working-hours.service';
import type { PlanningPeriodService } from './planning-period.service';

const DEFAULT_SUGGESTIONS = 10;
const MAX_SEARCH_DAYS = 366;

/** Coordinates existing scheduling data and owns all multi-day appointment searching. */
export class SchedulingService {
  constructor(
    private readonly catalogItems: CatalogItemService,
    private readonly resources: SchedulingResourceService,
    private readonly workingHours: WorkingHoursService,
    private readonly exceptions: AvailabilityExceptionService,
    private readonly appointments: AppointmentService,
    private readonly planningPeriods: PlanningPeriodService,
  ) {}

  async findNextAvailableAppointments({
    businessId,
    catalogItemId,
    preferredResourceId,
    preferredDate,
    numberOfSuggestions = DEFAULT_SUGGESTIONS,
  }: FindNextAvailableAppointmentsInput): Promise<AppointmentSuggestion[]> {
    const scopedBusinessId = requireValue(businessId, 'businessId');
    const scopedCatalogItemId = requireValue(catalogItemId, 'catalogItemId');
    const requestedCount = Number.isInteger(numberOfSuggestions) && numberOfSuggestions > 0
      ? numberOfSuggestions
      : DEFAULT_SUGGESTIONS;
    const item = await this.catalogItems.getById(scopedBusinessId, scopedCatalogItemId);
    if (!item || !item.active || item.type !== 'Service' || !item.durationMinutes) {
      throw new Error('This treatment cannot be scheduled.');
    }
    const requiredTypes = item.resourceTypesRequired?.length ? item.resourceTypesRequired : ['staff'];
    const allResources = await this.resources.listResources(scopedBusinessId, { active: true });
    const eligible = allResources.filter((resource) => requiredTypes.includes(resource.type));
    const searchedResources = preferredResourceId
      ? eligible.filter((resource) => resource.id === preferredResourceId)
      : eligible;
    if (preferredResourceId && searchedResources.length === 0) throw new Error('The preferred provider is not eligible for this treatment.');
    if (searchedResources.length === 0) return [];

    const searchStart = normalizeDate(preferredDate ?? new Date().toISOString().slice(0, 10));
    const [hours, exceptions, appointments, publishedPeriods] = await Promise.all([
      this.workingHours.listWorkingHours(scopedBusinessId, { enabled: true }),
      this.exceptions.listExceptions(scopedBusinessId, { active: true }),
      this.appointments.listAppointments(scopedBusinessId, { active: true }),
      this.planningPeriods.listPeriods(scopedBusinessId, { status: 'published' }),
    ]);
    const bookableMonths = new Set(publishedPeriods.map((period) => `${period.year}-${String(period.month).padStart(2, '0')}`));
    const bufferBefore = item.bufferBeforeMinutes ?? 0;
    const bufferAfter = item.bufferAfterMinutes ?? 0;
    const occupiedDuration = bufferBefore + item.durationMinutes + bufferAfter;
    const candidates: AppointmentSuggestion[] = [];

    for (let dayOffset = 0; dayOffset < MAX_SEARCH_DAYS && candidates.length < requestedCount * 3; dayOffset += 1) {
      const date = addDays(searchStart, dayOffset);
      if (!bookableMonths.has(date.slice(0, 7))) continue;
      for (const resource of searchedResources) {
        const slots = findAvailableSlotsForDay({
          date,
          businessId: scopedBusinessId,
          resourceId: resource.id,
          requestedDurationMinutes: occupiedDuration,
          slotIncrementMinutes: 30,
          workingHours: hours,
          existingAppointments: appointments,
          availabilityExceptions: exceptions,
        });
        for (const slot of slots) {
          const start = new Date(Date.parse(slot.start) + bufferBefore * 60_000).toISOString();
          if (date === new Date().toISOString().slice(0, 10) && Date.parse(start) <= Date.now()) continue;
          const end = new Date(Date.parse(start) + item.durationMinutes * 60_000).toISOString();
          candidates.push(makeSuggestion(resource, start, end, item.durationMinutes, searchStart, Boolean(preferredResourceId)));
        }
      }
    }
    return candidates.sort((left, right) => left.start.localeCompare(right.start) || left.resource.name.localeCompare(right.resource.name))
      .slice(0, requestedCount)
      .map((suggestion, index) => index === 0 && !preferredResourceId ? { ...suggestion, reason: 'Earliest Available' } : suggestion);
  }
}

function makeSuggestion(resource: SchedulingResource, start: string, end: string, duration: number, searchStart: string, preferred: boolean): AppointmentSuggestion {
  const hour = new Date(start).getUTCHours();
  return {
    resource, start, end, duration,
    dayLabel: dayLabel(start, searchStart),
    friendlyDate: new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(start)),
    friendlyTime: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(start)),
    reason: preferred ? 'Preferred Provider' : hour < 12 ? 'Morning' : 'Afternoon',
  };
}

function dayLabel(value: string, searchStart: string): string {
  const difference = Math.round((Date.parse(value.slice(0, 10)) - Date.parse(searchStart)) / 86_400_000);
  if (difference === 0) return 'Today';
  if (difference === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(value));
}

function normalizeDate(value: string): string {
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) throw new TypeError('preferredDate must be a valid date.');
  return date;
}

function addDays(date: string, days: number): string { return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10); }
function requireValue(value: string, field: string): string { if (!value.trim()) throw new TypeError(`${field} is required.`); return value.trim(); }

/** Thin, persistence-free JDS scheduling facade. */
export const schedulingService = {
  intervalsOverlap,
  isWithinWorkingHours,
  hasAppointmentConflict,
  hasUnavailableException,
  findAvailableSlotsForDay,
};
