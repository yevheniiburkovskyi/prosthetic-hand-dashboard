export enum FingerName {
  THUMB = 'Thumb',
  INDEX = 'Index',
  MIDDLE = 'Middle',
  RING = 'Ring',
  PINKY = 'Pinky',
}

export interface Sensor {
  id: number;
  name: string;
  value: number;
}

export interface SensorChartData {
  [key: string]: number;
  time: number;
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}
