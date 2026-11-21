import { memo, type ReactNode } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type XAxisProps,
  type YAxisProps,
} from 'recharts';
import type { AxisDomain } from 'recharts/types/util/types';
import { Pause, Play } from 'lucide-react';

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import Card from './ui/Card';
import { Button } from './ui/button';

interface ChartLineMultipleProps {
  data: object[];
  config: ChartConfig;
  title?: string;
  description?: string;
  xAxisKey?: string;
  xLabel: string;
  yLabel: string;
  xAxisTickFormatter?: XAxisProps['tickFormatter'];
  yAxisTickFormatter?: YAxisProps['tickFormatter'];
  xAxisDomain?: AxisDomain;
  yAxisDomain?: AxisDomain;
  toggleChartRunning?: () => void;
  isRunning?: boolean;
  /** Sizing for the plot area; defaults to a tall single chart. */
  chartClassName?: string;
  showLegend?: boolean;
  /** Rendered in the header, e.g. a status badge. */
  badge?: ReactNode;
  /** Recharts elements drawn inside the chart (ReferenceArea, …). */
  overlays?: ReactNode;
  /** Rendered below the chart. */
  footer?: ReactNode;
}

const ChartLineMultiple = ({
  data,
  config,
  title,
  description,
  xAxisKey,
  xLabel,
  yLabel,
  xAxisTickFormatter,
  yAxisTickFormatter,
  xAxisDomain = ['dataMin', 'dataMax'],
  yAxisDomain,
  toggleChartRunning,
  isRunning,
  chartClassName = 'h-[50vh] w-full',
  showLegend = true,
  badge,
  overlays,
  footer,
}: ChartLineMultipleProps) => {
  return (
    <Card>
      <div className="mb-4 flex justify-between">
        <div>
          {title && <p className="text-lg font-semibold">{title}</p>}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          {badge}
          {toggleChartRunning && (
            <Button onClick={toggleChartRunning}>
              {isRunning ? 'Pause' : 'Run'}
              {isRunning ? <Pause /> : <Play />}
            </Button>
          )}
        </div>
      </div>
      <ChartContainer config={config} className={chartClassName}>
        <LineChart accessibilityLayer data={data}>
          <CartesianGrid />
          <XAxis
            dataKey={xAxisKey}
            type="number"
            tickMargin={3}
            tickCount={6}
            tickFormatter={xAxisTickFormatter}
            label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
            domain={xAxisDomain}
            allowDataOverflow
          />
          <YAxis
            tickMargin={3}
            tickFormatter={yAxisTickFormatter}
            label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            domain={yAxisDomain}
          />
          {showLegend && <Legend verticalAlign="top" height={30} />}
          <ChartTooltip cursor={false} />
          {Object.entries(config).map(([key, item]) => (
            <Line
              key={key}
              dataKey={key}
              name={typeof item.label === 'string' ? item.label : key}
              type="monotone"
              stroke={item.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {overlays}
        </LineChart>
      </ChartContainer>
      {footer}
    </Card>
  );
};

export default memo(ChartLineMultiple);
