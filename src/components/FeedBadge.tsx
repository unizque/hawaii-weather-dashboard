import type { FeedStatus } from '../types/weather';

const labels: Record<FeedStatus, string> = {
  loading: 'Syncing',
  live: 'Live',
  cached: 'Cached',
  preview: 'Preview',
  unavailable: 'Offline',
};

export function FeedBadge({ status }: { status: FeedStatus }) {
  return (
    <span className={`feed-badge feed-badge--${status}`}>
      <span className="feed-badge__dot" aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
