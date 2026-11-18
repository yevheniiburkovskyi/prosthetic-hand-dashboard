import type { DemoProfile, DemoScenario } from '@/lib/demo';

export const temperatureProfiles: Record<DemoScenario, DemoProfile> = {
  /** Skin temperature, slowly drifting; everything stays "Normal". */
  normal: {
    thumb: { center: 34.5, swing: 0.8, period: 40, phase: 0 }, // 33.7–35.3
    index: { center: 33.8, swing: 1.0, period: 47, phase: 1.3 }, // 32.8–34.8
    middle: { center: 34.2, swing: 0.7, period: 36, phase: 2.6 }, // 33.5–34.9
    ring: { center: 33.2, swing: 0.9, period: 52, phase: 3.9 }, // 32.3–34.1
    pinky: { center: 32.6, swing: 1.0, period: 44, phase: 5.2 }, // 31.6–33.6
  },

  /**
   * Fingers sit at different levels so the cards cover the whole 0–100 °C
   * range (Normal / Warm / High) at once; ranges overlap so lines cross.
   */
  states: {
    thumb: { center: 36, swing: 14, period: 18, phase: 0 }, // 22–50
    index: { center: 60, swing: 18, period: 23, phase: 1.3 }, // 42–78
    middle: { center: 83, swing: 12, period: 15, phase: 2.6 }, // 71–95
    ring: { center: 18, swing: 13, period: 21, phase: 3.9 }, // 5–31
    pinky: { center: 50, swing: 30, period: 27, phase: 5.2 }, // 20–80
  },
};
