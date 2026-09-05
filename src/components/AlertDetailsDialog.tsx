import { useEffect, useRef } from 'react';
import { ArrowUpRight, Clock3, MapPin, ShieldAlert, X } from 'lucide-react';
import { officialAlertPage } from '../lib/alerts';
import { formatHstTime, severityTone } from '../lib/weather';
import type { WeatherAlert } from '../types/weather';

interface AlertDetailsDialogProps {
  alert: WeatherAlert;
  onClose: () => void;
}

function fullTime(value: string): string {
  return `${formatHstTime(value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} HST`;
}

export function AlertDetailsDialog({ alert, onClose }: AlertDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`alert-dialog alert-dialog--${severityTone(alert.severity)}`}
      aria-labelledby="alert-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="alert-dialog__sheet">
        <header className="alert-dialog__header">
          <div className="alert-dialog__symbol"><ShieldAlert size={22} /></div>
          <div>
            <span className="overline">{alert.severity} · {alert.urgency}</span>
            <h2 id="alert-dialog-title">{alert.event}</h2>
            <p>{alert.headline}</p>
          </div>
          <button className="alert-dialog__close" type="button" onClick={onClose} aria-label="Close advisory" autoFocus>
            <X size={19} />
          </button>
        </header>

        <div className="alert-dialog__meta">
          <div><Clock3 size={15} /><span><small>Effective</small>{fullTime(alert.effectiveAt)}</span></div>
          <div><Clock3 size={15} /><span><small>Expires</small>{fullTime(alert.expiresAt)}</span></div>
        </div>

        <div className="alert-dialog__body">
          <section>
            <h3>Full advisory</h3>
            <p className="alert-dialog__copy">{alert.description}</p>
          </section>

          {alert.instruction && (
            <section className="alert-dialog__instructions">
              <h3>What to do</h3>
              <p className="alert-dialog__copy">{alert.instruction}</p>
            </section>
          )}

          <section className="alert-dialog__areas">
            <h3><MapPin size={15} /> Affected areas</h3>
            <p>{alert.areaDescription}</p>
          </section>
        </div>

        <footer className="alert-dialog__footer">
          <p>Official National Weather Service product</p>
          <a href={officialAlertPage(alert)} target="_blank" rel="noreferrer">
            Open on NOAA / NWS <ArrowUpRight size={15} />
          </a>
        </footer>
      </div>
    </dialog>
  );
}
