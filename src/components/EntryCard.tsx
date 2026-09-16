import type { ProductionEntry, AppUser } from '../types';
import { StatusBadge } from './StatusBadge';
import { SyncIndicator } from './SyncIndicator';

interface Props {
  entry: ProductionEntry;
  user: AppUser;
  onEdit?: (entry: ProductionEntry) => void;
  onSubmit?: (entry: ProductionEntry) => void;
  onApprove?: (entry: ProductionEntry) => void;
  onReturn?: (entry: ProductionEntry) => void;
}

export function EntryCard({ entry, user, onEdit, onSubmit, onApprove, onReturn }: Props) {
  const canEdit = user.role === 'operator' &&
    entry.operatorId === user.uid &&
    (entry.status === 'draft' || entry.status === 'returned');

  const canSubmit = user.role === 'operator' &&
    entry.operatorId === user.uid &&
    (entry.status === 'draft' || entry.status === 'returned');

  const canApprove = user.role === 'supervisor' && entry.status === 'submitted';

  return (
    <article className="docket" data-status={entry.status}>
      {/* ─── Title Block / Docket Header ─── */}
      <header className="docket-header">
        <div className="docket-machine-id mono">
          {entry.machineId}
        </div>

        <div className="docket-meta-block">
          <div className="docket-meta-cell">
            <span className="docket-meta-label">Date</span>
            <span className="docket-meta-val">{entry.date}</span>
          </div>
          <div className="docket-meta-cell">
            <span className="docket-meta-label">Shift</span>
            <span className="docket-meta-val">{entry.shift}</span>
          </div>
          <div className="docket-meta-cell">
            <span className="docket-meta-label">Hour Slot</span>
            <span className="docket-meta-val">{entry.hourSlot}</span>
          </div>
          {user.role === 'operator' && (
            <div className="docket-meta-cell">
              <span className="docket-meta-label">Data Sync</span>
              <SyncIndicator hasPendingWrites={entry._hasPendingWrites ?? false} />
            </div>
          )}
        </div>

        <div className="docket-stamp-slot">
          <StatusBadge status={entry.status} />
        </div>
      </header>

      {/* ─── Production Data Matrix ─── */}
      <div className="docket-matrix">
        <div className="matrix-cell">
          <span className="cell-label">Part</span>
          <span className="cell-value">{entry.partNumber}</span>
        </div>
        <div className="matrix-cell">
          <span className="cell-label">Operator</span>
          <span className="cell-value">{entry.operatorName}</span>
        </div>
        <div className="matrix-cell">
          <span className="cell-label">Planned</span>
          <span className="cell-value">{entry.plannedQty}</span>
        </div>
        <div className="matrix-cell">
          <span className="cell-label">Produced</span>
          <span className="cell-value">{entry.producedQty}</span>
        </div>
        <div className="matrix-cell matrix-cell--highlight">
          <span className="cell-label">Accepted</span>
          <span className="cell-value">{entry.acceptedQty}</span>
        </div>

        <div className="matrix-cell">
          <span className="cell-label">Rejected</span>
          <span className="cell-value">{entry.rejectedQty}</span>
        </div>
        <div className="matrix-cell matrix-cell--highlight">
          <span className="cell-label">Rejection %</span>
          <span className={`cell-value ${entry.rejectionPct > 10 ? 'cell-value--warning' : ''}`}>
            {entry.rejectionPct}%
          </span>
        </div>
        <div className="matrix-cell matrix-cell--highlight">
          <span className="cell-label">Achievement</span>
          <span className="cell-value">
            {entry.achievementPct !== null ? `${entry.achievementPct}%` : '—'}
          </span>
        </div>
        <div className="matrix-cell">
          <span className="cell-label">Downtime</span>
          <span className="cell-value">{entry.downtimeMinutes}m</span>
        </div>
        <div className="matrix-cell matrix-cell--highlight">
          <span className="cell-label">Running</span>
          <span className="cell-value">{entry.runningTime}m</span>
        </div>
      </div>

      {/* ─── Reasons & Operational Details ─── */}
      {(entry.rejectionReason || entry.downtimeReason || entry.remarks || (entry.status === 'returned' && entry.statusHistory.length > 0)) && (
        <div className="docket-details">
          {entry.rejectionReason && (
            <div className="detail-row">
              <span className="detail-row-label">Rejection reason</span>
              <span className="detail-row-content">{entry.rejectionReason}</span>
            </div>
          )}
          {entry.downtimeReason && (
            <div className="detail-row">
              <span className="detail-row-label">Downtime reason</span>
              <span className="detail-row-content">{entry.downtimeReason}</span>
            </div>
          )}
          {entry.remarks && (
            <div className="detail-row">
              <span className="detail-row-label">Remarks</span>
              <span className="detail-row-content">{entry.remarks}</span>
            </div>
          )}

          {/* Supervisor return note */}
          {entry.status === 'returned' && entry.statusHistory.length > 0 && (() => {
            const lastReturn = [...entry.statusHistory].reverse().find(h => h.status === 'returned');
            return lastReturn?.remark ? (
              <div className="supervisor-note-box">
                <div className="supervisor-note-title">Supervisor Inspection Note</div>
                <div className="supervisor-note-body">{lastReturn.remark}</div>
                <div className="supervisor-note-meta">— {lastReturn.actorName}</div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ─── Actions Strip ─── */}
      {(canEdit || canSubmit || canApprove) && (
        <footer className="docket-actions">
          {canEdit && onEdit && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(entry)}>
              Edit Docket
            </button>
          )}
          {canSubmit && onSubmit && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onSubmit(entry)}>
              Submit for Approval
            </button>
          )}
          {canApprove && onApprove && (
            <button type="button" className="btn btn-approve btn-sm" onClick={() => onApprove(entry)}>
              Approve
            </button>
          )}
          {canApprove && onReturn && (
            <button type="button" className="btn btn-return btn-sm" onClick={() => onReturn(entry)}>
              Return Docket
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
