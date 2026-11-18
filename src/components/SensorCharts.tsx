import type { AxisDomain } from 'recharts/types/util/types';
import ChartLineMultiple from './ChartLineMultiple';
import Logger from './Logger';
import type { ChartConfig } from './ui/chart';
import { useSensor } from '@/hooks/useSensor';
import { FINGER_LABELS } from '@/lib/constants';
import type { SensorKind } from '@/types/sensorType';

const chartConfig = {
  thumb: { label: FINGER_LABELS.thumb, color: 'var(--chart-1)' },
  index: { label: FINGER_LABELS.index, color: 'var(--chart-2)' },
  middle: { label: FINGER_LABELS.middle, color: 'var(--chart-3)' },
  ring: { label: FINGER_LABELS.ring, color: 'var(--chart-4)' },
  pinky: { label: FINGER_LABELS.pinky, color: 'var(--chart-5)' },
} satisfies ChartConfig;

const formatSecondsTick = (value: number) => `${Math.round(value)}s`;

interface Props {
  kind: SensorKind;
  /** Card title prefix, e.g. "Temperature sensors". */
  title: string;
  /** Used in descriptions, e.g. "Real-time {dataLabel} data". */
  dataLabel: string;
  yLabel: string;
  /** Must be referentially stable so the memoized log chart can skip renders. */
  yAxisDomain: AxisDomain;
  yAxisTickFormatter?: (value: number) => string;
}

/** Real-time chart plus logger for one sensor kind. */
const SensorCharts = ({
  kind,
  title,
  dataLabel,
  yLabel,
  yAxisDomain,
  yAxisTickFormatter,
}: Props) => {
  const {
    chartData,
    logs,
    isChartRunning,
    isLogging,
    toggleChartRunning,
    toggleLogging,
    xAxisDomain,
  } = useSensor(kind);

  const sharedChartProps = {
    config: chartConfig,
    xAxisKey: 'time',
    xLabel: 'Time (s)',
    yLabel,
    xAxisTickFormatter: formatSecondsTick,
    yAxisTickFormatter,
    yAxisDomain,
  };

  return (
    <>
      <ChartLineMultiple
        {...sharedChartProps}
        data={chartData}
        title={title}
        description={`Real-time ${dataLabel} data`}
        xAxisDomain={xAxisDomain}
        toggleChartRunning={toggleChartRunning}
        isRunning={isChartRunning}
      />

      <Logger
        title="Logger"
        description={`Logging ${dataLabel} data`}
        isLogging={isLogging}
        toggleLogging={toggleLogging}
        logs={logs}
        chart={
          <ChartLineMultiple
            {...sharedChartProps}
            data={logs}
            title={`${title} logs chart`}
          />
        }
      />
    </>
  );
};

export default SensorCharts;
