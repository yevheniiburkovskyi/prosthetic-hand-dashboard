import type { SensorId, SensorKind, SensorReading } from '@/types/sensorType';

export const BLE_DEVICE_NAME = 'Prosthetic-Hand';
export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

interface CharacteristicSpec {
  uuid: string;
  kind: SensorKind;
  sensor: SensorId;
  parse: (data: DataView) => SensorReading;
}

/**
 * Characteristics exposed by the ESP firmware. Every packet is little-endian
 * and starts with a uint32 timestamp (ms since device boot).
 */
export const SENSOR_CHARACTERISTICS: CharacteristicSpec[] = [
  {
    // [uint32 timestamp][float32 °C]
    uuid: '1c95d5d3-d300-4172-bc4a-bf2436f6d532',
    kind: 'temperature',
    sensor: 'sensor1',
    parse: (data) => ({
      timestamp: data.getUint32(0, true),
      value: Math.round(data.getFloat32(4, true) * 10) / 10,
    }),
  },
  {
    // [uint32 timestamp][uint16 raw ADC value]
    uuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
    kind: 'fsr',
    sensor: 'sensor1',
    parse: (data) => ({
      timestamp: data.getUint32(0, true),
      value: data.getUint16(4, true),
    }),
  },
];

/**
 * Write-only characteristic the app uses to send FSR corrections to the ESP
 * (see docs/esp-calibration.md). Optional: older firmware without it falls
 * back to filtering in the app.
 */
export const FSR_CALIBRATION_UUID = '6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90';

/** Packet size of one sensor's correction. */
export const CALIBRATION_PACKET_BYTES = 7;

/**
 * One sensor's correction, little-endian:
 * [uint8 sensor index][int16 offset][uint16 dead band][uint16 alpha × 1000]
 * Alpha 1000 with offset 0 and dead band 0 disables correction.
 */
export const encodeCorrectionPacket = (
  sensorIndex: number,
  {
    offset,
    deadband,
    alpha,
  }: { offset: number; deadband: number; alpha: number }
): ArrayBuffer => {
  const buffer = new ArrayBuffer(CALIBRATION_PACKET_BYTES);
  const view = new DataView(buffer);
  view.setUint8(0, sensorIndex);
  view.setInt16(1, offset, true);
  view.setUint16(3, deadband, true);
  view.setUint16(5, Math.round(alpha * 1000), true);
  return buffer;
};
