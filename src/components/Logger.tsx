import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ChartSpline, Download, Pause, Play } from 'lucide-react';
import Card from './ui/Card';
import { Button } from './ui/button';
import {
  downloadFile,
  formatTime,
  toCsv,
  toCsvHeader,
  toCsvRows,
} from '@/lib/utils';
import type { SensorSample } from '@/types/sensorType';

// Rendering the full log on every sample gets slow; show only the tail.
const PREVIEW_ROWS = 200;

interface Props extends ComponentProps<'div'> {
  title?: string;
  description?: string;
  toggleLogging: () => void;
  isLogging: boolean;
  logs: SensorSample[];
  chart: ReactNode;
}

const Logger = ({
  title,
  description,
  toggleLogging,
  isLogging,
  logs,
  chart,
  ...props
}: Props) => {
  const [isChartShown, setIsChartShown] = useState(false);

  const hasLogs = logs.length > 0;
  const canExport = hasLogs && !isLogging;
  const duration = hasLogs ? logs[logs.length - 1].time - logs[0].time : 0;
  const isTruncated = logs.length > PREVIEW_ROWS;

  const preview = useMemo(() => toCsvRows(logs.slice(-PREVIEW_ROWS)), [logs]);

  const handleDownload = () => {
    // e.g. prosthetic_logs_2024-05-20T14-30-00.csv
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    downloadFile(toCsv(logs), `prosthetic_logs_${timestamp}.csv`);
  };

  return (
    <Card {...props} className="flex flex-col gap-4">
      <div className="flex w-full justify-between">
        <div>
          {title && <p className="text-lg font-semibold">{title}</p>}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsChartShown(true)}
            variant="outline"
            disabled={!canExport}
          >
            <ChartSpline />
            Draw Chart
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={!canExport}
          >
            <Download />
            Download Logs
          </Button>
          <Button onClick={toggleLogging}>
            {isLogging ? 'Pause Logs Recording' : 'Start Logs Recording'}
            {isLogging ? <Pause /> : <Play />}
          </Button>
        </div>
      </div>

      <div className="flex gap-10">
        <div>
          <p className="text-neutral-500">Duration</p>
          <p className="text-3xl font-bold">{formatTime(duration)}</p>
        </div>
        <div>
          <p className="text-neutral-500">Points</p>
          <p className="text-3xl font-bold">{logs.length}</p>
        </div>
      </div>

      <p>
        Logs:
        {isTruncated && (
          <span className="text-sm text-neutral-500">
            {' '}
            (showing last {PREVIEW_ROWS} of {logs.length})
          </span>
        )}
      </p>
      <div className="rounded-md bg-neutral-100 p-4">
        <p>{hasLogs && toCsvHeader(logs[0])}</p>
        <div className="my-2 h-px w-full bg-neutral-300" />
        <pre className="h-64 overflow-auto">{preview}</pre>
      </div>

      {isChartShown && chart}
    </Card>
  );
};

export default Logger;
