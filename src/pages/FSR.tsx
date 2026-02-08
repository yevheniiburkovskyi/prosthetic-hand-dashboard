import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';

import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import { Gauge } from 'lucide-react';
import { memo } from 'react';
import { chartData, mockedFSR } from '@/mocks/fsrMocks';
import { Progress } from '@/components/ui/progress';
import { MAX_FSR_VALUE } from '@/lib/constants';

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

const FSR = () => {
  return (
    <>
      <Header title="FSR sensors" description="FSR sensor control" />
      <div className="overflow-auto px-6">
        <ul className="mb-4 flex w-full flex-wrap gap-4">
          {mockedFSR.map((sensor) => (
            <li key={sensor.id} className="flex-1">
              <Card>
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-md font-semibold">{sensor.name}</p>
                    <Gauge />
                  </div>
                  <p className="text-2xl font-bold">{sensor.value}</p>
                  <Progress value={(sensor.value / MAX_FSR_VALUE) * 100} />
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <ChartLineMultiple
          data={chartData}
          config={chartConfig}
          title="FSR sensors"
          description="Real-time FSR data from all sensors"
          xAxisKey="time"
          xLabel="Time"
          yLabel="FSR Value"
          xAxisTickFormatter={(value) => `${value}s`}
        />
      </div>
    </>
  );
};

export default memo(FSR);
