import type { LevelThresholds } from '@/lib/levels';
import type { SensorId, HandReadings } from '@/types/sensorType';

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

export const SENSORS = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const;

export const SENSOR_LABELS: Record<SensorId, string> = {
  sensor1: 'Sensor 1',
  sensor2: 'Sensor 2',
  sensor3: 'Sensor 3',
  sensor4: 'Sensor 4',
};

const EMPTY_READING = { value: 0, timestamp: 0 };

export const EMPTY_READINGS = Object.fromEntries(
  SENSORS.map((sensor) => [sensor, EMPTY_READING])
) as HandReadings;
