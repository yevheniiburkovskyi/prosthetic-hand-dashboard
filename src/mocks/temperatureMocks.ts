import type { DemoProfile } from '@/lib/demo';

/**
 * Fingers sit at different levels so the cards cover the whole 0–100 °C
 * range at once, with overlapping ranges so lines occasionally cross.
 */
export const temperatureProfile: DemoProfile = {
  thumb: { center: 36, swing: 14, period: 18, phase: 0 }, //  22–50 °C
  index: { center: 60, swing: 18, period: 23, phase: 1.3 }, // 42–78 °C
  middle: { center: 83, swing: 12, period: 15, phase: 2.6 }, // 71–95 °C
  ring: { center: 18, swing: 13, period: 21, phase: 3.9 }, //  5–31 °C
  pinky: { center: 50, swing: 30, period: 27, phase: 5.2 }, // 20–80 °C
};
