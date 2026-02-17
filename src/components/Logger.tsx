import { memo, useMemo, type ComponentProps } from 'react';
import Card from './ui/Card';
import { Button } from './ui/button';
import { Download, Pause, Play } from 'lucide-react';
import { downloadLogs, formatLogs } from '@/lib/utils';

type Data = Record<string, number>;

interface Props extends ComponentProps<'div'> {
  title?: string;
  description?: string;
  toggleLogging: () => void;
  isLogging: boolean;
  logs: Data[];
}

const Logger = ({
  title,
  description,
  toggleLogging,
  isLogging,
  logs,
  ...props
}: Props) => {
  const formattedLogs = useMemo(
    () => (logs.length > 1 ? formatLogs(logs) : ''),
    [logs]
  );

  const handleDownload = () => {
    // Example logs_2024-05-20_14-30.txt
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    downloadLogs(formattedLogs, `prosthetic_logs_${timestamp}.csv`);
  };

  const splittedLogs = formattedLogs.split('\n');
  const headers = splittedLogs[0];
  const data = splittedLogs.filter((_, index) => index !== 0).join('\n');

  return (
    <Card {...props}>
      <div className="flex w-full justify-between">
        <div>
          {title && <p className="text-semibold text-lg">{title}</p>}
          {description && (
            <p className="mb-6 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={logs.length === 1 || isLogging}
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
      <p>Logs:</p>
      <div className="rounded-md bg-neutral-100 p-4">
        <p>{headers}</p>
        <div className="my-2 h-[1px] w-full bg-neutral-300" />
        <pre className="h-64 overflow-auto">{data}</pre>
      </div>
    </Card>
  );
};

export default memo(Logger);
