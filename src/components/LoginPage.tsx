import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  function setQuickUser(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
  }

  return (
    <div className="login-split-layout">
      {/* ─── Left Two-Thirds: Plant Sheet & Operation Schedule ─── */}
      <div className="login-left-sheet">
        <div className="login-brand-plate">
          <div className="company-title-block">
            <div className="company-division">Precision Engineering & Machining Division</div>
            <h1 className="company-name">PALLAVAN PRECISION WORKS</h1>
          </div>
          <div className="system-title">
            Shop-Floor Shift Production Docket System
          </div>
        </div>

        <div className="login-schedule-block">
          <div className="schedule-header">Plant Shift Schedule & Station Handover</div>
          <div className="schedule-grid">
            <div className="schedule-item">
              <span className="shift-code">Shift A</span>
              <span className="shift-timing">06:00 – 14:00</span>
            </div>
            <div className="schedule-item">
              <span className="shift-code">Shift B</span>
              <span className="shift-timing">14:00 – 22:00</span>
            </div>
            <div className="schedule-item">
              <span className="shift-code">Shift C</span>
              <span className="shift-timing">22:00 – 06:00</span>
            </div>
          </div>
        </div>

        <div className="login-left-footer">
          <div>
            <span>FORM PPW-SOP-04 REV C</span>
          </div>
          <div>
            <span>STATIONS: PPW-CNC-01 TO PPW-GRIND-05</span>
          </div>
        </div>
      </div>

      {/* ─── Right One-Third: Sign-In Panel Flush Against Hard Divider ─── */}
      <div className="login-right-panel">
        <div className="login-box">
          <div className="login-box-header">
            <h2>Station Badge-In</h2>
            <p>Enter shift operator or supervisor credentials to access plant dockets</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-field">
              <label htmlFor="login-email">Station Email / Badge ID</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator1@ppw.local"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Access Passcode</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Authenticating Station…' : 'Badge In to Terminal'}
            </button>
          </form>

          {/* Quick Seeded Reference */}
          <div className="login-credentials-hint">
            <div className="hint-title">Quick Badge-In Preset</div>
            <div className="credentials-list">
              <div
                className="credential-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setQuickUser('operator1@ppw.local', 'operator123')}
                title="Click to fill operator credentials"
              >
                <span>operator1@ppw.local</span>
                <span className="credential-role">Operator ➔</span>
              </div>
              <div
                className="credential-item"
                style={{ cursor: 'pointer' }}
                onClick={() => setQuickUser('supervisor1@ppw.local', 'super123')}
                title="Click to fill supervisor credentials"
              >
                <span>supervisor1@ppw.local</span>
                <span className="credential-role">Supervisor ➔</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
