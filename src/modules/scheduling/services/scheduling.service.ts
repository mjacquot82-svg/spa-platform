import {
  findAvailableSlotsForDay,
  hasAppointmentConflict,
  hasUnavailableException,
  intervalsOverlap,
  isWithinWorkingHours,
} from './availability.service';

/** Thin, persistence-free JDS scheduling facade. */
export const schedulingService = {
  intervalsOverlap,
  isWithinWorkingHours,
  hasAppointmentConflict,
  hasUnavailableException,
  findAvailableSlotsForDay,
};
