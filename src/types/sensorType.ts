import type { SENSORS } from '@/lib/constants';

export type SensorId = (typeof SENSORS)[number];

export type SensorKind = 'temperature' | 'fsr';

export interface SensorReading {
  value: number;
  /** ms since device boot (uint32 from the BLE packet) */
  timestamp: number;
}

export type HandReadings = Record<SensorId, SensorReading>;

/** One chart / log row: time in seconds plus one value per sensor. */
export type SensorSample = { time: number } & Record<SensorId, number>;
