/**
 * BLE protocol between the dashboard and the ESP firmware.
 * Full spec and reference firmware: docs/ble-protocol.md.
 * All multi-byte values are little-endian; timestamps are ms since boot.
 */
import { SENSORS } from '@/lib/constants';
import type {
  HandReadings,
  SensorId,
  SensorKind,
  SensorReading,
} from '@/types/sensorType';

export const BLE_DEVICE_NAME = 'Prosthetic-Hand';
export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

/** Sensor data characteristics (notify). */
export const SENSOR_DATA_UUIDS: Record<SensorKind, string> = {
  temperature: '1c95d5d3-d300-4172-bc4a-bf2436f6d532',
  fsr: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
};

/** FSR corrections, app → ESP (write). Optional. */
export const CALIBRATION_UUID = '6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90';

/** Commands app → ESP (write) and device status ESP → app (notify, read). */
export const CONTROL_UUID = '6e3a1f53-8c4d-4b7a-9f21-3d5c8e7a1b90';

// ---------------------------------------------------------------------------
// Sensor data
//
// Current format, all sensors in one packet (12 bytes):
//   FSR:         [uint32 timestamp][uint16 × 4 raw values]
//   Temperature: [uint32 timestamp][int16  × 4 hundredths of °C]
// Legacy single-sensor format (still accepted, maps to Sensor 1):
//   FSR:         [uint32 timestamp][uint16]   (6 bytes)
//   Temperature: [uint32 timestamp][float32]  (8 bytes)
// ---------------------------------------------------------------------------

const TIMESTAMP_BYTES = 4;
const VALUE_BYTES = 2;
export const SENSOR_PACKET_BYTES =
  TIMESTAMP_BYTES + VALUE_BYTES * SENSORS.length;
const LEGACY_PACKET_BYTES: Record<SensorKind, number> = {
  fsr: 6,
  temperature: 8,
};

const roundTemperature = (celsius: number) => Math.round(celsius * 10) / 10;

/** Decodes a sensor packet; returns only the sensors it contains. */
export const parseSensorPacket = (
  kind: SensorKind,
  data: DataView
): Partial<HandReadings> | null => {
  const timestamp = data.getUint32(0, true);

  if (data.byteLength === SENSOR_PACKET_BYTES) {
    return Object.fromEntries(
      SENSORS.map((sensor, i) => {
        const offset = TIMESTAMP_BYTES + i * VALUE_BYTES;
        const value =
          kind === 'fsr'
            ? data.getUint16(offset, true)
            : roundTemperature(data.getInt16(offset, true) / 100);
        return [sensor, { timestamp, value } satisfies SensorReading];
      })
    );
  }

  if (data.byteLength === LEGACY_PACKET_BYTES[kind]) {
    const value =
      kind === 'fsr'
        ? data.getUint16(4, true)
        : roundTemperature(data.getFloat32(4, true));
    return { sensor1: { timestamp, value } };
  }

  console.warn(`Unexpected ${kind} packet length: ${data.byteLength}`);
  return null;
};

/** Encodes all sensors into one packet (used by the demo device). */
export const encodeSensorPacket = (
  kind: SensorKind,
  timestamp: number,
  values: Record<SensorId, number>
): ArrayBuffer => {
  const buffer = new ArrayBuffer(SENSOR_PACKET_BYTES);
  const view = new DataView(buffer);
  view.setUint32(0, timestamp >>> 0, true);
  SENSORS.forEach((sensor, i) => {
    const offset = TIMESTAMP_BYTES + i * VALUE_BYTES;
    if (kind === 'fsr') {
      view.setUint16(offset, Math.round(values[sensor]), true);
    } else {
      view.setInt16(offset, Math.round(values[sensor] * 100), true);
    }
  });
  return buffer;
};

// ---------------------------------------------------------------------------
// Calibration: one 7-byte write per sensor
//   [uint8 sensor index][int16 offset][uint16 dead band][uint16 alpha × 1000]
// offset 0, dead band 0, alpha 1000 = no correction.
// ---------------------------------------------------------------------------

export const CALIBRATION_PACKET_BYTES = 7;

export interface CorrectionParams {
  offset: number;
  deadband: number;
  /** EMA weight of the newest sample, 0 < alpha ≤ 1. */
  alpha: number;
}

export const NO_CORRECTION: CorrectionParams = {
  offset: 0,
  deadband: 0,
  alpha: 1,
};

export const encodeCorrectionPacket = (
  sensorIndex: number,
  { offset, deadband, alpha }: CorrectionParams
): ArrayBuffer => {
  const buffer = new ArrayBuffer(CALIBRATION_PACKET_BYTES);
  const view = new DataView(buffer);
  view.setUint8(0, sensorIndex);
  view.setInt16(1, offset, true);
  view.setUint16(3, deadband, true);
  view.setUint16(5, Math.round(alpha * 1000), true);
  return buffer;
};

export const decodeCorrectionPacket = (
  data: DataView
): { sensorIndex: number; correction: CorrectionParams } | null => {
  if (data.byteLength !== CALIBRATION_PACKET_BYTES) return null;
  const sensorIndex = data.getUint8(0);
  if (sensorIndex >= SENSORS.length) return null;
  const alphaMilli = Math.min(1000, Math.max(1, data.getUint16(5, true)));
  return {
    sensorIndex,
    correction: {
      offset: data.getInt16(1, true),
      deadband: data.getUint16(3, true),
      alpha: alphaMilli / 1000,
    },
  };
};

// ---------------------------------------------------------------------------
// Control: commands are 1 byte; status is 1 byte (notify on change, readable)
// ---------------------------------------------------------------------------

export const COMMANDS = {
  motorStart: 0x01,
  motorStop: 0x02,
} as const;

export type Command = keyof typeof COMMANDS;

export type MotorState = 'stopped' | 'running' | 'fault';

const MOTOR_STATE_CODES: Record<MotorState, number> = {
  stopped: 0,
  running: 1,
  fault: 2,
};

export const encodeCommand = (command: Command): ArrayBuffer =>
  Uint8Array.of(COMMANDS[command]).buffer;

export const decodeCommand = (data: DataView): Command | null => {
  if (data.byteLength < 1) return null;
  const code = data.getUint8(0);
  const match = (Object.keys(COMMANDS) as Command[]).find(
    (command) => COMMANDS[command] === code
  );
  return match ?? null;
};

export const encodeMotorStatus = (state: MotorState): ArrayBuffer =>
  Uint8Array.of(MOTOR_STATE_CODES[state]).buffer;

export const parseMotorStatus = (data: DataView): MotorState | null => {
  if (data.byteLength < 1) return null;
  const code = data.getUint8(0);
  const match = (Object.keys(MOTOR_STATE_CODES) as MotorState[]).find(
    (state) => MOTOR_STATE_CODES[state] === code
  );
  return match ?? null;
};
