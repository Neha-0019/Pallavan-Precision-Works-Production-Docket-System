export function SyncIndicator({ hasPendingWrites }: { hasPendingWrites: boolean }) {
  if (hasPendingWrites) {
    return (
      <span className="sync-status" title="Local modifications pending sync to plant database">
        <span className="stack-light-dot stack-light-dot--amber" />
        <span>Waiting to sync</span>
      </span>
    );
  }
  return (
    <span className="sync-status" title="Entry record synced to plant database">
      <span className="stack-light-dot stack-light-dot--green" />
      <span>Synced</span>
    </span>
  );
}
