import { FINGERS, MAX_FSR_VALUE } from '@/lib/constants';
import { FSR_REST_OFFSETS, fsrProfiles } from '@/mocks/fsrMocks';
import { temperatureProfiles } from '@/mocks/temperatureMocks';
import type { Finger, HandReadings, SensorKind } from '@/types/sensorType';

/** How often demo mode emits a reading (≈ a real device notification rate). */
export const DEMO_INTERVAL_MS = 100;

/** 'normal' = realistic values; 'states' = full range to show every level. */
export type DemoScenario = 'normal' | 'states';

export interface DemoSettings {
  scenario: DemoScenario;
  /** Add random jitter and FSR resting offset, like real sensors. */
  noise: boolean;
}

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  scenario: 'normal',
  noise: false,
};

/** Each finger oscillates around its own level. */
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
  profiles: Record<DemoScenario, DemoProfile>;
  decimals: number;
  min: number;
  max: number;
  /** Smooth fast wobble (e.g. muscle tremor) on top of the slow wave. */
  tremor: number;
  /** Random per-sample noise amplitude (±) when noise is on. */
  noise: number;
  /** Unloaded sensor reading added when noise is on. */
  restOffsets?: Record<Finger, number>;
}

const DEMO_SOURCES: Record<SensorKind, DemoSource> = {
  temperature: {
    profiles: temperatureProfiles,
    decimals: 1,
    min: 0,
    max: 100,
    tremor: 0,
    noise: 0.3,
  },
  fsr: {
    profiles: fsrProfiles,
    decimals: 0,
    min: 0,
    max: MAX_FSR_VALUE,
    tremor: 15,
    noise: 12,
    restOffsets: FSR_REST_OFFSETS,
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

/**
 * @param resting simulate an unloaded hand (FSR reads only offset + noise),
 *   used while calibrating in demo mode.
 */
export const getDemoReadings = (
  kind: SensorKind,
  elapsedMs: number,
  { scenario, noise }: DemoSettings,
  { resting = false }: { resting?: boolean } = {}
): HandReadings => {
  const source = DEMO_SOURCES[kind];
  const profile = source.profiles[scenario];
  const t = elapsedMs / 1000;
  const timestamp = Math.round(elapsedMs);

  return Object.fromEntries(
    FINGERS.map((finger, i) => {
      const fingerWave = profile[finger];
      const signal =
        resting && kind === 'fsr'
          ? 0
          : Math.max(
              0,
              fingerWave.center +
                fingerWave.swing * wave(t, fingerWave) +
                source.tremor * tremor(t, i * 1.7)
            );
      const sensorError = noise
        ? (source.restOffsets?.[finger] ?? 0) +
          (Math.random() * 2 - 1) * source.noise
        : 0;
      const value = signal + sensorError;

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
