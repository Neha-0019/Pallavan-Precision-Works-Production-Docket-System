import type { EntryStatus } from '../types';

const STATUS_CONFIG: Record<EntryStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'stamp--draft' },
  submitted: { label: 'Submitted', className: 'stamp--submitted' },
  approved: { label: 'Approved', className: 'stamp--approved' },
  returned: { label: 'Returned', className: 'stamp--returned' },
};

export function StatusBadge({ status }: { status: EntryStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`stamp ${config.className}`} data-status={status}>
      {config.label}
    </span>
  );
}
