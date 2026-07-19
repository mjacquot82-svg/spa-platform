import type { FormService } from '../../forms';
import type { AppointmentService } from '../../scheduling';
import { AppointmentFormAssignmentValidationError, DuplicateAppointmentFormAssignmentError, type AppointmentFormAssignment, type AppointmentFormAssignmentFilters, type CreateAppointmentFormAssignmentInput } from '../types';
import type { AppointmentFormAssignmentRepository } from './appointment-form-assignment.repository';
import { validateAppointmentFormAssignment } from './appointment-form-assignment.validation';

export class AppointmentFormAssignmentService {
  constructor(
    private readonly repository: AppointmentFormAssignmentRepository,
    private readonly appointmentService: AppointmentService,
    private readonly formService: FormService,
  ) {}

  async assignForm(businessId: string, input: CreateAppointmentFormAssignmentInput): Promise<AppointmentFormAssignment> {
    const result = validateAppointmentFormAssignment(input);
    if (!result.valid) throw new AppointmentFormAssignmentValidationError(result.issues);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const appointmentId = requireId(input.appointmentId, 'appointmentId');
    const formId = requireId(input.formId, 'formId');
    const [appointment, form, duplicates] = await Promise.all([
      this.appointmentService.getAppointment(scopedBusinessId, appointmentId),
      this.formService.getForm(scopedBusinessId, formId),
      this.repository.list(scopedBusinessId, { appointmentId, formId }),
    ]);
    if (!appointment) throw new Error('Appointment not found.');
    if (!form) throw new Error('Form not found.');
    if (!form.published || form.archived) throw new Error('Only published, active forms can be assigned.');
    if (duplicates.length) throw new DuplicateAppointmentFormAssignmentError();
    return this.repository.create(scopedBusinessId, { appointmentId, formId });
  }

  listAssignments(businessId: string, filters?: AppointmentFormAssignmentFilters): Promise<AppointmentFormAssignment[]> {
    return this.repository.list(requireId(businessId, 'businessId'), filters);
  }

  listForAppointment(businessId: string, appointmentId: string): Promise<AppointmentFormAssignment[]> {
    return this.listAssignments(businessId, { appointmentId: requireId(appointmentId, 'appointmentId') });
  }

  getAssignment(businessId: string, id: string): Promise<AppointmentFormAssignment | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  expireAssignment(businessId: string, id: string): Promise<AppointmentFormAssignment> {
    return this.repository.updateStatus(requireId(businessId, 'businessId'), requireId(id, 'id'), 'expired', null);
  }
}

function requireId(value: string, field: string): string { if (!value.trim()) throw new TypeError(`${field} is required.`); return value.trim(); }
