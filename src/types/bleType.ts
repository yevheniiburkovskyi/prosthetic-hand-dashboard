export interface SensorUnitBLEData {
  name: string;
  value: number;
  timestamp: number; // ms from device boot (uint32 from BLE packet)
}

export type SensorBLEData = Record<string, SensorUnitBLEData>;
