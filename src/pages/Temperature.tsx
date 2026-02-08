import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import clsx from 'clsx';
import { Thermometer } from 'lucide-react';
import { memo } from 'react';

interface Temperature {
  id: number;
  name: string;
  value: number;
}

const mockedTemperature = [
  {
    id: 1,
    name: 'Thumb',
    value: 22.5,
  },
  {
    id: 2,
    name: 'Index',
    value: 23.0,
  },
  {
    id: 3,
    name: 'Middle',
    value: 22.8,
  },
  {
    id: 4,
    name: 'Ring',
    value: 23.2,
  },
  {
    id: 5,
    name: 'Pinky',
    value: 22.7,
  },
];

const chartData = [
  {
    time: 0,
    thumb: 34.5,
    index: 36.0,
    middle: 37.5,
    ring: 39.0,
    pinky: 40.5,
  },
  {
    time: 1,
    thumb: 34.7,
    index: 36.2,
    middle: 37.7,
    ring: 39.2,
    pinky: 40.7,
  },
  {
    time: 2,
    thumb: 34.8,
    index: 36.1,
    middle: 37.6,
    ring: 39.1,
    pinky: 40.6,
  },
  {
    time: 3,
    thumb: 34.6,
    index: 36.3,
    middle: 37.8,
    ring: 39.3,
    pinky: 40.8,
  },
  {
    time: 4,
    thumb: 34.9,
    index: 36.0,
    middle: 37.4,
    ring: 38.9,
    pinky: 40.4,
  },
  {
    time: 5,
    thumb: 35.0,
    index: 36.4,
    middle: 37.9,
    ring: 39.4,
    pinky: 40.9,
  },
  {
    time: 6,
    thumb: 35.1,
    index: 36.5,
    middle: 38.0,
    ring: 39.5,
    pinky: 41.0,
  },
  {
    time: 7,
    thumb: 35.2,
    index: 36.6,
    middle: 38.1,
    ring: 39.6,
    pinky: 41.1,
  },
  {
    time: 8,
    thumb: 35.3,
    index: 36.7,
    middle: 38.2,
    ring: 39.7,
    pinky: 41.2,
  },
  {
    time: 9,
    thumb: 35.4,
    index: 36.8,
    middle: 38.3,
    ring: 39.8,
    pinky: 41.3,
  },
  {
    time: 10,
    thumb: 35.5,
    index: 36.9,
    middle: 38.4,
    ring: 39.9,
    pinky: 41.4,
  },
  {
    time: 11,
    thumb: 35.6,
    index: 37.0,
    middle: 38.5,
    ring: 40.0,
    pinky: 41.5,
  },
  {
    time: 12,
    thumb: 35.7,
    index: 37.1,
    middle: 38.6,
    ring: 40.1,
    pinky: 41.6,
  },
  {
    time: 13,
    thumb: 35.8,
    index: 37.0,
    middle: 38.5,
    ring: 40.0,
    pinky: 41.5,
  },
  {
    time: 14,
    thumb: 35.9,
    index: 36.9,
    middle: 38.4,
    ring: 39.9,
    pinky: 41.4,
  },
  {
    time: 15,
    thumb: 36.0,
    index: 36.8,
    middle: 38.3,
    ring: 39.8,
    pinky: 41.3,
  },
  {
    time: 16,
    thumb: 35.9,
    index: 36.7,
    middle: 38.2,
    ring: 39.7,
    pinky: 41.2,
  },
  {
    time: 17,
    thumb: 35.8,
    index: 36.6,
    middle: 38.1,
    ring: 39.6,
    pinky: 41.1,
  },
  {
    time: 18,
    thumb: 35.7,
    index: 36.5,
    middle: 38.0,
    ring: 39.5,
    pinky: 41.0,
  },
  {
    time: 19,
    thumb: 35.6,
    index: 36.4,
    middle: 37.9,
    ring: 39.4,
    pinky: 40.9,
  },
  {
    time: 20,
    thumb: 35.5,
    index: 36.3,
    middle: 37.8,
    ring: 39.3,
    pinky: 40.8,
  },
  {
    time: 21,
    thumb: 35.4,
    index: 36.2,
    middle: 37.7,
    ring: 39.2,
    pinky: 40.7,
  },
  {
    time: 22,
    thumb: 35.3,
    index: 36.1,
    middle: 37.6,
    ring: 39.1,
    pinky: 40.6,
  },
  {
    time: 23,
    thumb: 35.2,
    index: 36.0,
    middle: 37.5,
    ring: 39.0,
    pinky: 40.5,
  },
];

const chartConfig = {
  thumb: {
    label: 'Thumb',
    color: 'var(--chart-1)',
  },
  index: {
    label: 'Index',
    color: 'var(--chart-2)',
  },
  middle: {
    label: 'Middle',
    color: 'var(--chart-3)',
  },
  ring: {
    label: 'Ring',
    color: 'var(--chart-4)',
  },
  pinky: {
    label: 'Pinky',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const NORMAL_TEMPERATURE_LIMIT = 23;

const getTemperatureBadge = (value: number) => {
  switch (true) {
    case value > NORMAL_TEMPERATURE_LIMIT:
      return <Badge variant="error" title="High" />;
    default:
      return <Badge variant="success" title="Normal" />;
  }
};

const Temperature = () => {
  return (
    <>
      <Header
        title="Temperature sensors"
        description="Temperature sensor control"
      />
      <div className="overflow-auto px-6">
        <ul className="mb-4 flex w-full flex-wrap gap-4">
          {mockedTemperature.map((sensor) => (
            <li key={sensor.id} className="flex-1">
              <Card
                className={clsx({
                  'border-red-500': sensor.value > NORMAL_TEMPERATURE_LIMIT,
                })}
              >
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-md font-semibold">{sensor.name}</p>
                    <Thermometer
                      stroke={
                        sensor.value > NORMAL_TEMPERATURE_LIMIT
                          ? 'var(--color-red-500)'
                          : 'currentColor'
                      }
                    />
                  </div>
                  <p className="text-2xl font-bold">{sensor.value}°C</p>
                  {getTemperatureBadge(sensor.value)}
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <ChartLineMultiple
          data={chartData}
          config={chartConfig}
          title="Temperature sensors"
          description="Real-time temperature data from all sensors"
          xAxisKey="time"
          xLabel="Time"
          yLabel="Temperature (°C)"
          yAxisTickFormatter={(value) => `${value}°C`}
          xAxisTickFormatter={(value) => `${value}s`}
        />
      </div>
    </>
  );
};

export default memo(Temperature);
