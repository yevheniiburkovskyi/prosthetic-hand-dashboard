export interface SensorUnitBLEData {
  name: string;
  value: number;
}

export type SensorBLEData = Record<string, SensorUnitBLEData>;
