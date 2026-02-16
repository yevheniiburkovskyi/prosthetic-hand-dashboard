'use client';

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

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import Card from './ui/Card';
import { memo } from 'react';
import type { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';
import type { AxisDomain } from 'recharts/types/util/types';
import { Button } from './ui/button';
import { Pause, Play } from 'lucide-react';

interface ChartLineMultipleProps {
  data: CategoricalChartProps['data'];
  config: ChartConfig;
  title?: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
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
  yAxisKey,
  xLabel,
  yLabel,
  xAxisTickFormatter,
  yAxisTickFormatter,
  xAxisDomain,
  yAxisDomain,
  toggleChartRunning,
  isRunning,
}: ChartLineMultipleProps) => {
  return (
    <Card>
      <div className="mb-4 flex justify-between">
        <div>
          {title && <p className="text-semibold text-lg">{title}</p>}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {
          <div className="flex gap-2">
            {toggleChartRunning && (
              <Button onClick={toggleChartRunning} className="max-w-min">
                {isRunning ? 'Pause' : 'Run'}
                {isRunning ? <Pause /> : <Play />}
              </Button>
            )}
          </div>
        }
      </div>
      <ChartContainer config={config} className="h-[50vh] w-full">
        <LineChart accessibilityLayer data={data}>
          <CartesianGrid />
          <XAxis
            dataKey={xAxisKey}
            tickLine={true}
            axisLine={true}
            tickMargin={3}
            tickFormatter={xAxisTickFormatter}
            label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
            type="number"
            domain={xAxisDomain || ['dataMin', 'dataMax']}
            tickCount={6}
            allowDataOverflow={true}
          />
          <YAxis
            dataKey={yAxisKey}
            tickLine={true}
            axisLine={true}
            tickMargin={3}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
            }}
            tickFormatter={yAxisTickFormatter}
            domain={yAxisDomain}
          />
          <Legend verticalAlign="top" height={30} />
          <ChartTooltip cursor={false} />
          {Object.entries(config).map(([key, item]) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={item.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </Card>
  );
};

export default memo(ChartLineMultiple);
