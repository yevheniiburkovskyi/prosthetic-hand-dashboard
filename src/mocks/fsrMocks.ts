import type { DemoProfile, DemoScenario } from '@/lib/demo';
import type { Finger } from '@/types/sensorType';

export const fsrProfiles: Record<DemoScenario, DemoProfile> = {
  /** Everyday light grips; fingers regularly release to no load. */
  normal: {
    thumb: { center: 700, swing: 500, period: 6, phase: 0 }, // 200–1200
    index: { center: 600, swing: 450, period: 6.5, phase: 0.6 }, // 150–1050
    middle: { center: 500, swing: 400, period: 7, phase: 1.2 }, // 100–900
    ring: { center: 250, swing: 300, period: 7.5, phase: 1.8 }, // 0–550
    pinky: { center: 150, swing: 250, period: 8, phase: 2.4 }, // 0–400
  },

  /**
   * Fingers sit at different force levels so the cards cover the whole
   * 0–MAX_FSR_VALUE range (Light / Medium / High) at once.
   */
  states: {
    thumb: { center: 2400, swing: 900, period: 7, phase: 0 }, // 1500–3300
    index: { center: 3300, swing: 650, period: 9, phase: 1.3 }, // 2650–3950
    middle: { center: 1500, swing: 900, period: 6, phase: 2.6 }, // 600–2400
    ring: { center: 450, swing: 500, period: 8, phase: 3.9 }, // 0–950
    pinky: { center: 800, swing: 800, period: 11, phase: 5.2 }, // 0–1600
  },
};

/**
 * Unloaded reading of each simulated sensor when noise is on. Real FSRs
 * rarely read 0 at rest; calibration measures and removes this.
 */
export const FSR_REST_OFFSETS: Record<Finger, number> = {
  thumb: 140,
  index: 95,
  middle: 170,
  ring: 120,
  pinky: 60,
};
