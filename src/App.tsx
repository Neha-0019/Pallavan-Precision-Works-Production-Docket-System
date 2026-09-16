import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useEntries } from './hooks/useEntries';
import { LoginPage } from './components/LoginPage';
import { EntryList } from './components/EntryList';
import { EntryForm } from './components/EntryForm';
import { EditEntryPage } from './components/EditEntryPage';
import { ExportPanel } from './components/ExportPanel';
import { ProtectedRoute } from './components/ProtectedRoute';

function NewEntryPage() {
  const { user } = useAuth();
  const { saveEntry } = useEntries(user);

  if (!user) return null;

  async function handleSave(form: Parameters<typeof saveEntry>[0]) {
    await saveEntry(form, user!);
  }

  return (
    <div className="page-content">
      <EntryForm onSave={handleSave} />
    </div>
  );
}

function NavBar() {
  const { user, signOut } = useAuth();
  const online = useOnlineStatus();
  const location = useLocation();

  if (!user) return null;

  const roleLabel = user.role.toUpperCase();

  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <span className="nav-logo-badge">PPW</span>
        <div className="nav-title-group">
          <span className="nav-title">Pallavan Precision Works</span>
          <span className="nav-subtitle">Shop-Floor Production Docket System</span>
        </div>
      </div>

      <div className="nav-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'nav-link--active' : ''}`}
        >
          {user.role === 'operator' ? 'Shift Dockets' : 'Review Queue'}
        </Link>
        {(user.role === 'supervisor' || user.role === 'manager') && (
          <Link
            to="/export"
            className={`nav-link ${location.pathname === '/export' ? 'nav-link--active' : ''}`}
          >
            Data Extract
          </Link>
        )}
      </div>

      <div className="nav-right">
        <div className="online-indicator" title={online ? 'Connected to plant network' : 'Offline — local cache active'}>
          <span className={`stack-light-dot ${online ? 'stack-light-dot--green' : 'stack-light-dot--red'}`} />
          <span>{online ? 'Online' : 'Offline'}</span>
        </div>
        <div className="nav-user">
          <span>{user.displayName}</span>
          <span className="nav-role">{roleLabel}</span>
        </div>
        <button type="button" className="btn btn-sm btn-secondary" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">INITIALIZING TERMINAL…</div>;

  return (
    <>
      <NavBar />
      <main className={user ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['operator', 'supervisor', 'manager']}>
                <EntryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute allowedRoles={['operator']}>
                <NewEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:entryId"
            element={
              <ProtectedRoute allowedRoles={['operator']}>
                <EditEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'manager']}>
                <ExportPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
