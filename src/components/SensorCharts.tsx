import type { AxisDomain } from 'recharts/types/util/types';
import ChartLineMultiple from './ChartLineMultiple';
import Logger from './Logger';
import { useBLEContext } from '@/context/BLEContext';
import type { ComponentProps } from 'react';
import { useScrollingWindow } from '@/hooks/useScrollingWindow';
import { CHART_WINDOW_SECONDS, useSensor } from '@/hooks/useSensor';
import { SENSOR_CHART_CONFIG, formatSecondsTick } from '@/lib/chartConfig';
import type { SensorKind, SensorSample } from '@/types/sensorType';

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

/**
 * Real-time chart plus logger for one sensor kind. Remounts when the data
 * source changes so demo and device samples never end up in the same log.
 */
const SensorCharts = (props: Props) => {
  const { isDemoMode } = useBLEContext();
  return (
    <SensorChartsContent key={isDemoMode ? 'demo' : 'device'} {...props} />
  );
};

/**
 * Owns the per-frame scrolling so only this chart re-renders at display
 * refresh rate, not the logger or the rest of the page.
 */
const RealtimeChart = (
  props: Omit<
    ComponentProps<typeof ChartLineMultiple>,
    'xAxisDomain' | 'data'
  > & {
    data: SensorSample[];
  }
) => {
  const xAxisDomain = useScrollingWindow(
    props.data.at(-1)?.time,
    CHART_WINDOW_SECONDS,
    !!props.isRunning
  );

  return <ChartLineMultiple {...props} xAxisDomain={xAxisDomain} />;
};

const SensorChartsContent = ({
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
  } = useSensor(kind);

  const sharedChartProps = {
    config: SENSOR_CHART_CONFIG,
    xAxisKey: 'time',
    xLabel: 'Time (s)',
    yLabel,
    xAxisTickFormatter: formatSecondsTick,
    yAxisTickFormatter,
    yAxisDomain,
  };

  return (
    <>
      <RealtimeChart
        {...sharedChartProps}
        data={chartData}
        title={title}
        description={`Real-time ${dataLabel} data`}
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
