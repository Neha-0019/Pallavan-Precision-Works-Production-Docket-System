import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { EntryCard } from './EntryCard';
import type { ProductionEntry } from '../types';

export function EntryList() {
  const { user } = useAuth();
  const { entries, loading, submitEntry, approveEntry, returnEntry } = useEntries(user);
  const navigate = useNavigate();
  const [returnModal, setReturnModal] = useState<ProductionEntry | null>(null);
  const [returnRemark, setReturnRemark] = useState('');
  const [returnError, setReturnError] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!user) return null;
  if (loading) return <div className="loading-screen">Reading production dockets…</div>;

  const filtered = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus);

  async function handleSubmit(entry: ProductionEntry) {
    setActionError(null);
    try {
      await submitEntry(entry, user!);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  }

  async function handleApprove(entry: ProductionEntry) {
    setActionError(null);
    try {
      await approveEntry(entry, user!);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  }

  function openReturnModal(entry: ProductionEntry) {
    setReturnModal(entry);
    setReturnRemark('');
    setReturnError('');
  }

  async function handleReturn() {
    if (!returnModal || !user) return;
    if (!returnRemark.trim()) {
      setReturnError('A remark is required when returning an entry.');
      return;
    }
    try {
      await returnEntry(returnModal, user, returnRemark.trim());
      setReturnModal(null);
    } catch (err: unknown) {
      setReturnError((err as Error).message);
    }
  }

  return (
    <div className="dockets-view">
      {/* ─── List Control Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>
            {user.role === 'operator' ? 'Shift Production Dockets' :
             user.role === 'supervisor' ? 'Shop-Floor Review Queue' : 'Plant Production Dockets'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--steel)', fontFamily: 'var(--font-mono)' }}>
            {user.role === 'operator' ? `Operator: ${user.displayName}` : `Station: Plant Floor Inspection`}
          </span>
        </div>
        {user.role === 'operator' && (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/new')}>
            + New Production Entry
          </button>
        )}
      </div>

      {/* ─── Filing System Underline Tabs ─── */}
      <nav className="filing-tabs" aria-label="Filing status filters">
        {['all', 'draft', 'submitted', 'approved', 'returned'].map(s => {
          const count = s === 'all' ? entries.length : entries.filter(e => e.status === s).length;
          return (
            <button
              key={s}
              type="button"
              className={`filing-tab ${filterStatus === s ? 'filing-tab--active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              <span>{s === 'all' ? 'All Dockets' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
              <span className="filing-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {actionError && <div className="error-banner">{actionError}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {user.role === 'operator'
            ? 'No dockets on file for this filter. Create a new entry to log production.'
            : 'No production dockets pending review in this status tab.'}
        </div>
      ) : (
        <div className="dockets-stack">
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              user={user}
              onEdit={user.role === 'operator' ? (e) => navigate(`/edit/${e.id}`) : undefined}
              onSubmit={user.role === 'operator' ? handleSubmit : undefined}
              onApprove={user.role === 'supervisor' ? handleApprove : undefined}
              onReturn={user.role === 'supervisor' ? openReturnModal : undefined}
            />
          ))}
        </div>
      )}

      {/* ─── Return Modal (Supervisor Return Action) ─── */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal-docket" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Return Production Docket</h3>
              <span className="stamp stamp--returned">RETURN NOTICE</span>
            </header>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>
                Returning docket for machine <strong className="mono">{returnModal.machineId}</strong> ({returnModal.hourSlot}) to operator <strong>{returnModal.operatorName}</strong> for rectification.
              </p>
              <div className="form-field">
                <label htmlFor="return-remark">
                  <span>Inspection Remark</span>
                  <span className="field-mark-req">* Required</span>
                </label>
                <textarea
                  id="return-remark"
                  value={returnRemark}
                  onChange={e => { setReturnRemark(e.target.value); setReturnError(''); }}
                  rows={3}
                  placeholder="Specify discrepancy or rectification needed (e.g. verify rejection reason or recheck scrap count)..."
                  autoFocus
                />
                {returnError && <span className="field-error-msg">{returnError}</span>}
              </div>
            </div>
            <footer className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setReturnModal(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-return" onClick={handleReturn}>
                Confirm Return
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
