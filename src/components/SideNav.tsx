import { BellRing, LayoutDashboard, Radar, RadioTower, Waves } from 'lucide-react';

export type DashboardView = 'overview' | 'tropical' | 'marine' | 'alerts';

interface SideNavProps {
  activeView: DashboardView;
  onChange: (view: DashboardView) => void;
}

const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tropical', label: 'Tropical', icon: Radar },
  { id: 'marine', label: 'Marine', icon: Waves },
  { id: 'alerts', label: 'Alerts', icon: BellRing },
] satisfies Array<{ id: DashboardView; label: string; icon: typeof LayoutDashboard }>;

export function SideNav({ activeView, onChange }: SideNavProps) {
  return (
    <nav className="side-nav" aria-label="Dashboard sections">
      <div className="side-nav__signal" aria-label="Pacific Signal home">
        <RadioTower size={22} strokeWidth={1.6} />
      </div>
      <div className="side-nav__items">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            className={`side-nav__item ${activeView === id ? 'is-active' : ''}`}
            type="button"
            key={id}
            onClick={() => onChange(id)}
            aria-current={activeView === id ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="side-nav__version">PS·01</div>
    </nav>
  );
}
