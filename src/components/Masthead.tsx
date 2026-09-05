import { RefreshCw } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { formatHstTime } from '../lib/weather';

interface MastheadProps {
  now: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Masthead({ now, isRefreshing, onRefresh }: MastheadProps) {
  return (
    <header className="masthead">
      <div className="masthead__brand">
        <BrandMark />
        <div>
          <p className="eyebrow">Weather across the islands</p>
          <h1>Pacific Signal</h1>
        </div>
      </div>

      <div className="masthead__right">
        <div className="masthead__clock" aria-label="Current Hawaii Standard Time">
          <strong>
            {formatHstTime(now, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false })}
            <span> HST</span>
          </strong>
          <small>{formatHstTime(now, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</small>
        </div>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh weather data">
          <RefreshCw className={isRefreshing ? 'is-spinning' : ''} size={18} />
        </button>
      </div>
    </header>
  );
}
