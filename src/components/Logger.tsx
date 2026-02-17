import { memo, useEffect, useMemo, useState, type ComponentProps } from 'react';
import Card from './ui/Card';
import { Button } from './ui/button';
import { Download, Pause, Play } from 'lucide-react';
import { downloadLogs, formatLogs, formatTime } from '@/lib/utils';

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
  const [timer, setTimer] = useState<number>(0);

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

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (isLogging) {
      timerId = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    if (!timerId) {
      return;
    }

    return () => clearInterval(timerId);
  }, [isLogging]);

  const formattedTime = formatTime(timer);

  const splittedLogs = formattedLogs.split('\n');
  const headers = splittedLogs[0];
  const data = splittedLogs.filter((_, index) => index !== 0).join('\n');

  return (
    <Card {...props} className="flex flex-col gap-4">
      <div className="flex w-full justify-between">
        <div>
          {title && <p className="text-semibold text-lg">{title}</p>}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
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

      <div className="flex gap-10">
        <div>
          <p className="text-neutral-500">Duration</p>
          <p className="text-3xl font-bold">{formattedTime}</p>
        </div>
        <div>
          <p className="text-neutral-500">Points</p>
          <p className="text-3xl font-bold">{logs.length - 1}</p>
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
