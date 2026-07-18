export type SchedulingResourceType = 'staff' | 'room' | 'equipment';

export const SCHEDULING_RESOURCE_TYPES = ['staff', 'room', 'equipment'] as const;

export interface SchedulingResource {
  id: string;
  businessId: string;
  name: string;
  type: SchedulingResourceType;
  description?: string;
  color?: string;
  active: boolean;
  metadata: Record<string, unknown>;
}

export type CreateSchedulingResourceInput = Omit<SchedulingResource, 'id' | 'businessId'>;

export type UpdateSchedulingResourceInput = Partial<CreateSchedulingResourceInput>;

export interface SchedulingResourceFilters {
  active?: boolean;
  type?: SchedulingResourceType;
}
