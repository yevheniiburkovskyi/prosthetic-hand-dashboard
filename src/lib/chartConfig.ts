import type { ChartConfig } from '@/components/ui/chart';
import { SENSOR_LABELS, SENSORS } from '@/lib/constants';
import type { SensorId } from '@/types/sensorType';

export const SENSOR_CHART_CONFIG = Object.fromEntries(
  SENSORS.map((sensor, i) => [
    sensor,
    { label: SENSOR_LABELS[sensor], color: `var(--chart-${i + 1})` },
  ])
) as Record<SensorId, { label: string; color: string }> satisfies ChartConfig;

/** Single-line config per sensor, for per-sensor charts. Stable references. */
export const SINGLE_SENSOR_CHART_CONFIG = Object.fromEntries(
  SENSORS.map((sensor) => [sensor, { [sensor]: SENSOR_CHART_CONFIG[sensor] }])
) as Record<SensorId, ChartConfig>;

export const formatSecondsTick = (value: number) => `${Math.round(value)}s`;
