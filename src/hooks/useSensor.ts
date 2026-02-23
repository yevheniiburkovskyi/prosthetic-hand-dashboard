import { useBLEContext } from '@/context/BLEContext';
import type { SensorBLEData } from '@/types/bleType';
import { useCallback, useEffect, useRef, useState } from 'react';

const X_AXIS_WINDOW_SIZE = 5;

interface UseSensorOptions<TChartData extends { time: number }> {
  sensorData: SensorBLEData;
  createMeasure: (sensorData: SensorBLEData, currentTime: number) => TChartData;
}

const useSensor = <TChartData extends { time: number }>({
  sensorData,
  createMeasure,
}: UseSensorOptions<TChartData>) => {
  const { isBLEConnected } = useBLEContext();

  const [logs, setLogs] = useState<TChartData[]>([]);
  const dataBufferRef = useRef<TChartData[]>([]);
  const [chartData, setChartData] = useState<TChartData[]>([]);
  const [isRealTimeChartRunning, setIsRealTimeChartRunning] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const toggleChartRunning = useCallback(() => {
    setIsRealTimeChartRunning((prev) => !prev);
  }, []);

  const toggleLogging = useCallback(() => {
    setIsLogging((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isRealTimeChartRunning) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const currentTime = (Date.now() - startTimeRef.current) / 1000;
    const measure = createMeasure(sensorData, currentTime);

    if (isLogging) {
      setLogs((prevLogs) => [...prevLogs, measure]);
    }

    dataBufferRef.current.push(measure);

    if (dataBufferRef.current.length > 500) {
      const cutOffTime = currentTime - 20;
      if (dataBufferRef.current[0].time < cutOffTime) {
        dataBufferRef.current = dataBufferRef.current.filter(
          (p) => p.time > cutOffTime
        );
      }
    }
  }, [sensorData, isRealTimeChartRunning, isLogging, createMeasure]);

  useEffect(() => {
    if (!isRealTimeChartRunning) {
      return;
    }

    const interval = setInterval(() => {
      setChartData([...dataBufferRef.current]);
    }, 20);

    return () => clearInterval(interval);
  }, [isRealTimeChartRunning]);

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
