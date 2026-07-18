export interface WorkingHoursTimeRange {
  /** Wall-clock time in HH:mm format. */
  startTime: string;
  /** Wall-clock time in HH:mm format. */
  endTime: string;
}

/** One recurring weekday schedule for one business-owned scheduling resource. */
export interface WorkingHours {
  id: string;
  businessId: string;
  resourceId: string;
  /** Calendar weekday: 0 = Sunday, 1 = Monday, through 6 = Saturday. */
  dayOfWeek: number;
  enabled: boolean;
  /** Multiple non-overlapping ranges support split shifts and breaks. */
  timeRanges: WorkingHoursTimeRange[];
}

export type CreateWorkingHoursInput = Omit<WorkingHours, 'id' | 'businessId'>;
export type UpdateWorkingHoursInput = Partial<Pick<WorkingHours, 'enabled' | 'timeRanges'>>;

export interface WorkingHoursFilters {
  resourceId?: string;
  enabled?: boolean;
}
