import type { EntryFormData } from '../types';
import { REJECTION_REASONS } from './seedData';
import { rejectionExceedsThreshold } from './calculations';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEntry(form: EntryFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!form.date) errors.push({ field: 'date', message: 'Date is required' });
  if (!form.shift) errors.push({ field: 'shift', message: 'Select a shift' });
  if (!form.hourSlot) errors.push({ field: 'hourSlot', message: 'Select an hour slot' });
  if (!form.machineId) errors.push({ field: 'machineId', message: 'Select a machine' });
  if (!form.partNumber) errors.push({ field: 'partNumber', message: 'Select a part number' });

  const planned = parseInt(form.plannedQty, 10);
  const produced = parseInt(form.producedQty, 10);
  const rejected = parseInt(form.rejectedQty, 10);
  const downtime = parseInt(form.downtimeMinutes, 10);

  // Planned quantity
  if (form.plannedQty === '') {
    errors.push({ field: 'plannedQty', message: 'Planned quantity is required' });
  } else if (!Number.isInteger(planned) || planned < 0) {
    errors.push({ field: 'plannedQty', message: 'Must be a non-negative whole number' });
  }

  // Produced quantity
  if (form.producedQty === '') {
    errors.push({ field: 'producedQty', message: 'Produced quantity is required' });
  } else if (!Number.isInteger(produced) || produced < 0) {
    errors.push({ field: 'producedQty', message: 'Must be a non-negative whole number' });
  }

  // Rejected quantity
  if (form.rejectedQty === '') {
    errors.push({ field: 'rejectedQty', message: 'Rejected quantity is required' });
  } else if (!Number.isInteger(rejected) || rejected < 0) {
    errors.push({ field: 'rejectedQty', message: 'Must be a non-negative whole number' });
  } else if (!isNaN(produced) && rejected > produced) {
    errors.push({ field: 'rejectedQty', message: 'Cannot exceed produced quantity' });
  }

  // Rejection reason required when rejected > 0
  if (!isNaN(rejected) && rejected > 0) {
    if (!form.rejectionReason) {
      errors.push({ field: 'rejectionReason', message: 'Rejection reason is required when rejected > 0' });
    } else if (!REJECTION_REASONS.includes(form.rejectionReason as typeof REJECTION_REASONS[number])) {
      errors.push({ field: 'rejectionReason', message: 'Invalid rejection reason' });
    }
  }

  // Downtime minutes
  if (form.downtimeMinutes === '') {
    errors.push({ field: 'downtimeMinutes', message: 'Downtime minutes is required' });
  } else if (!Number.isInteger(downtime) || downtime < 0) {
    errors.push({ field: 'downtimeMinutes', message: 'Must be a non-negative whole number' });
  } else if (downtime > 60) {
    errors.push({ field: 'downtimeMinutes', message: 'Cannot exceed 60 minutes' });
  }

  // Downtime reason required when downtime > 0
  if (!isNaN(downtime) && downtime > 0 && !form.downtimeReason.trim()) {
    errors.push({ field: 'downtimeReason', message: 'Downtime reason is required when downtime > 0' });
  }

  // Mandatory remark when rejection % > 10% (strictly greater)
  if (!isNaN(produced) && !isNaN(rejected) && produced > 0 &&
      rejectionExceedsThreshold(produced, rejected) && !form.remarks.trim()) {
    errors.push({ field: 'remarks', message: 'Remark is required when rejection exceeds 10%' });
  }

  return errors;
}

export function generateEntryId(machineId: string, date: string, shift: string, hourSlot: string): string {
  // Deterministic ID for uniqueness constraint
  const slotKey = hourSlot.replace(/[:\u2013–]/g, '');
  return `${machineId}_${date}_${shift}_${slotKey}`;
}
