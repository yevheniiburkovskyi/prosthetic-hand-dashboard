export interface TemperatureUnitBLEData {
  name: string;
  value: number;
}

export type TemperatureBLEData = Record<string, TemperatureUnitBLEData>;
