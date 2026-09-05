import { stormIntensityTone } from '../lib/tropical';

interface StormSymbolProps {
  size?: number;
  intensityKt?: number;
  className?: string;
}

export const stormSymbolPaths = {
  leading: 'M32 29c-7-6-9-15-5-24C15 7 6 17 7 29c1 11 10 19 21 19-5-4-6-12-1-17l5-2Z',
  trailing: 'M32 35c7 6 9 15 5 24 12-2 21-12 20-24-1-11-10-19-21-19 5 4 6 12 1 17l-5 2Z',
};

export function StormSymbol({ size = 24, intensityKt, className = '' }: StormSymbolProps) {
  const tone = intensityKt === undefined ? '' : ` storm-glyph--${stormIntensityTone(intensityKt)}`;

  return (
    <svg
      className={`storm-glyph${tone}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d={stormSymbolPaths.leading} fill="currentColor" />
      <path d={stormSymbolPaths.trailing} fill="currentColor" />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
      <circle cx="32" cy="32" r="2" fill="white" fillOpacity="0.86" />
    </svg>
  );
}
