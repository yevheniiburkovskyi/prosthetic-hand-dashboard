import type { LevelThresholds } from '@/lib/levels';
import type { Finger, HandReadings } from '@/types/sensorType';

/** °C: ≤40 Normal, 40–45 Warm, >45 High. */
export const TEMPERATURE_THRESHOLDS: LevelThresholds = {
  warningAbove: 40,
  criticalAbove: 45,
};

/** Raw FSR value: ≤1500 Light, 1500–3000 Medium, >3000 High. */
export const FSR_THRESHOLDS: LevelThresholds = {
  warningAbove: 1500,
  criticalAbove: 3000,
};
export const MAX_FSR_VALUE = 4050;

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

export const FINGER_LABELS: Record<Finger, string> = {
  thumb: 'Thumb',
  index: 'Index',
  middle: 'Middle',
  ring: 'Ring',
  pinky: 'Pinky',
};

const EMPTY_READING = { value: 0, timestamp: 0 };

export const EMPTY_READINGS: HandReadings = {
  thumb: EMPTY_READING,
  index: EMPTY_READING,
  middle: EMPTY_READING,
  ring: EMPTY_READING,
  pinky: EMPTY_READING,
};
