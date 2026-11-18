import type { Finger, SensorKind, SensorReading } from '@/types/sensorType';

export const BLE_DEVICE_NAME = 'Prosthetic-Hand';
export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

interface CharacteristicSpec {
  uuid: string;
  kind: SensorKind;
  finger: Finger;
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
    finger: 'thumb',
    parse: (data) => ({
      timestamp: data.getUint32(0, true),
      value: Math.round(data.getFloat32(4, true) * 10) / 10,
    }),
  },
  {
    // [uint32 timestamp][uint16 raw ADC value]
    uuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
    kind: 'fsr',
    finger: 'thumb',
    parse: (data) => ({
      timestamp: data.getUint32(0, true),
      value: data.getUint16(4, true),
    }),
  },
];
