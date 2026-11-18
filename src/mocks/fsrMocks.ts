import type { DemoProfile } from '@/lib/demo';

/**
 * Fingers sit at different force levels so the cards cover the whole
 * 0–MAX_FSR_VALUE range at once. FSR changes faster than temperature.
 */
export const fsrProfile: DemoProfile = {
  thumb: { center: 2400, swing: 900, period: 7, phase: 0 }, // 1500–3300
  index: { center: 3300, swing: 650, period: 9, phase: 1.3 }, // 2650–3950
  middle: { center: 1500, swing: 900, period: 6, phase: 2.6 }, //  600–2400
  ring: { center: 600, swing: 500, period: 8, phase: 3.9 }, //  100–1100
  pinky: { center: 900, swing: 800, period: 11, phase: 5.2 }, //  100–1700
};
