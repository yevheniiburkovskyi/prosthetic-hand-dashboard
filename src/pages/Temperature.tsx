import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import clsx from 'clsx';
import { Thermometer } from 'lucide-react';
import { memo } from 'react';
import { TEMPERATURE_LIMIT } from '@/lib/constants';
import { useBLEContext } from '@/context/BLEContext';
import type { SensorBLEData } from '@/types/bleType';
import Logger from '@/components/Logger';
import { useSensor } from '@/hooks/useSensor';
import { FingerName, type SensorChartData } from '@/types/sensorType';

const chartConfig = {
  thumb: { label: FingerName.THUMB, color: 'var(--chart-1)' },
  index: { label: FingerName.INDEX, color: 'var(--chart-2)' },
  middle: { label: FingerName.MIDDLE, color: 'var(--chart-3)' },
  ring: { label: FingerName.RING, color: 'var(--chart-4)' },
  pinky: { label: FingerName.PINKY, color: 'var(--chart-5)' },
} satisfies ChartConfig;

const getTemperatureBadge = (value: number) => {
  return value > TEMPERATURE_LIMIT ? (
    <Badge variant="error" title="High" />
  ) : (
    <Badge variant="success" title="Normal" />
  );
};

const yAxisTickFormatter = (value: number) => `${value}°C`;
const xAxisTickFormatter = (value: number) => `${Math.round(value)}s`;

const yAxisDomain = [0, 100];

const createTemperatureMeasure = (
  sensorData: SensorBLEData
): SensorChartData => ({
  time: (sensorData['thumb']?.timestamp || 0) / 1000,
  thumb: sensorData['thumb']?.value || 0,
  index: sensorData['index']?.value || 0,
  middle: sensorData['middle']?.value || 0,
  ring: sensorData['ring']?.value || 0,
  pinky: sensorData['pinky']?.value || 0,
});

const Temperature = () => {
  const { temperatureData } = useBLEContext();

  const {
    chartData,
    logs,
    isRealTimeChartRunning,
    isLogging,
    toggleChartRunning,
    toggleLogging,
    xAxisDomain,
  } = useSensor<SensorChartData>({
    sensorData: temperatureData,
    createMeasure: createTemperatureMeasure,
  });

  return (
    <>
      <Header
        title="Temperature sensors"
        description="Temperature sensor control"
      />
      <div className="flex flex-col gap-6 overflow-auto px-6 pb-6">
        <ul className="flex w-full flex-wrap gap-4">
          {Object.values(temperatureData).map((sensor, index) => (
            <li key={`${sensor.name}-${index}`} className="flex-1">
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
          description="Real-time temperature data"
          xAxisKey="time"
          xLabel="Time (S)"
          yLabel="Temperature (°C)"
          yAxisTickFormatter={yAxisTickFormatter}
          xAxisTickFormatter={xAxisTickFormatter}
          xAxisDomain={xAxisDomain}
          yAxisDomain={yAxisDomain}
          toggleChartRunning={toggleChartRunning}
          isRunning={isRealTimeChartRunning}
        />

        <Logger
          title="Logger"
          description="Logging temperature data"
          isLogging={isLogging}
          toggleLogging={toggleLogging}
          logs={logs}
          Chart={
            <ChartLineMultiple
              data={logs}
              config={chartConfig}
              title="Temperature logs chart"
              xAxisKey="time"
              xLabel="Time (S)"
              yLabel="Temperature (°C)"
              yAxisTickFormatter={yAxisTickFormatter}
              xAxisTickFormatter={xAxisTickFormatter}
              yAxisDomain={yAxisDomain}
            />
          }
        />
      </div>
    </>
  );
};

export default memo(Temperature);
