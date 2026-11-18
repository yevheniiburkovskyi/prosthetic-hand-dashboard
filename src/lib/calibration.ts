import { FINGERS } from '@/lib/constants';
import type { Finger, HandReadings } from '@/types/sensorType';

/** How long to sample the unloaded sensors when calibrating. */
export const CALIBRATION_DURATION_MS = 3000;
/** Fewer samples than this means no data source is streaming. */
export const MIN_CALIBRATION_SAMPLES = 10;
/** Noise band = observed peak deviation × margin, so idle noise stays at 0. */
const NOISE_MARGIN = 1.5;
const MIN_NOISE_THRESHOLD = 5;

export interface FingerCalibration {
  /** Mean reading with no load; subtracted from every value. */
  offset: number;
  /** Values at or below this after offset removal are treated as 0. */
  threshold: number;
}

export interface Calibration {
  fingers: Record<Finger, FingerCalibration>;
  calibratedAt: number;
}

/** Builds a zero-load calibration from raw samples taken with the hand at rest. */
export const computeCalibration = (samples: HandReadings[]): Calibration => ({
  calibratedAt: Date.now(),
  fingers: Object.fromEntries(
    FINGERS.map((finger) => {
      const values = samples.map((sample) => sample[finger].value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const peakDeviation = Math.max(...values.map((v) => Math.abs(v - mean)));

      return [
        finger,
        {
          offset: Math.round(mean),
          threshold: Math.max(
            MIN_NOISE_THRESHOLD,
            Math.ceil(peakDeviation * NOISE_MARGIN)
          ),
        },
      ];
    })
  ) as Record<Finger, FingerCalibration>,
});

/** Removes the resting offset and zeroes values inside the noise band. */
export const applyCalibration = (
  readings: HandReadings,
  calibration: Calibration
): HandReadings =>
  Object.fromEntries(
    FINGERS.map((finger) => {
      const { offset, threshold } = calibration.fingers[finger];
      const reading = readings[finger];
      const value = reading.value - offset;

      return [finger, { ...reading, value: value <= threshold ? 0 : value }];
    })
  ) as HandReadings;
