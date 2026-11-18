import type { Finger, HandReadings } from '@/types/sensorType';

export const TEMPERATURE_LIMIT = 100;
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
