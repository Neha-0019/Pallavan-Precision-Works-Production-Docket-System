import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { EntryForm } from './EntryForm';

export function EditEntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const { user } = useAuth();
  const { entries, loading, saveEntry } = useEntries(user);

  if (!user || user.role !== 'operator') return <Navigate to="/" replace />;
  if (loading) return <div className="loading-screen">Loading…</div>;

  const entry = entries.find(e => e.id === entryId);
  if (!entry) return <div className="error-banner">Entry not found.</div>;

  // Only draft or returned entries can be edited
  if (entry.status !== 'draft' && entry.status !== 'returned') {
    return <div className="error-banner">This entry cannot be edited — it has been {entry.status}.</div>;
  }

  if (entry.operatorId !== user.uid) {
    return <div className="error-banner">You can only edit your own entries.</div>;
  }

  async function handleSave(form: Parameters<typeof saveEntry>[0]) {
    await saveEntry(form, user!, entry);
  }

  return (
    <div className="page-content">
      <EntryForm existingEntry={entry} onSave={handleSave} />
    </div>
  );
}
