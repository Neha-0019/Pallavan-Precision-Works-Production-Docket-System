import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { SHIFTS } from '../utils/seedData';
import { exportToExcel } from '../utils/export';
import type { Shift } from '../types';

export function ExportPanel() {
  const { user } = useAuth();
  const { entries } = useEntries(user);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<Shift | ''>('');
  const [exported, setExported] = useState(false);

  if (!user || (user.role !== 'supervisor' && user.role !== 'manager')) return null;

  function handleExport() {
    if (!shift) return;
    const filtered = entries.filter(e => e.date === date && e.shift === shift);
    if (filtered.length === 0) {
      alert('No dockets found for the selected date and shift.');
      return;
    }
    exportToExcel(filtered, date, shift);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  return (
    <div className="export-docket">
      <header className="export-docket-header">
        <h2>Production Data Extraction</h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--steel)', fontFamily: 'var(--font-mono)' }}>
          Standard Plant Shift Export · Form PPW-XLS-01
        </span>
      </header>

      <div className="form-grid-3">
        <div className="form-field">
          <label htmlFor="export-date">
            <span>Production Date</span>
            <span className="field-mark-req">*</span>
          </label>
          <input
            id="export-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="export-shift">
            <span>Shift</span>
            <span className="field-mark-req">*</span>
          </label>
          <select
            id="export-shift"
            value={shift}
            onChange={e => setShift(e.target.value as Shift)}
          >
            <option value="">Select shift</option>
            {Object.entries(SHIFTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleExport}
            disabled={!shift}
          >
            {exported ? '✓ Export Complete' : 'Download Shift Excel File'}
          </button>
        </div>
      </div>
    </div>
  );
}
