import type { TemperatureBLEData } from '@/types/bleType';
import { TemperatureName } from '@/types/temperatureType';

export const TEMPERATURE_LIMIT = 100;
export const MAX_FSR_VALUE = 1000;

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const TEMPERATURE_THUMB_UUID = '1c95d5d3-d300-4172-bc4a-bf2436f6d532';
export const FSR_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export const INITIAL_TEMPERATURE_DATA: TemperatureBLEData = {
  [TEMPERATURE_THUMB_UUID]: {
    name: TemperatureName.THUMB,
    value: 0,
  },
  index: {
    name: TemperatureName.INDEX,
    value: 0,
  },
  middle: {
    name: TemperatureName.MIDDLE,
    value: 0,
  },
  ring: {
    name: TemperatureName.RING,
    value: 0,
  },
  pinky: {
    name: TemperatureName.PINKY,
    value: 0,
  },
};
