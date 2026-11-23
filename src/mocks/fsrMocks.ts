import type { DemoProfile, DemoScenario } from '@/lib/demo';
import type { SensorId } from '@/types/sensorType';

export const fsrProfiles: Record<DemoScenario, DemoProfile> = {
  /** Everyday light grips; sensors regularly release to no load. */
  normal: {
    sensor1: { center: 700, swing: 500, period: 6, phase: 0 }, // 200–1200
    sensor2: { center: 600, swing: 450, period: 6.5, phase: 0.6 }, // 150–1050
    sensor3: { center: 500, swing: 400, period: 7, phase: 1.2 }, // 100–900
    sensor4: { center: 250, swing: 300, period: 7.5, phase: 1.8 }, // 0–550
  },

  /**
   * Sensors sit at different force levels so the cards cover the whole
   * 0–MAX_FSR_VALUE range (Light / Medium / High) at once. Each also has a
   * measurement fault so signal analysis shows every verdict: sensor 1 is
   * clean (Stable), the others show deviations or errors. Excess noise is
   * shown with the separate "Sensor noise" toggle.
   */
  states: {
    sensor1: { center: 2400, swing: 900, period: 7, phase: 0 }, // 1500–3300
    sensor2: {
      center: 3300,
      swing: 650,
      period: 9,
      phase: 1.3,
      fault: 'spikes',
    }, // 2650–3950
    sensor3: {
      center: 800,
      swing: 800,
      period: 11,
      phase: 2.6,
      fault: 'stuck',
    }, // 0–1600, freezes 3 s of every 12 s
    sensor4: {
      center: 450,
      swing: 500,
      period: 8,
      phase: 3.9,
      fault: 'saturation',
    }, // 0–950, ×5 → clips at max
  },
};

/**
 * Unloaded reading of each simulated sensor when noise is on. Real FSRs
 * rarely read 0 at rest; calibration measures and removes this.
 */
export const FSR_REST_OFFSETS: Record<SensorId, number> = {
  sensor1: 140,
  sensor2: 95,
  sensor3: 170,
  sensor4: 120,
};
