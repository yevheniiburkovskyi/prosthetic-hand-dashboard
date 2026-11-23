import {
  decodeCommand,
  decodeCorrectionPacket,
  encodeMotorStatus,
  encodeSensorPacket,
  NO_CORRECTION,
  type CorrectionParams,
  type MotorState,
} from '@/lib/ble';
import { createCorrectionFilter } from '@/lib/calibration';
import { SENSORS } from '@/lib/constants';
import {
  DEMO_INTERVAL_MS,
  getDemoReadings,
  isDemoPacketDropped,
  type DemoSettings,
} from '@/lib/demo';
import type { HandReadings, SensorId, SensorKind } from '@/types/sensorType';

/** How long the simulated motor takes to react to a command. */
const MOTOR_RESPONSE_MS = 150;

export interface DemoDeviceOptions {
  getSettings: () => DemoSettings;
  /** True while the user keeps the hand relaxed (calibration). */
  isResting: () => boolean;
  onSensorPacket: (kind: SensorKind, data: DataView) => void;
  onStatusPacket: (data: DataView) => void;
}

const valuesOf = (readings: HandReadings) =>
  Object.fromEntries(
    SENSORS.map((sensor) => [sensor, readings[sensor].value])
  ) as Record<SensorId, number>;

/**
 * Virtual ESP for demo mode. Speaks the same byte-level protocol as the
 * firmware (docs/ble-protocol.md): notifies packed sensor packets, accepts
 * calibration and control writes, and reports motor status.
 */
export const createDemoDevice = ({
  getSettings,
  isResting,
  onSensorPacket,
  onStatusPacket,
}: DemoDeviceOptions) => {
  const corrections = Object.fromEntries(
    SENSORS.map((sensor) => [sensor, NO_CORRECTION])
  ) as Record<SensorId, CorrectionParams>;
  let filter = createCorrectionFilter(corrections);
  let motor: MotorState = 'stopped';
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const notifyStatus = () =>
    onStatusPacket(new DataView(encodeMotorStatus(motor)));

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const startedAt = performance.now();
  const interval = setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const timestamp = Math.round(elapsed);
    const settings = getSettings();

    const temperature = getDemoReadings('temperature', elapsed, settings);
    onSensorPacket(
      'temperature',
      new DataView(
        encodeSensorPacket('temperature', timestamp, valuesOf(temperature))
      )
    );

    const rawFsr = getDemoReadings('fsr', elapsed, settings, {
      resting: isResting(),
    });
    // Like the firmware: correct every sample, even ones that get lost.
    const fsr = filter(rawFsr);
    if (!isDemoPacketDropped('fsr', elapsed, settings)) {
      onSensorPacket(
        'fsr',
        new DataView(encodeSensorPacket('fsr', timestamp, valuesOf(fsr)))
      );
    }
  }, DEMO_INTERVAL_MS);

  return {
    writeCalibration: async (packet: ArrayBuffer) => {
      const decoded = decodeCorrectionPacket(new DataView(packet));
      if (!decoded) throw new Error('Invalid calibration packet');
      corrections[SENSORS[decoded.sensorIndex]] = decoded.correction;
      // Firmware restarts the filter when settings change.
      filter = createCorrectionFilter(corrections);
    },

    writeControl: async (packet: ArrayBuffer) => {
      const command = decodeCommand(new DataView(packet));
      if (!command) throw new Error('Unknown command');
      const next: MotorState = command === 'motorStart' ? 'running' : 'stopped';
      // Protocol: status is notified after every command, changed or not.
      later(() => {
        motor = next;
        notifyStatus();
      }, MOTOR_RESPONSE_MS);
    },

    dispose: () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
};

export type DemoDevice = ReturnType<typeof createDemoDevice>;
