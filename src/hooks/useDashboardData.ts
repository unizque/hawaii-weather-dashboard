import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultIsland, islands } from '../data/islands';
import { createPreviewConditions, createPreviewForecast } from '../data/preview';
import { clearWeatherCache } from '../services/cache';
import { fetchPacificSystems } from '../services/nhc';
import { fetchHawaiiAlerts, fetchIslandWeather } from '../services/nws';
import type {
  CurrentConditions,
  FeedResult,
  ForecastPeriod,
  IslandId,
  TropicalSystem,
  WeatherAlert,
} from '../types/weather';

function loading<T>(feed: FeedResult<T>): FeedResult<T> {
  return { ...feed, status: 'loading' };
}

export function useDashboardData() {
  const [selectedIslandId, setSelectedIslandId] = useState<IslandId>(defaultIsland.id);
  const selectedIsland = useMemo(
    () => islands.find((island) => island.id === selectedIslandId) ?? defaultIsland,
    [selectedIslandId],
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [conditions, setConditions] = useState<FeedResult<CurrentConditions>>({
    data: createPreviewConditions(defaultIsland),
    status: 'preview',
    updatedAt: null,
  });
  const [forecast, setForecast] = useState<FeedResult<ForecastPeriod[]>>({
    data: createPreviewForecast(defaultIsland),
    status: 'preview',
    updatedAt: null,
  });
  const [alerts, setAlerts] = useState<FeedResult<WeatherAlert[]>>({
    data: [],
    status: 'loading',
    updatedAt: null,
  });
  const [storms, setStorms] = useState<FeedResult<TropicalSystem[]>>({
    data: [],
    status: 'loading',
    updatedAt: null,
  });
  useEffect(() => {
    const controller = new AbortController();
    setConditions((current) => loading(current));
    setForecast((current) => loading(current));

    fetchIslandWeather(selectedIsland, controller.signal)
      .then((result) => {
        setConditions(result.conditions);
        setForecast(result.forecast);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'NWS feed unavailable';
        setConditions({
          data: createPreviewConditions(selectedIsland),
          status: 'preview',
          updatedAt: null,
          error: message,
        });
        setForecast({
          data: createPreviewForecast(selectedIsland),
          status: 'preview',
          updatedAt: null,
          error: message,
        });
      });

    return () => controller.abort();
  }, [selectedIsland, refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    setAlerts((current) => loading(current));
    setStorms((current) => loading(current));

    void Promise.all([
      fetchHawaiiAlerts(controller.signal)
        .then(setAlerts)
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setAlerts({
            data: [],
            status: 'unavailable',
            updatedAt: null,
            error: error instanceof Error ? error.message : 'NWS alerts unavailable',
          });
      }),
      fetchPacificSystems(controller.signal).then(setStorms),
    ]);

    return () => controller.abort();
  }, [refreshToken]);

  const refresh = useCallback(() => {
    clearWeatherCache();
    setRefreshToken((value) => value + 1);
  }, []);

  return {
    selectedIsland,
    selectedIslandId,
    setSelectedIslandId,
    conditions,
    forecast,
    alerts,
    storms,
    refresh,
  };
}
