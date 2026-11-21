import { useBLEContext } from '@/context/BLEContext';
import { toSample } from '@/hooks/useSensor';
import {
  analyzeSession,
  canAnalyze,
  type SessionReport,
} from '@/lib/signalAnalysis';
import type { SensorKind, SensorSample } from '@/types/sensorType';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SessionState = 'idle' | 'recording' | 'stopped';

/**
 * Start → Stop recording of one sensor kind, then on-demand analysis of the
 * recorded signal. Sample times are seconds since the session started.
 */
export const useMeasurementSession = (kind: SensorKind) => {
  const { subscribe } = useBLEContext();

  const [state, setState] = useState<SessionState>('idle');
  const [samples, setSamples] = useState<SensorSample[]>([]);
  const [report, setReport] = useState<SessionReport | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (state !== 'recording') return;

    return subscribe(kind, (readings) => {
      const sample = toSample(readings);
      startTimeRef.current ??= sample.time;
      const time = sample.time - startTimeRef.current;
      setSamples((prev) => [...prev, { ...sample, time }]);
    });
  }, [kind, state, subscribe]);

  const start = useCallback(() => {
    startTimeRef.current = null;
    setSamples([]);
    setReport(null);
    setState('recording');
  }, []);

  const stop = useCallback(() => setState('stopped'), []);

  const analyze = useCallback(
    () => setReport(analyzeSession(samples)),
    [samples]
  );

  return {
    state,
    samples,
    report,
    start,
    stop,
    analyze,
    canAnalyze: state === 'stopped' && canAnalyze(samples),
  };
};
