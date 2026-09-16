export type Role = 'operator' | 'supervisor' | 'manager';
export type Shift = 'A' | 'B' | 'C';
export type EntryStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface StatusTransition {
  status: EntryStatus;
  actor: string;
  actorName: string;
  timestamp: Date;
  remark?: string;
}

export interface ProductionEntry {
  id: string; // doc ID: machineId_date_shift_hourSlot
  machineId: string;
  date: string; // YYYY-MM-DD
  shift: Shift;
  hourSlot: string;
  partNumber: string;
  operatorId: string;
  operatorName: string;
  plannedQty: number;
  producedQty: number;
  rejectedQty: number;
  rejectionReason: string | null;
  downtimeMinutes: number;
  downtimeReason: string | null;
  remarks: string | null;

  // Calculated
  acceptedQty: number;
  rejectionPct: number;
  achievementPct: number | null; // null when planned is 0
  runningTime: number;

  // State machine
  status: EntryStatus;
  statusHistory: StatusTransition[];

  createdAt: Date;
  updatedAt: Date;

  // Client-side sync tracking (not stored in Firestore)
  _hasPendingWrites?: boolean;
}

export interface EntryFormData {
  date: string;
  shift: Shift | '';
  hourSlot: string;
  machineId: string;
  partNumber: string;
  plannedQty: string; // strings for form input, parsed on submit
  producedQty: string;
  rejectedQty: string;
  rejectionReason: string;
  downtimeMinutes: string;
  downtimeReason: string;
  remarks: string;
}

export const EMPTY_FORM: EntryFormData = {
  date: new Date().toISOString().split('T')[0],
  shift: '',
  hourSlot: '',
  machineId: '',
  partNumber: '',
  plannedQty: '',
  producedQty: '',
  rejectedQty: '',
  rejectionReason: '',
  downtimeMinutes: '',
  downtimeReason: '',
  remarks: '',
};
