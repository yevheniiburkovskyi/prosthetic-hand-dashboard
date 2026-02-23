import Header from '@/components/Header';
import ChartLineMultiple from '@/components/ChartLineMultiple';
import Card from '@/components/ui/Card';
import type { ChartConfig } from '@/components/ui/chart';
import { Gauge } from 'lucide-react';
import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { MAX_FSR_VALUE, FSR_CHARACTERISTIC_UUID } from '@/lib/constants';
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

const yAxisTickFormatter = (value: number) => `${value}`;
const xAxisTickFormatter = (value: number) => `${Math.round(value)}s`;

const yAxisDomain = [0, MAX_FSR_VALUE];

const createFSRMeasure = (
  sensorData: SensorBLEData,
  currentTime: number
): SensorChartData => ({
  time: currentTime,
  thumb: sensorData[FSR_CHARACTERISTIC_UUID]?.value || 0,
  index: sensorData['index']?.value || 0,
  middle: sensorData['middle']?.value || 0,
  ring: sensorData['ring']?.value || 0,
  pinky: sensorData['pinky']?.value || 0,
});

const FSR = () => {
  const { fsrData } = useBLEContext();

  const {
    chartData,
    logs,
    isRealTimeChartRunning,
    isLogging,
    toggleChartRunning,
    toggleLogging,
    xAxisDomain,
  } = useSensor<SensorChartData>({
    sensorData: fsrData,
    createMeasure: createFSRMeasure,
  });

  return (
    <>
      <Header title="FSR sensors" description="FSR sensor control" />
      <div className="flex flex-col gap-6 overflow-auto px-6 pb-6">
        <ul className="flex w-full flex-wrap gap-4">
          {Object.values(fsrData).map((sensor) => (
            <li key={sensor.name} className="flex-1">
              <Card>
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-md font-semibold">{sensor.name}</p>
                    <Gauge />
                  </div>
                  <div>
                    <p className="mb-2 text-2xl font-bold">{sensor.value}</p>
                    <Progress value={(sensor.value / MAX_FSR_VALUE) * 100} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <ChartLineMultiple
          data={chartData}
          config={chartConfig}
          title="FSR sensors"
          description="Real-time FSR data"
          xAxisKey="time"
          xLabel="Time (S)"
          yLabel="FSR Value"
          yAxisTickFormatter={yAxisTickFormatter}
          xAxisTickFormatter={xAxisTickFormatter}
          xAxisDomain={xAxisDomain}
          yAxisDomain={yAxisDomain}
          toggleChartRunning={toggleChartRunning}
          isRunning={isRealTimeChartRunning}
        />

        <Logger
          title="Logger"
          description="Logging FSR data"
          isLogging={isLogging}
          toggleLogging={toggleLogging}
          logs={logs}
          Chart={
            <ChartLineMultiple
              data={logs}
              config={chartConfig}
              title="FSR logs chart"
              xAxisKey="time"
              xLabel="Time (S)"
              yLabel="FSR Value"
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

export default memo(FSR);
