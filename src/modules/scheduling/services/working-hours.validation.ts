import type {
  CreateWorkingHoursInput,
  UpdateWorkingHoursInput,
  WorkingHoursTimeRange,
  WorkingHoursValidationIssue,
  WorkingHoursValidationResult,
} from '../types';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validateWorkingHours(
  input: CreateWorkingHoursInput | UpdateWorkingHoursInput,
  partial = false,
): WorkingHoursValidationResult {
  const issues: WorkingHoursValidationIssue[] = [];
  const has = (field: keyof CreateWorkingHoursInput) => !partial || field in input;

  if (has('resourceId') && (typeof (input as CreateWorkingHoursInput).resourceId !== 'string' || !(input as CreateWorkingHoursInput).resourceId.trim())) {
    issues.push({ field: 'resourceId', message: 'Required.' });
  }
  if (has('dayOfWeek')) {
    const day = (input as CreateWorkingHoursInput).dayOfWeek;
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      issues.push({ field: 'dayOfWeek', message: 'Must be an integer from 0 through 6.' });
    }
  }
  if (has('enabled') && typeof input.enabled !== 'boolean') {
    issues.push({ field: 'enabled', message: 'Must be a boolean.' });
  }
  if (has('timeRanges')) validateTimeRanges(input.timeRanges, issues);
  if (!partial && input.enabled === true && Array.isArray(input.timeRanges) && input.timeRanges.length === 0) {
    issues.push({ field: 'timeRanges', message: 'An enabled day requires at least one time range.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'workingHours', message: 'At least one field is required.' });
  }

  return issues.length ? { valid: false, issues } : { valid: true };
}

function validateTimeRanges(
  value: unknown,
  issues: WorkingHoursValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push({ field: 'timeRanges', message: 'Must be an array.' });
    return;
  }

  const validRanges: Array<WorkingHoursTimeRange & { start: number; end: number }> = [];
  value.forEach((range, index) => {
    if (!range || typeof range !== 'object' || Array.isArray(range)) {
      issues.push({ field: `timeRanges.${index}`, message: 'Must be a time range.' });
      return;
    }
    const candidate = range as WorkingHoursTimeRange;
    if (!TIME_PATTERN.test(candidate.startTime ?? '')) {
      issues.push({ field: `timeRanges.${index}.startTime`, message: 'Must use HH:mm format.' });
    }
    if (!TIME_PATTERN.test(candidate.endTime ?? '')) {
      issues.push({ field: `timeRanges.${index}.endTime`, message: 'Must use HH:mm format.' });
    }
    if (!TIME_PATTERN.test(candidate.startTime ?? '') || !TIME_PATTERN.test(candidate.endTime ?? '')) return;
    const start = toMinutes(candidate.startTime);
    const end = toMinutes(candidate.endTime);
    if (end <= start) {
      issues.push({ field: `timeRanges.${index}.endTime`, message: 'Must be after startTime.' });
      return;
    }
    validRanges.push({ ...candidate, start, end });
  });

  const sorted = validRanges.sort((left, right) => left.start - right.start);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].start < sorted[index - 1].end) {
      issues.push({ field: 'timeRanges', message: 'Time ranges must not overlap.' });
      break;
    }
  }
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
