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
  /** Simulated measurement problem, to exercise signal analysis. */
  fault?: DemoFault;
}

/**
 * - spikes: a short negative glitch every few seconds
 * - noisy: heavy random noise above the analysis tolerance
 * - saturation: amplified so peaks hit the sensor maximum
 * - stuck: periodically freezes at one value
 */
export type DemoFault = 'spikes' | 'noisy' | 'saturation' | 'stuck';

const SPIKE_EVERY_TICKS = 70; // ~7 s at 10 Hz
const SPIKE_DROP = 900;
const NOISY_AMPLITUDE = 120;
const SATURATION_GAIN = 5;
const STUCK_CYCLE_SECONDS = 12;
const STUCK_HOLD_SECONDS = 3;
const STUCK_MIN_VALUE = 400;
const PACKET_GAP_CYCLE_MS = 20_000;
const PACKET_GAP_START_MS = 12_000;
const PACKET_GAP_MS = 600;

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
    // ~3–4% of range: above the ±2% analysis tolerance, so it gets flagged.
    noise: 150,
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

const signalAt = (
  t: number,
  fingerWave: FingerWave,
  tremorAmp: number,
  seed: number
) =>
  Math.max(
    0,
    fingerWave.center +
      fingerWave.swing * wave(t, fingerWave) +
      tremorAmp * tremor(t, seed)
  );

const applyFault = (
  fault: DemoFault,
  value: number,
  t: number,
  signalAtTime: (time: number) => number
): number => {
  switch (fault) {
    case 'spikes':
      return Math.floor(t * 10) % SPIKE_EVERY_TICKS === 0
        ? value - SPIKE_DROP
        : value;
    case 'noisy':
      return value + (Math.random() * 2 - 1) * NOISY_AMPLITUDE;
    case 'saturation':
      return value * SATURATION_GAIN;
    case 'stuck': {
      const cyclePosition = t % STUCK_CYCLE_SECONDS;
      return cyclePosition < STUCK_HOLD_SECONDS
        ? Math.max(STUCK_MIN_VALUE, Math.round(signalAtTime(t - cyclePosition)))
        : value;
    }
  }
};

/** "All states" demo periodically loses FSR packets, like a weak BLE link. */
export const isDemoPacketDropped = (
  kind: SensorKind,
  elapsedMs: number,
  { scenario }: DemoSettings
) => {
  if (kind !== 'fsr' || scenario !== 'states') return false;
  const cyclePosition = elapsedMs % PACKET_GAP_CYCLE_MS;
  return (
    cyclePosition >= PACKET_GAP_START_MS &&
    cyclePosition < PACKET_GAP_START_MS + PACKET_GAP_MS
  );
};

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
      const signalAtTime = (time: number) =>
        signalAt(time, fingerWave, source.tremor, i * 1.7);
      const isResting = resting && kind === 'fsr';

      let value = isResting ? 0 : signalAtTime(t);
      if (noise) {
        value +=
          (source.restOffsets?.[finger] ?? 0) +
          (Math.random() * 2 - 1) * source.noise;
      }
      // Faults are off while calibrating so they don't skew the baseline.
      if (fingerWave.fault && !isResting) {
        value = applyFault(fingerWave.fault, value, t, signalAtTime);
      }

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
