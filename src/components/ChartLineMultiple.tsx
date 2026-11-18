import { memo } from 'react';
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
        {toggleChartRunning && (
          <Button onClick={toggleChartRunning}>
            {isRunning ? 'Pause' : 'Run'}
            {isRunning ? <Pause /> : <Play />}
          </Button>
        )}
      </div>
      <ChartContainer config={config} className="h-[50vh] w-full">
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
          <Legend verticalAlign="top" height={30} />
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
        </LineChart>
      </ChartContainer>
    </Card>
  );
};

export default memo(ChartLineMultiple);
