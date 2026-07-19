export const APPOINTMENT_FORM_ASSIGNMENT_STATUSES = ['pending', 'completed', 'expired'] as const;
export type AppointmentFormAssignmentStatus = (typeof APPOINTMENT_FORM_ASSIGNMENT_STATUSES)[number];

export interface AppointmentFormAssignment {
  id: string;
  businessId: string;
  appointmentId: string;
  formId: string;
  status: AppointmentFormAssignmentStatus;
  assignedAt: string;
  completedAt: string | null;
}

export interface CreateAppointmentFormAssignmentInput {
  appointmentId: string;
  formId: string;
}

export interface AppointmentFormAssignmentFilters {
  appointmentId?: string;
  formId?: string;
  status?: AppointmentFormAssignmentStatus;
}
