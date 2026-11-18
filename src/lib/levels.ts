import type { BadgeVariant } from '@/components/ui/badge';

/** Shared three-step scale used by sensor cards. */
export type Level = 'normal' | 'warning' | 'critical';

export interface LevelThresholds {
  /** Values above this are 'warning'. */
  warningAbove: number;
  /** Values above this are 'critical'. */
  criticalAbove: number;
}

export const getLevel = (
  value: number,
  { warningAbove, criticalAbove }: LevelThresholds
): Level => {
  if (value > criticalAbove) return 'critical';
  if (value > warningAbove) return 'warning';
  return 'normal';
};

export const LEVEL_STYLES: Record<
  Level,
  { badge: BadgeVariant; border?: string; icon: string; progress: string }
> = {
  normal: {
    badge: 'success',
    icon: 'currentColor',
    progress: 'bg-green-500',
  },
  warning: {
    badge: 'warning',
    border: 'border-yellow-500',
    icon: 'var(--color-yellow-500)',
    progress: 'bg-yellow-500',
  },
  critical: {
    badge: 'error',
    border: 'border-red-500',
    icon: 'var(--color-red-500)',
    progress: 'bg-red-500',
  },
};
