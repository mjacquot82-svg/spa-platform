export type SchedulingResourceType = 'staff' | 'room' | 'equipment';

export interface SchedulingResource {
  id: string;
  businessId: string;
  name: string;
  type: SchedulingResourceType;
  active: boolean;
}
