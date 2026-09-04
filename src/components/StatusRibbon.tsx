import { Activity, BellRing, RadioTower, Waves } from 'lucide-react';
import type { FeedStatus } from '../types/weather';
import { FeedBadge } from './FeedBadge';

interface StatusRibbonProps {
  alertCount: number;
  systemCount: number;
  buoyCount: number;
  overallStatus: FeedStatus;
}

export function StatusRibbon({ alertCount, systemCount, buoyCount, overallStatus }: StatusRibbonProps) {
  const stats = [
    { label: 'Island stations', value: '5', icon: RadioTower, tone: 'cyan' },
    { label: 'Active alerts', value: String(alertCount).padStart(2, '0'), icon: BellRing, tone: alertCount ? 'amber' : 'mint' },
    { label: 'Pacific systems', value: String(systemCount).padStart(2, '0'), icon: Activity, tone: systemCount ? 'coral' : 'mint' },
    { label: 'Buoys reporting', value: String(buoyCount).padStart(2, '0'), icon: Waves, tone: 'blue' },
  ];

  return (
    <section className="status-ribbon" aria-label="Network summary">
      <div className="status-ribbon__intro">
        <span className="overline">Central Pacific network</span>
        <FeedBadge status={overallStatus} />
      </div>
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div className="status-ribbon__stat" key={label}>
          <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <span>{label}</span>
            <strong className={`tone-${tone}`}>{value}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}
