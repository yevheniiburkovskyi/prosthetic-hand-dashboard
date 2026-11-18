import { FINGERS } from '@/lib/constants';
import { fsrMockSeries } from '@/mocks/fsrMocks';
import { temperatureMockSeries } from '@/mocks/temperatureMocks';
import type {
  HandReadings,
  SensorKind,
  SensorSample,
} from '@/types/sensorType';

/** How often demo mode emits a reading (≈ a real device notification rate). */
export const DEMO_INTERVAL_MS = 100;

const DEMO_SOURCES: Record<
  SensorKind,
  { series: SensorSample[]; decimals: number }
> = {
  temperature: { series: temperatureMockSeries, decimals: 1 },
  fsr: { series: fsrMockSeries, decimals: 0 },
};

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Replays the mock series (1 point per second) as a continuous loop,
 * linearly interpolating between points so the stream looks live.
 */
export const getDemoReadings = (
  kind: SensorKind,
  elapsedMs: number
): HandReadings => {
  const { series, decimals } = DEMO_SOURCES[kind];
  const position = (elapsedMs / 1000) % series.length;
  const index = Math.floor(position);
  const progress = position - index;
  const from = series[index];
  const to = series[(index + 1) % series.length];
  const timestamp = Math.round(elapsedMs);

  return Object.fromEntries(
    FINGERS.map((finger) => [
      finger,
      {
        value: round(
          from[finger] + (to[finger] - from[finger]) * progress,
          decimals
        ),
        timestamp,
      },
    ])
  ) as HandReadings;
};
