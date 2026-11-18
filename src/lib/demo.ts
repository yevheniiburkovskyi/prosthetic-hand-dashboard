import { FINGERS, MAX_FSR_VALUE } from '@/lib/constants';
import { fsrProfile } from '@/mocks/fsrMocks';
import { temperatureProfile } from '@/mocks/temperatureMocks';
import type { Finger, HandReadings, SensorKind } from '@/types/sensorType';

/** How often demo mode emits a reading (≈ a real device notification rate). */
export const DEMO_INTERVAL_MS = 100;

/** Each finger oscillates around its own level so cards show varied values. */
export interface FingerWave {
  /** Typical value for this finger. */
  center: number;
  /** Max distance from center; value stays within center ± swing. */
  swing: number;
  /** Seconds for one main oscillation. */
  period: number;
  /** Phase offset in radians, so fingers don't move in lockstep. */
  phase: number;
}

export type DemoProfile = Record<Finger, FingerWave>;

interface DemoSource {
  profile: DemoProfile;
  decimals: number;
  min: number;
  max: number;
  /** Small fast tremor on top of the slow wave. */
  tremor: number;
}

const DEMO_SOURCES: Record<SensorKind, DemoSource> = {
  temperature: {
    profile: temperatureProfile,
    decimals: 1,
    min: 0,
    max: 100,
    tremor: 0.4,
  },
  fsr: {
    profile: fsrProfile,
    decimals: 0,
    min: 0,
    max: MAX_FSR_VALUE,
    tremor: 25,
  },
};

const TAU = Math.PI * 2;

/** Slow main wave plus a faster harmonic; result stays within [-1, 1]. */
const wave = (t: number, { period, phase }: FingerWave) =>
  0.75 * Math.sin((TAU * t) / period + phase) +
  0.25 * Math.sin((TAU * t) / (period * 0.37) + phase * 2);

/** Fast low-amplitude wobble in [-1, 1], different per finger. */
const tremor = (t: number, seed: number) =>
  Math.sin(t * 9.1 + seed) * 0.6 + Math.sin(t * 17.3 + seed * 2.1) * 0.4;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const getDemoReadings = (
  kind: SensorKind,
  elapsedMs: number
): HandReadings => {
  const source = DEMO_SOURCES[kind];
  const t = elapsedMs / 1000;
  const timestamp = Math.round(elapsedMs);

  return Object.fromEntries(
    FINGERS.map((finger, i) => {
      const fingerWave = source.profile[finger];
      const value =
        fingerWave.center +
        fingerWave.swing * wave(t, fingerWave) +
        source.tremor * tremor(t, i * 1.7);

      return [
        finger,
        {
          value: round(
            Math.min(source.max, Math.max(source.min, value)),
            source.decimals
          ),
          timestamp,
        },
      ];
    })
  ) as HandReadings;
};
