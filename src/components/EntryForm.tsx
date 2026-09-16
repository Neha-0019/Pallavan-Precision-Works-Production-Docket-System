import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MACHINES, PARTS, REJECTION_REASONS, SHIFTS } from '../utils/seedData';
import { validateEntry } from '../utils/validation';
import * as calc from '../utils/calculations';
import type { EntryFormData, ProductionEntry, Shift } from '../types';
import { EMPTY_FORM } from '../types';

interface Props {
  existingEntry?: ProductionEntry;
  onSave: (form: EntryFormData, existingEntry?: ProductionEntry) => Promise<void>;
}

export function EntryForm({ existingEntry, onSave }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialForm: EntryFormData = existingEntry
    ? {
        date: existingEntry.date,
        shift: existingEntry.shift,
        hourSlot: existingEntry.hourSlot,
        machineId: existingEntry.machineId,
        partNumber: existingEntry.partNumber,
        plannedQty: String(existingEntry.plannedQty),
        producedQty: String(existingEntry.producedQty),
        rejectedQty: String(existingEntry.rejectedQty),
        rejectionReason: existingEntry.rejectionReason ?? '',
        downtimeMinutes: String(existingEntry.downtimeMinutes),
        downtimeReason: existingEntry.downtimeReason ?? '',
        remarks: existingEntry.remarks ?? '',
      }
    : EMPTY_FORM;

  const [form, setForm] = useState<EntryFormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateField(field: keyof EntryFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  // Live calculated quantities
  const produced = parseInt(form.producedQty, 10);
  const rejected = parseInt(form.rejectedQty, 10);
  const planned = parseInt(form.plannedQty, 10);
  const downtime = parseInt(form.downtimeMinutes, 10);

  const liveCalcs = useMemo(() => {
    const hasProduced = !isNaN(produced) && produced >= 0;
    const hasRejected = !isNaN(rejected) && rejected >= 0;
    const hasPlanned = !isNaN(planned) && planned >= 0;
    const hasDowntime = !isNaN(downtime) && downtime >= 0;

    const accepted = hasProduced && hasRejected ? calc.acceptedQty(produced, rejected) : null;
    const rejPct = hasProduced && hasRejected ? calc.rejectionPct(produced, rejected) : null;
    const achPct = hasPlanned && accepted !== null ? calc.achievementPct(planned, accepted) : null;
    const running = hasDowntime ? calc.runningTime(downtime) : null;

    return { accepted, rejPct, achPct, running };
  }, [produced, rejected, planned, downtime]);

  const hourSlots = form.shift ? SHIFTS[form.shift as Shift]?.hours ?? [] : [];
  const isEdit = !!existingEntry;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const validationErrors = validateEntry(form);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(err => { errorMap[err.field] = err.message; });
      setErrors(errorMap);
      return;
    }

    setSaving(true);
    try {
      await onSave(form, existingEntry);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to save production entry';
      if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
        setSaveError('This docket cannot be saved — it may have been submitted or locked by a supervisor, or permissions have changed.');
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-docket">
      {/* ─── Docket Header ─── */}
      <header className="form-docket-header">
        <div>
          <h2>{isEdit ? 'Edit Production Docket' : 'New Production Docket'}</h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--steel)', fontFamily: 'var(--font-mono)' }}>
            Plant Form PPW-PRD-01 · Pallavan Precision Works
          </span>
        </div>
        {isEdit && (
          <span className="stamp stamp--draft">DRAFT DOCKET</span>
        )}
      </header>

      <div className="form-docket-body">
        {saveError && <div className="error-banner">{saveError}</div>}

        {/* ─── Band 1: Slot & Machine Assignment ─── */}
        <section className="form-band">
          <div className="band-title">Shift & Station Assignment</div>
          <div className="form-grid-3">
            <div className="form-field">
              <label htmlFor="entry-date">
                <span>Date</span>
                <span className="field-mark-req">*</span>
              </label>
              <input
                id="entry-date"
                type="date"
                value={form.date}
                onChange={e => updateField('date', e.target.value)}
                disabled={isEdit}
              />
              {errors.date && <span className="field-error-msg">{errors.date}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="entry-shift">
                <span>Shift</span>
                <span className="field-mark-req">*</span>
              </label>
              <select
                id="entry-shift"
                value={form.shift}
                onChange={e => { updateField('shift', e.target.value); updateField('hourSlot', ''); }}
                disabled={isEdit}
              >
                <option value="">Select shift</option>
                {Object.entries(SHIFTS).map(([key, s]) => (
                  <option key={key} value={key}>{s.label}</option>
                ))}
              </select>
              {errors.shift && <span className="field-error-msg">{errors.shift}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="entry-hour">
                <span>Hour slot</span>
                <span className="field-mark-req">*</span>
              </label>
              <select
                id="entry-hour"
                value={form.hourSlot}
                onChange={e => updateField('hourSlot', e.target.value)}
                disabled={isEdit || !form.shift}
              >
                <option value="">Select hour slot</option>
                {hourSlots.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {errors.hourSlot && <span className="field-error-msg">{errors.hourSlot}</span>}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label htmlFor="entry-machine">
                <span>Machine ID</span>
                <span className="field-mark-req">*</span>
              </label>
              <select
                id="entry-machine"
                value={form.machineId}
                onChange={e => updateField('machineId', e.target.value)}
                disabled={isEdit}
              >
                <option value="">Select machine</option>
                {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.machineId && <span className="field-error-msg">{errors.machineId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="entry-part">
                <span>Part number</span>
                <span className="field-mark-req">*</span>
              </label>
              <select
                id="entry-part"
                value={form.partNumber}
                onChange={e => updateField('partNumber', e.target.value)}
              >
                <option value="">Select part number</option>
                {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.partNumber && <span className="field-error-msg">{errors.partNumber}</span>}
            </div>

            <div className="form-field">
              <label>
                <span>Logged operator</span>
              </label>
              <input
                type="text"
                value={user?.displayName ?? ''}
                disabled
              />
            </div>
          </div>
        </section>

        {/* ─── Band 2: Production Quantities ─── */}
        <section className="form-band">
          <div className="band-title">Production Counts</div>
          <div className="form-grid-3">
            <div className="form-field">
              <label htmlFor="entry-planned">
                <span>Planned quantity</span>
                <span className="field-mark-req">*</span>
              </label>
              <input
                id="entry-planned"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.plannedQty}
                onChange={e => updateField('plannedQty', e.target.value)}
                placeholder="0"
              />
              {errors.plannedQty && <span className="field-error-msg">{errors.plannedQty}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="entry-produced">
                <span>Produced quantity</span>
                <span className="field-mark-req">*</span>
              </label>
              <input
                id="entry-produced"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.producedQty}
                onChange={e => updateField('producedQty', e.target.value)}
                placeholder="0"
              />
              {errors.producedQty && <span className="field-error-msg">{errors.producedQty}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="entry-rejected">
                <span>Rejected quantity</span>
                <span className="field-mark-req">*</span>
              </label>
              <input
                id="entry-rejected"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.rejectedQty}
                onChange={e => updateField('rejectedQty', e.target.value)}
                placeholder="0"
              />
              {errors.rejectedQty && <span className="field-error-msg">{errors.rejectedQty}</span>}
            </div>
          </div>
        </section>

        {/* ─── Live Calculated Plate ─── */}
        <div className="calculated-plate">
          <div className="calculated-plate-header">
            <span className="calculated-plate-title">Shop Arithmetic Verification</span>
            <span className="calculated-tag">calculated</span>
          </div>
          <div className="calculated-grid">
            <div className="calculated-cell">
              <span className="calculated-label">Accepted pieces</span>
              <span className="calculated-val">
                {liveCalcs.accepted !== null ? liveCalcs.accepted : '—'}
              </span>
            </div>
            <div className="calculated-cell">
              <span className="calculated-label">Rejection rate</span>
              <span className={`calculated-val ${liveCalcs.rejPct !== null && liveCalcs.rejPct > 10 ? 'calculated-val--alert' : ''}`}>
                {liveCalcs.rejPct !== null ? `${liveCalcs.rejPct}%` : '—'}
              </span>
            </div>
            <div className="calculated-cell">
              <span className="calculated-label">Achievement</span>
              <span className="calculated-val">
                {liveCalcs.achPct !== null ? `${liveCalcs.achPct}%` : '—'}
              </span>
            </div>
            <div className="calculated-cell">
              <span className="calculated-label">Running time</span>
              <span className="calculated-val">
                {liveCalcs.running !== null ? `${liveCalcs.running}m` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Boundary-triggered inline amber caution note for Rejection > 10% */}
        {liveCalcs.rejPct !== null && liveCalcs.rejPct > 10 && (
          <div className="inline-caution-note">
            <span className="stack-light-dot stack-light-dot--amber" />
            <div>
              <strong>Rejection Threshold Exceeded ({liveCalcs.rejPct}%):</strong> Shop quality standard requires mandatory explanatory note in the Remarks field below.
            </div>
          </div>
        )}

        {/* ─── Band 3: Rejection & Downtime Details ─── */}
        <section className="form-band">
          <div className="band-title">Rejection & Downtime Analysis</div>

          {!isNaN(rejected) && rejected > 0 && (
            <div className="form-field">
              <label htmlFor="entry-rejection-reason">
                <span>Rejection reason</span>
                <span className="field-mark-req">* Required for rejected parts</span>
              </label>
              <select
                id="entry-rejection-reason"
                value={form.rejectionReason}
                onChange={e => updateField('rejectionReason', e.target.value)}
              >
                <option value="">Select primary rejection cause</option>
                {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.rejectionReason && <span className="field-error-msg">{errors.rejectionReason}</span>}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="entry-downtime">
                <span>Downtime minutes (0–60)</span>
                <span className="field-mark-req">*</span>
              </label>
              <input
                id="entry-downtime"
                type="number"
                inputMode="numeric"
                min="0"
                max="60"
                step="1"
                value={form.downtimeMinutes}
                onChange={e => updateField('downtimeMinutes', e.target.value)}
                placeholder="0"
              />
              {errors.downtimeMinutes && <span className="field-error-msg">{errors.downtimeMinutes}</span>}
            </div>

            {!isNaN(downtime) && downtime > 0 ? (
              <div className="form-field">
                <label htmlFor="entry-downtime-reason">
                  <span>Downtime explanation</span>
                  <span className="field-mark-req">* Required when downtime &gt; 0</span>
                </label>
                <input
                  id="entry-downtime-reason"
                  type="text"
                  value={form.downtimeReason}
                  onChange={e => updateField('downtimeReason', e.target.value)}
                  placeholder="e.g. Tool change, calibration, material loading"
                />
                {errors.downtimeReason && <span className="field-error-msg">{errors.downtimeReason}</span>}
              </div>
            ) : <div />}
          </div>
        </section>

        {/* ─── Band 4: Operator Remarks & Sign-off ─── */}
        <section className="form-band">
          <div className="band-title">Remarks & Observations</div>
          <div className="form-field">
            <label htmlFor="entry-remarks">
              <span>Operational remarks</span>
              {liveCalcs.rejPct !== null && liveCalcs.rejPct > 10 ? (
                <span className="field-mark-req">* Mandatory — rejection rate exceeds 10%</span>
              ) : (
                <span className="field-mark-opt">(optional)</span>
              )}
            </label>
            <textarea
              id="entry-remarks"
              value={form.remarks}
              onChange={e => updateField('remarks', e.target.value)}
              rows={3}
              placeholder="Record any tool anomalies, fixture adjustments, heat batch variance..."
            />
            {errors.remarks && <span className="field-error-msg">{errors.remarks}</span>}
          </div>
        </section>
      </div>

      {/* ─── Form Action Buttons ─── */}
      <footer className="form-docket-actions">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Recording…' : isEdit ? 'Update Docket' : 'Save as Draft'}
        </button>
      </footer>
    </form>
  );
}
