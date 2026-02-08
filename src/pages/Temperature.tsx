import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import clsx from 'clsx';
import { Thermometer } from 'lucide-react';
import { memo } from 'react';
import { chartData, mockedTemperature } from '@/mocks/temperatureMocks';

interface Temperature {
  id: number;
  name: string;
  value: number;
}

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
