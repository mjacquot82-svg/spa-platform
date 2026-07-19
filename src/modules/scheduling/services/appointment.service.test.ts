import { describe, expect, it } from 'vitest';

import type { Appointment, CreateAppointmentInput, WorkingHours } from '../types';
import { AppointmentConflictError } from '../types';
import { findAvailableSlotsForDay } from './availability.service';
import { InMemoryAppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';

const businessId = 'business-1';

function input(overrides: Partial<CreateAppointmentInput> = {}): CreateAppointmentInput {
  return {
    customerId: 'customer-1', catalogItemId: 'service-1', resourceIds: ['staff-1'],
    start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z', status: 'confirmed',
    notes: '', metadata: {}, active: true, ...overrides,
  };
}

function seeded(id: string, overrides: Partial<Appointment> = {}): Appointment {
  return { id, businessId, ...input(), ...overrides };
}

describe('AppointmentService conflicts', () => {
  it('rejects appointment overlap for a shared resource', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([seeded('existing')]));
    await expect(service.createAppointment(businessId, input({
      start: '2026-07-20T09:30:00Z', end: '2026-07-20T10:30:00Z',
    }))).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('detects a conflict when any one of multiple resources is shared', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([
      seeded('existing', { resourceIds: ['staff-1', 'room-1'] }),
    ]));
    await expect(service.createAppointment(businessId, input({
      resourceIds: ['equipment-1', 'room-1'],
    }))).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('allows overlapping appointments when resources do not overlap', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([seeded('existing')]));
    await expect(service.createAppointment(businessId, input({ resourceIds: ['room-1'] })))
      .resolves.toMatchObject({ resourceIds: ['room-1'] });
  });

  it('ignores cancelled and no-show appointments', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([
      seeded('cancelled', { status: 'cancelled' }),
      seeded('no-show', { status: 'no_show' }),
    ]));
    await expect(service.createAppointment(businessId, input())).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('allows back-to-back appointments', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([seeded('existing')]));
    await expect(service.createAppointment(businessId, input({
      start: '2026-07-20T10:00:00Z', end: '2026-07-20T11:00:00Z',
    }))).resolves.toMatchObject({ start: '2026-07-20T10:00:00Z' });
  });

  it('allows a customer to have multiple non-conflicting appointments', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository());
    await service.createAppointment(businessId, input());
    await service.createAppointment(businessId, input({
      resourceIds: ['room-1'], start: '2026-07-20T11:00:00Z', end: '2026-07-20T12:00:00Z',
    }));
    expect(await service.listAppointmentsForCustomer(businessId, 'customer-1')).toHaveLength(2);
  });
});

describe('appointment availability integration', () => {
  it('shrinks available slots after appointment creation', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository());
    const hours: WorkingHours[] = [{
      id: 'hours', businessId, resourceId: 'staff-1', dayOfWeek: 1, enabled: true,
      timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
    }];
    const calculate = (appointments: Appointment[]) => findAvailableSlotsForDay({
      date: '2026-07-20', businessId, resourceId: 'staff-1', requestedDurationMinutes: 30,
      slotIncrementMinutes: 30, workingHours: hours, availabilityExceptions: [],
      existingAppointments: appointments,
    });
    expect(calculate([])).toHaveLength(6);
    await service.createAppointment(businessId, input());
    expect(calculate(await service.listAppointments(businessId))).toHaveLength(4);
  });
});

describe('AppointmentService check-in', () => {
  it('checks in an active confirmed appointment', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([seeded('confirmed')]));
    await expect(service.checkInAppointment(businessId, 'confirmed')).resolves.toMatchObject({ status: 'checked_in' });
  });

  it('rejects check-in for non-confirmed appointments', async () => {
    const service = new AppointmentService(new InMemoryAppointmentRepository([seeded('cancelled', { status: 'cancelled' })]));
    await expect(service.checkInAppointment(businessId, 'cancelled')).rejects.toThrow('Only active, confirmed appointments can be checked in.');
  });
});
