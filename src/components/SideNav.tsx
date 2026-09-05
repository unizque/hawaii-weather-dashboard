import { LayoutDashboard, RadioTower } from 'lucide-react';
import { StormSymbol } from './StormSymbol';

export type DashboardView = 'overview' | 'tropical';

interface SideNavProps {
  activeView: DashboardView;
  onChange: (view: DashboardView) => void;
}

const items = [
  { id: 'overview', label: 'Overview' },
  { id: 'tropical', label: 'Hurricanes' },
] satisfies Array<{ id: DashboardView; label: string }>;

export function SideNav({ activeView, onChange }: SideNavProps) {
  return (
    <nav className="side-nav" aria-label="Dashboard sections">
      <div className="side-nav__signal" aria-label="Pacific Signal home">
        <RadioTower size={22} strokeWidth={1.6} />
      </div>
      <div className="side-nav__items">
        {items.map(({ id, label }) => (
          <button
            className={`side-nav__item ${activeView === id ? 'is-active' : ''}`}
            type="button"
            key={id}
            onClick={() => onChange(id)}
            aria-current={activeView === id ? 'page' : undefined}
          >
            {id === 'overview'
              ? <LayoutDashboard size={20} strokeWidth={1.5} />
              : <StormSymbol size={22} />}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="side-nav__version">Hawaiʻi</div>
    </nav>
  );
}
