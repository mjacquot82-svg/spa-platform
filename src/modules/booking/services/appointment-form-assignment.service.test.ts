import { describe, expect, it } from 'vitest';

import { FormService, InMemoryFormRepository, type Form } from '../../forms';
import { AppointmentService, InMemoryAppointmentRepository, type Appointment } from '../../scheduling';
import { DuplicateAppointmentFormAssignmentError } from '../types';
import { InMemoryAppointmentFormAssignmentRepository } from './appointment-form-assignment.repository';
import { AppointmentFormAssignmentService } from './appointment-form-assignment.service';

const businessId = 'business-1';
const appointment: Appointment = { id: 'appointment-1', businessId, customerId: 'customer-1', catalogItemId: 'service-1', resourceIds: ['staff-1'], start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z', status: 'confirmed', notes: '', metadata: {}, active: true };
const form: Form = { id: 'form-1', businessId, name: 'Intake', description: '', version: 1, published: true, archived: false, metadata: {}, fields: [] };

function createService(forms = [form]) {
  const appointments = new AppointmentService(new InMemoryAppointmentRepository([appointment]));
  const formService = new FormService(new InMemoryFormRepository(forms));
  return new AppointmentFormAssignmentService(new InMemoryAppointmentFormAssignmentRepository(), appointments, formService);
}

describe('AppointmentFormAssignmentService', () => {
  it('assigns a published form to an existing appointment as pending', async () => {
    const service = createService();
    const assignment = await service.assignForm(businessId, { appointmentId: appointment.id, formId: form.id });
    expect(assignment).toMatchObject({ businessId, appointmentId: appointment.id, formId: form.id, status: 'pending', completedAt: null });
    expect(await service.listForAppointment(businessId, appointment.id)).toHaveLength(1);
  });

  it('rejects duplicate assignments', async () => {
    const service = createService();
    await service.assignForm(businessId, { appointmentId: appointment.id, formId: form.id });
    await expect(service.assignForm(businessId, { appointmentId: appointment.id, formId: form.id })).rejects.toBeInstanceOf(DuplicateAppointmentFormAssignmentError);
  });

  it('rejects unpublished or archived forms', async () => {
    const service = createService([{ ...form, published: false }]);
    await expect(service.assignForm(businessId, { appointmentId: appointment.id, formId: form.id })).rejects.toThrow('Only published, active forms can be assigned.');
  });

  it('preserves business boundaries through existing services', async () => {
    const service = createService();
    await expect(service.assignForm('business-2', { appointmentId: appointment.id, formId: form.id })).rejects.toThrow('Appointment not found.');
  });
});
