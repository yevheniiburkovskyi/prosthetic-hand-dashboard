import { useBLEContext } from '@/context/BLEContext';
import type { SensorBLEData } from '@/types/bleType';
import { useCallback, useEffect, useState } from 'react';

const X_AXIS_WINDOW_SIZE = 5;

interface UseSensorOptions<TChartData extends { time: number }> {
  sensorData: SensorBLEData;
  createMeasure: (sensorData: SensorBLEData) => TChartData;
}

const useSensor = <TChartData extends { time: number }>({
  sensorData,
  createMeasure,
}: UseSensorOptions<TChartData>) => {
  const { isBLEConnected } = useBLEContext();

  const [logs, setLogs] = useState<TChartData[]>([]);
  const [chartData, setChartData] = useState<TChartData[]>([]);
  const [isRealTimeChartRunning, setIsRealTimeChartRunning] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const toggleChartRunning = useCallback(() => {
    setIsRealTimeChartRunning((prev) => !prev);
  }, []);

  const toggleLogging = useCallback(() => {
    setIsLogging((prev) => !prev);
  }, []);

  // Collect data into buffer on every sensor change (cheap, no re-render)
  useEffect(() => {
    if (!isRealTimeChartRunning) {
      return;
    }

    const measure = createMeasure(sensorData);

    if (isLogging) {
      setLogs((prevLogs) => [...prevLogs, measure]);
    }

    setChartData((prevChartData) => [...prevChartData, measure]);
  }, [sensorData, isRealTimeChartRunning, isLogging, createMeasure]);

  useEffect(() => {
    if (isBLEConnected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRealTimeChartRunning(true);
      setIsLogging(true);
    }
  }, [isBLEConnected]);

  const lastTime =
    chartData.length > 0 ? chartData[chartData.length - 1].time : 0;
  const windowEnd = Math.max(X_AXIS_WINDOW_SIZE, lastTime);
  const windowStart = windowEnd - X_AXIS_WINDOW_SIZE;
  const xAxisDomain: [number, number] = [windowStart, windowEnd];

  return {
    chartData,
    logs,
    isRealTimeChartRunning,
    isLogging,
    toggleChartRunning,
    toggleLogging,
    xAxisDomain,
  };
};

export { useSensor };
