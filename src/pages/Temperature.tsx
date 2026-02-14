import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import clsx from 'clsx';
import { Thermometer } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { TEMPERATURE_LIMIT, TEMPERATURE_THUMB_UUID } from '@/lib/constants';
import { ChartMode } from '@/types/chartType';
import { TemperatureName } from '@/types/temperatureType';
import { useBLEContext } from '@/context/BLEContext';

const chartConfig = {
  thumb: {
    label: TemperatureName.THUMB,
    color: 'var(--chart-1)',
  },
  index: {
    label: TemperatureName.INDEX,
    color: 'var(--chart-2)',
  },
  middle: {
    label: TemperatureName.MIDDLE,
    color: 'var(--chart-3)',
  },
  ring: {
    label: TemperatureName.RING,
    color: 'var(--chart-4)',
  },
  pinky: {
    label: TemperatureName.PINKY,
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
  const { temperatureData } = useBLEContext();

  const logs = useRef<string[]>([]);

  const [isRealTimeChartRunning, setIsRealTimeChartRunning] =
    useState<boolean>(true);

  const [chartMode, setChartMode] = useState<ChartMode>(ChartMode.COMMON);

  const [chartData, setChartData] = useState([
    {
      time: 0,
      thumb: temperatureData[TEMPERATURE_THUMB_UUID].value,
      index: temperatureData['index'].value,
      middle: temperatureData['middle'].value,
      ring: temperatureData['ring'].value,
      pinky: temperatureData['pinky'].value,
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

  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRealTimeChartRunning) {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    setChartData((prevData) => {
      const currentTime = (Date.now() - startTimeRef.current!) / 1000;

      const measure = {
        time: Number(currentTime.toFixed(2)),
        thumb: temperatureData[TEMPERATURE_THUMB_UUID]?.value || 0,
        index: temperatureData['index']?.value || 0,
        middle: temperatureData['middle']?.value || 0,
        ring: temperatureData['ring']?.value || 0,
        pinky: temperatureData['pinky']?.value || 0,
      };

      if (chartMode === ChartMode.LOGS) {
        logs.current.push(
          `Time: ${measure.time}s, T: ${measure.thumb}, I: ${measure.index}`
        );
      }

      const newData = [...prevData, measure];

      if (newData.length > 100) {
        return newData.slice(-100);
      }

      return newData;
    });
  }, [isRealTimeChartRunning, temperatureData, chartMode]);

  return (
    <>
      <Header
        title="Temperature sensors"
        description="Temperature sensor control"
      />
      <div className="overflow-auto px-6">
        <ul className="mb-4 flex w-full flex-wrap gap-4">
          {Object.values(temperatureData).map((sensor) => (
            <li key={sensor.name} className="flex-1">
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
