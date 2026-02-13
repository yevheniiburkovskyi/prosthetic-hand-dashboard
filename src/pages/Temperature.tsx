import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import clsx from 'clsx';
import { Thermometer } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { mockedTemperature } from '@/mocks/temperatureMocks';
import { TEMPERATURE_LIMIT } from '@/lib/constants';
import { ChartMode } from '@/types/chartType';

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

const getTemperatureBadge = (value: number) => {
  switch (true) {
    case value > TEMPERATURE_LIMIT:
      return <Badge variant="error" title="High" />;
    default:
      return <Badge variant="success" title="Normal" />;
  }
};

const yAxisTickFormatter = (value: number) => `${value}°C`;
const xAxisTickFormatter = (value: number) => `${value}s`;

const yAxisDomain = [0, 100];

const Temperature = () => {
  const logs = useRef<string[]>([]);

  const [isRealTimeChartRunning, setIsRealTimeChartRunning] =
    useState<boolean>(true);

  const [chartMode, setChartMode] = useState<ChartMode>(ChartMode.COMMON);

  const [chartData, setChartData] = useState([
    {
      time: 0,
      thumb: 0,
      index: 0,
      middle: 0,
      ring: 0,
      pinky: 0,
    },
  ]);

  const toggleCommonChartMode = useCallback(() => {
    setChartMode(ChartMode.COMMON);
    setIsRealTimeChartRunning((prev) => !prev);
  }, []);

  const toggleLogsChartMode = useCallback(() => {
    setChartMode(ChartMode.LOGS);
    setIsRealTimeChartRunning((prev) => !prev);
  }, []);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      if (!isRealTimeChartRunning) {
        return;
      }

      setChartData((prevData) => {
        const lastTime =
          prevData.length > 0 ? prevData[prevData.length - 1].time : 0;

        const isMoreThanALimit = prevData.length > 100;

        const measure = {
          time: Number((lastTime + 0.02).toFixed(2)),
          thumb: 20 + Math.random() * 50,
          index: 20 + Math.random() * 50,
          middle: 20 + Math.random() * 50,
          ring: 20 + Math.random() * 50,
          pinky: 20 + Math.random() * 50,
        };

        if (chartMode === ChartMode.LOGS) {
          logs.current.push(
            `Time: ${lastTime.toFixed(2)}s, Thumb: ${measure.thumb}, Index: ${measure.index}, Middle: ${measure.middle}, Ring: ${measure.ring}, Pinky: ${measure.pinky}`
          );
        }

        if (isMoreThanALimit) {
          return prevData.slice(1);
        }

        return [...prevData, measure];
      });
    }, 20);

    return () => clearInterval(interval);
  }, [chartMode, isRealTimeChartRunning]);

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
                  'border-red-500': sensor.value > TEMPERATURE_LIMIT,
                })}
              >
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-md font-semibold">{sensor.name}</p>
                    <Thermometer
                      stroke={
                        sensor.value > TEMPERATURE_LIMIT
                          ? 'var(--color-red-500)'
                          : 'currentColor'
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{sensor.value}°C</p>
                    {getTemperatureBadge(sensor.value)}
                  </div>
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
          yAxisTickFormatter={yAxisTickFormatter}
          xAxisTickFormatter={xAxisTickFormatter}
          yAxisDomain={yAxisDomain}
          chartMode={chartMode}
          toggleCommonChartMode={toggleCommonChartMode}
          toggleLogsChartMode={toggleLogsChartMode}
          isRunning={isRealTimeChartRunning}
        />
      </div>
    </>
  );
};

export default memo(Temperature);
