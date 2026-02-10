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
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import Card from './ui/Card';
import { memo } from 'react';
import type { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';
import type { AxisDomain } from 'recharts/types/util/types';
import { Button } from './ui/button';
import { Pause, Play } from 'lucide-react';

export const description = 'A multiple line chart';

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
  toggleChart?: () => void;
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
  yAxisDomain,
  toggleChart,
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
        {toggleChart && (
          <Button onClick={toggleChart}>
            {isRunning ? <Pause /> : <Play />}
            {isRunning ? 'Pause' : 'Run'}
          </Button>
        )}
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
            domain={['dataMin', 'dataMax']}
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
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {Object.entries(config).map(([key, item]) => (
            <Line
              key={key}
              dataKey={key}
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
