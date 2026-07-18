export interface WorkingHours {
  resourceId: string;
  /** Calendar weekday: 0 = Sunday, 1 = Monday, through 6 = Saturday. */
  dayOfWeek: number;
  enabled: boolean;
  /** Wall-clock time in HH:mm format. */
  startTime: string;
  /** Wall-clock time in HH:mm format. */
  endTime: string;
}
