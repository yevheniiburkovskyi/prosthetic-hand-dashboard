import type { FINGERS } from '@/lib/constants';

export type Finger = (typeof FINGERS)[number];

export type SensorKind = 'temperature' | 'fsr';

export interface SensorReading {
  value: number;
  /** ms since device boot (uint32 from the BLE packet) */
  timestamp: number;
}

export type HandReadings = Record<Finger, SensorReading>;

/** One chart / log row: time in seconds plus one value per finger. */
export type SensorSample = { time: number } & Record<Finger, number>;
