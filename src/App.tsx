import { useEffect, useState } from 'react';
import { ExternalLink, Info, Radio } from 'lucide-react';
import { AlertsPanel } from './components/AlertsPanel';
import { BuoyPanel } from './components/BuoyPanel';
import { ConditionsPanel } from './components/ConditionsPanel';
import { ForecastRail } from './components/ForecastRail';
import { HawaiiMap, type MapMode } from './components/HawaiiMap';
import { IslandBriefing } from './components/IslandBriefing';
import { Masthead } from './components/Masthead';
import { SideNav, type DashboardView } from './components/SideNav';
import { StatusRibbon } from './components/StatusRibbon';
import { TropicalList } from './components/TropicalList';
import { useDashboardData } from './hooks/useDashboardData';
import { useHawaiiClock } from './hooks/useHawaiiClock';
import type { FeedStatus, TropicalSystem } from './types/weather';

function resolveOverallStatus(statuses: FeedStatus[]): FeedStatus {
  if (statuses.some((status) => status === 'loading')) return 'loading';
  if (statuses.some((status) => status === 'preview')) return 'preview';
  if (statuses.some((status) => status === 'unavailable')) return 'cached';
  if (statuses.some((status) => status === 'cached')) return 'cached';
  return 'live';
}

function App() {
  const now = useHawaiiClock();
  const {
    selectedIsland,
    setSelectedIslandId,
    conditions,
    forecast,
    alerts,
    storms,
    buoys,
    refresh,
  } = useDashboardData();
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [mapMode, setMapMode] = useState<MapMode>('islands');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSystemId && storms.data.some((storm) => storm.id === selectedSystemId)) return;
    setSelectedSystemId(storms.data[0]?.id ?? null);
  }, [selectedSystemId, storms.data]);

  const statuses = [conditions.status, alerts.status, storms.status, buoys.status];
  const isRefreshing = statuses.some((status) => status === 'loading');
  const overallStatus = resolveOverallStatus(statuses);

  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
    if (view === 'tropical') setMapMode('pacific');
    if (view === 'overview' || view === 'marine' || view === 'alerts') setMapMode('islands');
  };

  const handleSystemSelect = (system: TropicalSystem) => {
    setSelectedSystemId(system.id);
    setActiveView('tropical');
    setMapMode('pacific');
  };

  return (
    <div className="app-shell" data-view={activeView}>
      <SideNav activeView={activeView} onChange={handleViewChange} />

      <div className="app-frame">
        <Masthead now={now} isRefreshing={isRefreshing} onRefresh={refresh} />
        <StatusRibbon
          alertCount={alerts.data.length}
          systemCount={storms.data.length}
          buoyCount={buoys.data.length}
          overallStatus={overallStatus}
        />

        <main className="dashboard-grid">
          <aside className="dashboard-column dashboard-column--left">
            <IslandBriefing
              selectedIsland={selectedIsland}
              conditions={conditions.data}
              onSelectIsland={(id) => {
                setSelectedIslandId(id);
                setMapMode('islands');
              }}
            />
            <TropicalList
              systems={storms.data}
              status={storms.status}
              selectedSystemId={selectedSystemId}
              onSelect={handleSystemSelect}
            />
          </aside>

          <HawaiiMap
            selectedIsland={selectedIsland}
            selectedSystemId={selectedSystemId}
            alerts={alerts.data}
            systems={storms.data}
            mode={mapMode}
            onModeChange={setMapMode}
            onSelectIsland={(id) => {
              setSelectedIslandId(id);
              setMapMode('islands');
            }}
            onSelectSystem={handleSystemSelect}
          />

          <aside className="dashboard-column dashboard-column--right">
            <ConditionsPanel
              island={selectedIsland}
              conditions={conditions.data}
              status={conditions.status}
              updatedAt={conditions.updatedAt}
            />
            <AlertsPanel alerts={alerts.data} status={alerts.status} />
            <BuoyPanel buoys={buoys.data} status={buoys.status} updatedAt={buoys.updatedAt} />
          </aside>
        </main>

        <ForecastRail island={selectedIsland} periods={forecast.data} status={forecast.status} />

        <footer className="site-footer">
          <div>
            <Radio size={13} aria-hidden="true" />
            <span>Sources: NOAA · NWS Honolulu · National Hurricane Center · NDBC</span>
          </div>
          <p>
            <Info size={13} aria-hidden="true" /> Educational project — always follow official emergency guidance.
          </p>
          <a href="https://www.weather.gov/hfo/" target="_blank" rel="noreferrer">
            Official forecasts <ExternalLink size={12} />
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
