import type { Shift } from '../types';

export const MACHINES = [
  'PPW-CNC-01',
  'PPW-CNC-02',
  'PPW-VMC-03',
  'PPW-LATHE-04',
  'PPW-GRIND-05',
] as const;

export const PARTS = [
  'PN-4471-A',
  'PN-4471-B',
  'PN-8802',
  'PN-9130-X',
  'PN-2256',
] as const;

export const REJECTION_REASONS = [
  'Dimensional',
  'Surface finish',
  'Burr',
  'Material defect',
  'Setup error',
  'Other',
] as const;

export const SHIFTS: Record<Shift, { label: string; hours: string[] }> = {
  A: {
    label: 'A (06:00–14:00)',
    hours: [
      '06:00–07:00', '07:00–08:00', '08:00–09:00', '09:00–10:00',
      '10:00–11:00', '11:00–12:00', '12:00–13:00', '13:00–14:00',
    ],
  },
  B: {
    label: 'B (14:00–22:00)',
    hours: [
      '14:00–15:00', '15:00–16:00', '16:00–17:00', '17:00–18:00',
      '18:00–19:00', '19:00–20:00', '20:00–21:00', '21:00–22:00',
    ],
  },
  C: {
    label: 'C (22:00–06:00)',
    hours: [
      '22:00–23:00', '23:00–00:00', '00:00–01:00', '01:00–02:00',
      '02:00–03:00', '03:00–04:00', '04:00–05:00', '05:00–06:00',
    ],
  },
};

export const SEEDED_USERS = [
  { email: 'operator1@ppw.local', password: 'operator123', displayName: 'Ravi Kumar', role: 'operator' as const },
  { email: 'operator2@ppw.local', password: 'operator123', displayName: 'Priya Sharma', role: 'operator' as const },
  { email: 'supervisor1@ppw.local', password: 'super123', displayName: 'Anand Raj', role: 'supervisor' as const },
  { email: 'supervisor2@ppw.local', password: 'super123', displayName: 'Meena Devi', role: 'supervisor' as const },
  { email: 'manager1@ppw.local', password: 'manager123', displayName: 'Vikram Singh', role: 'manager' as const },
  { email: 'manager2@ppw.local', password: 'manager123', displayName: 'Lakshmi Iyer', role: 'manager' as const },
];
