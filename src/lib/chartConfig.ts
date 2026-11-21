import type { ChartConfig } from '@/components/ui/chart';
import { FINGER_LABELS, FINGERS } from '@/lib/constants';
import type { Finger } from '@/types/sensorType';

export const FINGER_CHART_CONFIG = {
  thumb: { label: FINGER_LABELS.thumb, color: 'var(--chart-1)' },
  index: { label: FINGER_LABELS.index, color: 'var(--chart-2)' },
  middle: { label: FINGER_LABELS.middle, color: 'var(--chart-3)' },
  ring: { label: FINGER_LABELS.ring, color: 'var(--chart-4)' },
  pinky: { label: FINGER_LABELS.pinky, color: 'var(--chart-5)' },
} satisfies ChartConfig;

/** Single-line config per finger, for per-sensor charts. Stable references. */
export const SINGLE_FINGER_CHART_CONFIG = Object.fromEntries(
  FINGERS.map((finger) => [finger, { [finger]: FINGER_CHART_CONFIG[finger] }])
) as Record<Finger, ChartConfig>;

export const formatSecondsTick = (value: number) => `${Math.round(value)}s`;
