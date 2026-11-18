import { useBLEContext } from '@/context/BLEContext';
import { FINGERS } from '@/lib/constants';
import type {
  HandReadings,
  SensorKind,
  SensorSample,
} from '@/types/sensorType';
import { useCallback, useEffect, useState } from 'react';

const CHART_WINDOW_SECONDS = 5;
// Keep a little history past the left edge so lines enter the chart smoothly.
const CHART_BUFFER_SECONDS = CHART_WINDOW_SECONDS + 1;

const toSample = (readings: HandReadings): SensorSample => {
  const latestTimestamp = Math.max(
    ...FINGERS.map((f) => readings[f].timestamp)
  );

  return {
    time: latestTimestamp / 1000,
    thumb: readings.thumb.value,
    index: readings.index.value,
    middle: readings.middle.value,
    ring: readings.ring.value,
    pinky: readings.pinky.value,
  };
};

const useSensor = (kind: SensorKind) => {
  const { subscribe } = useBLEContext();

  const [chartData, setChartData] = useState<SensorSample[]>([]);
  const [logs, setLogs] = useState<SensorSample[]>([]);
  const [isChartRunning, setIsChartRunning] = useState(true);
  const [isLogging, setIsLogging] = useState(true);

  const toggleChartRunning = useCallback(
    () => setIsChartRunning((prev) => !prev),
    []
  );
  const toggleLogging = useCallback(() => setIsLogging((prev) => !prev), []);

  useEffect(() => {
    if (!isChartRunning && !isLogging) return;

    return subscribe(kind, (readings) => {
      const sample = toSample(readings);

      if (isChartRunning) {
        const cutoff = sample.time - CHART_BUFFER_SECONDS;
        setChartData((prev) => [
          ...prev.filter((point) => point.time >= cutoff),
          sample,
        ]);
      }

      if (isLogging) {
        setLogs((prev) => [...prev, sample]);
      }
    });
  }, [kind, subscribe, isChartRunning, isLogging]);

  const lastTime = chartData.at(-1)?.time ?? 0;
  const windowEnd = Math.max(CHART_WINDOW_SECONDS, lastTime);
  const xAxisDomain: [number, number] = [
    windowEnd - CHART_WINDOW_SECONDS,
    windowEnd,
  ];

  return {
    chartData,
    logs,
    isChartRunning,
    isLogging,
    toggleChartRunning,
    toggleLogging,
    xAxisDomain,
  };
};

export { useSensor };
