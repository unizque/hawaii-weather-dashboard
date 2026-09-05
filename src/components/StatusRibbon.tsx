import { Activity, BellRing, Clock3, RadioTower, Waves } from 'lucide-react';
import { formatAge } from '../lib/weather';

interface StatusRibbonProps {
  alertCount: number;
  systemCount: number;
  buoyCount: number;
  updatedAt: string | null;
}

export function StatusRibbon({ alertCount, systemCount, buoyCount, updatedAt }: StatusRibbonProps) {
  const stats = [
    { label: 'Island stations', value: '5', icon: RadioTower, tone: 'cyan' },
    { label: 'Active alerts', value: String(alertCount).padStart(2, '0'), icon: BellRing, tone: alertCount ? 'amber' : 'mint' },
    { label: 'Pacific systems', value: String(systemCount).padStart(2, '0'), icon: Activity, tone: systemCount ? 'coral' : 'mint' },
    { label: 'Buoys reporting', value: String(buoyCount).padStart(2, '0'), icon: Waves, tone: 'blue' },
  ];

  return (
    <section className="status-ribbon" aria-label="Network summary">
      <div className="status-ribbon__intro">
        <span className="overline">Island weather at a glance</span>
        <span className="status-ribbon__updated"><Clock3 size={13} /> Updated {formatAge(updatedAt)}</span>
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
