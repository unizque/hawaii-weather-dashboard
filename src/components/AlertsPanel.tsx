import { useState } from 'react';
import { BellRing, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatHstTime, severityTone } from '../lib/weather';
import type { FeedStatus, WeatherAlert } from '../types/weather';
import { AlertDetailsDialog } from './AlertDetailsDialog';

interface AlertsPanelProps {
  alerts: WeatherAlert[];
  status: FeedStatus;
}

export function AlertsPanel({ alerts, status }: AlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  return (
    <section className="panel alerts-panel">
      <div className="panel-heading panel-heading--compact">
        <div>
          <span className="overline">Watches & warnings</span>
          <h3>Statewide alerts</h3>
        </div>
        <BellRing size={19} aria-hidden="true" />
      </div>

      <div className="alerts-panel__body">
        {status === 'loading' ? (
          <div className="empty-state"><BellRing size={19} /><p>Checking active products…</p></div>
        ) : alerts.length === 0 ? (
          <div className={`empty-state ${status === 'live' ? 'is-clear' : ''}`}>
            <ShieldCheck size={21} />
            <p>{status === 'live' ? 'No active statewide alerts.' : 'Alerts are temporarily unavailable.'}</p>
          </div>
        ) : (
          alerts.slice(0, 2).map((alert) => (
            <button
              className={`alert-item alert-item--${severityTone(alert.severity)}`}
              key={alert.id}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setSelectedAlert(alert)}
            >
              <span className="alert-item__bar" aria-hidden="true" />
              <div>
                <small>{alert.severity} · until {formatHstTime(alert.expiresAt, { hour: 'numeric', minute: '2-digit' })} HST</small>
                <strong>{alert.event}</strong>
                <p>{alert.areaDescription}</p>
              </div>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ))
        )}
      </div>
      {selectedAlert && (
        <AlertDetailsDialog key={selectedAlert.id} alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </section>
  );
}
