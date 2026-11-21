import { FINGERS, MAX_FSR_VALUE } from '@/lib/constants';
import { SATURATION_LEVEL, TOLERANCE_PERCENT } from '@/lib/signalAnalysis';
import type { Finger, HandReadings } from '@/types/sensorType';

/** How long to sample the unloaded sensors when calibrating. */
export const CALIBRATION_DURATION_MS = 3000;
/** Fewer samples than this means no data source is streaming. */
export const MIN_CALIBRATION_SAMPLES = 10;

/** Aim below the analysis tolerance so filtered signals pass with margin. */
const TARGET_NOISE_PERCENT = TOLERANCE_PERCENT * 0.75;
/** Stronger smoothing than this makes the signal too sluggish to be useful. */
const MIN_ALPHA = 0.1;
/** Dead band at rest, in standard deviations of the filtered noise. */
const DEADBAND_SIGMAS = 4;
const MIN_DEADBAND = 5;

/**
 * Per-sensor correction. Applied in this order (on the ESP, or in the app as
 * a fallback): subtract offset → EMA filter → subtract dead band, clamp ≥ 0.
 */
export interface FingerCorrection {
  /** Mean reading with no load. */
  offset: number;
  /** EMA weight of the newest sample, 0 < alpha ≤ 1 (1 = no smoothing). */
  alpha: number;
  /** Residual noise at rest removed after filtering. */
  deadband: number;
  /** Measured noise at rest, ±% of range (2σ). */
  noiseBeforePercent: number;
  /** Expected noise after the EMA filter, ±% of range (2σ). */
  noiseAfterPercent: number;
}

export type CorrectionTarget = 'device' | 'demo-device' | 'app';

export interface Calibration {
  fingers: Record<Finger, FingerCorrection>;
  calibratedAt: number;
  /** Typical time between samples during calibration, ms. */
  sampleIntervalMs: number;
  /** Where the correction runs. */
  appliedOn: CorrectionTarget;
}

const noisePercent = (std: number, range: number) => ((2 * std) / range) * 100;

/** EMA output noise for white input noise: σ_out = σ_in·√(α / (2 − α)). */
const emaNoiseFactor = (alpha: number) => Math.sqrt(alpha / (2 - alpha));

/** Weakest smoothing that brings `std` down to `targetStd`. */
const alphaFor = (std: number, targetStd: number) => {
  if (std <= targetStd) return 1;
  const r2 = (targetStd / std) ** 2;
  return Math.max(MIN_ALPHA, (2 * r2) / (1 + r2));
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
};

/** Builds a correction from raw samples taken with the hand at rest. */
export const computeCalibration = (
  samples: HandReadings[],
  range = MAX_FSR_VALUE
): Omit<Calibration, 'appliedOn'> => {
  const targetStd = ((TARGET_NOISE_PERCENT / 100) * range) / 2;
  const timestamps = samples.map((s) =>
    Math.max(...FINGERS.map((f) => s[f].timestamp))
  );
  const intervals = timestamps
    .slice(1)
    .map((t, i) => t - timestamps[i])
    .filter((dt) => dt > 0);

  return {
    calibratedAt: Date.now(),
    sampleIntervalMs: median(intervals) || 100,
    fingers: Object.fromEntries(
      FINGERS.map((finger) => {
        const values = samples.map((sample) => sample[finger].value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const std = Math.sqrt(
          values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
        );
        const alpha = alphaFor(std, targetStd);
        const stdAfter = std * emaNoiseFactor(alpha);

        const correction: FingerCorrection = {
          offset: Math.round(mean),
          alpha: Math.round(alpha * 1000) / 1000,
          deadband: Math.max(
            MIN_DEADBAND,
            Math.ceil(DEADBAND_SIGMAS * stdAfter)
          ),
          noiseBeforePercent: noisePercent(std, range),
          noiseAfterPercent: noisePercent(stdAfter, range),
        };
        return [finger, correction];
      })
    ) as Record<Finger, FingerCorrection>,
  };
};

/** Time for the EMA to cover ~63% of a step change, in ms. */
export const responseTimeMs = (alpha: number, sampleIntervalMs: number) =>
  alpha >= 1 ? 0 : (sampleIntervalMs * (1 - alpha)) / alpha;

/**
 * Stateful correction filter: offset → EMA → dead band. Saturated raw
 * readings pass through as the range maximum so clipping is never hidden.
 * This is the reference implementation the ESP firmware mirrors
 * (docs/esp-calibration.md).
 */
export const createCorrectionFilter = (
  fingers: Record<Finger, FingerCorrection>,
  range = MAX_FSR_VALUE
) => {
  const state: Partial<Record<Finger, number>> = {};
  const saturation = range * SATURATION_LEVEL;

  return (readings: HandReadings): HandReadings =>
    Object.fromEntries(
      FINGERS.map((finger) => {
        const { offset, alpha, deadband } = fingers[finger];
        const raw = readings[finger].value;
        const input = raw - offset;
        const previous = state[finger];
        const filtered =
          previous === undefined
            ? input
            : previous + alpha * (input - previous);
        state[finger] = filtered;

        return [
          finger,
          {
            ...readings[finger],
            value:
              raw >= saturation
                ? range
                : Math.round(Math.max(0, filtered - deadband)),
          },
        ];
      })
    ) as HandReadings;
};
