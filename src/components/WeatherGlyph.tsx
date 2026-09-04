import { Cloud, CloudLightning, CloudMoon, CloudRain, CloudSun, Moon, Sun } from 'lucide-react';

interface WeatherGlyphProps {
  forecast: string;
  isDaytime?: boolean;
  size?: number;
}

export function WeatherGlyph({ forecast, isDaytime = true, size = 28 }: WeatherGlyphProps) {
  const normalized = forecast.toLowerCase();
  const props = { size, strokeWidth: 1.5, 'aria-hidden': true } as const;

  if (normalized.includes('thunder')) return <CloudLightning {...props} />;
  if (normalized.includes('rain') || normalized.includes('shower')) return <CloudRain {...props} />;
  if (normalized.includes('cloud') || normalized.includes('overcast')) {
    return isDaytime ? <CloudSun {...props} /> : <CloudMoon {...props} />;
  }
  if (normalized.includes('sun') || normalized.includes('clear')) {
    return isDaytime ? <Sun {...props} /> : <Moon {...props} />;
  }
  return <Cloud {...props} />;
}
