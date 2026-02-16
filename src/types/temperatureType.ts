export interface Temperature {
  id: number;
  name: string;
  value: number;
}

export enum TemperatureName {
  THUMB = 'Thumb',
  INDEX = 'Index',
  MIDDLE = 'Middle',
  RING = 'Ring',
  PINKY = 'Pinky',
}

export interface TemperatureChartData {
  time: number;
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}
