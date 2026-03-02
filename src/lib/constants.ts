import type { SensorBLEData } from '@/types/bleType';
import { FingerName } from '@/types/sensorType';

export const TEMPERATURE_LIMIT = 100;
export const MAX_FSR_VALUE = 4050;

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const TEMPERATURE_THUMB_UUID = '1c95d5d3-d300-4172-bc4a-bf2436f6d532';
export const FSR_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export const INITIAL_SENSOR_DATA: SensorBLEData = {
  thumb: {
    name: FingerName.THUMB,
    value: 0,
    timestamp: 0,
  },
  index: {
    name: FingerName.INDEX,
    value: 0,
    timestamp: 0,
  },
  middle: {
    name: FingerName.MIDDLE,
    value: 0,
    timestamp: 0,
  },
  ring: {
    name: FingerName.RING,
    value: 0,
    timestamp: 0,
  },
  pinky: {
    name: FingerName.PINKY,
    value: 0,
    timestamp: 0,
  },
};
