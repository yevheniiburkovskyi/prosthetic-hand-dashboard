'use client';

import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import Card from './ui/Card';

export const description = 'A multiple line chart';

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

const ChartLineMultiple = () => {
  return (
    <Card>
      <p className="text-semibold text-lg">Temperature sensors</p>
      <p className="mb-4 text-sm text-neutral-500">
        Real-time temperature data from all sensors
      </p>
      <ChartContainer config={chartConfig} className="h-[55vh] w-full">
        <LineChart accessibilityLayer data={chartData}>
          <CartesianGrid />
          <XAxis
            dataKey="time"
            tickLine={true}
            axisLine={true}
            tickMargin={3}
            tickFormatter={(value) => `${value}s`}
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            tickLine={true}
            axisLine={true}
            tickMargin={3}
            label={{
              value: 'Temperature (°C)',
              angle: -90,
              position: 'insideLeft',
            }}
            tickFormatter={(value) => `${value}°C`}
          />
          <Legend verticalAlign="top" height={30} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="thumb"
            type="monotone"
            stroke="var(--color-thumb)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="index"
            type="monotone"
            stroke="var(--color-index)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="middle"
            type="monotone"
            stroke="var(--color-middle)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="ring"
            type="monotone"
            stroke="var(--color-ring)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="pinky"
            type="monotone"
            stroke="var(--color-pinky)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
};

export default ChartLineMultiple;
