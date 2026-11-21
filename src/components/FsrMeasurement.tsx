import { useMemo } from 'react';
import { ReferenceArea, ReferenceLine } from 'recharts';
import {
  CircleCheck,
  CircleX,
  Download,
  Play,
  ScanSearch,
  Square,
  TriangleAlert,
} from 'lucide-react';
import ChartLineMultiple from './ChartLineMultiple';
import Card from './ui/Card';
import { Badge, type BadgeVariant } from './ui/badge';
import { Button } from './ui/button';
import { useBLEContext } from '@/context/BLEContext';
import { useMeasurementSession } from '@/hooks/useMeasurementSession';
import { useScrollingWindow } from '@/hooks/useScrollingWindow';
import { CHART_BUFFER_SECONDS, CHART_WINDOW_SECONDS } from '@/hooks/useSensor';
import {
  formatSecondsTick,
  SINGLE_FINGER_CHART_CONFIG,
} from '@/lib/chartConfig';
import { FINGER_LABELS, FINGERS, MAX_FSR_VALUE } from '@/lib/constants';
import {
  MIN_ANALYSIS_SECONDS,
  TOLERANCE_PERCENT,
  type ChannelReport,
  type Issue,
  type Marker,
  type MarkerType,
  type Verdict,
} from '@/lib/signalAnalysis';
import { downloadFile, formatTime, toCsv } from '@/lib/utils';
import type { Finger, SensorSample } from '@/types/sensorType';

const Y_AXIS_DOMAIN = [0, MAX_FSR_VALUE];

const VERDICT_BADGE: Record<Verdict, { variant: BadgeVariant; label: string }> =
  {
    ok: { variant: 'success', label: 'Stable' },
    warning: { variant: 'warning', label: 'Deviations' },
    error: { variant: 'error', label: 'Error' },
  };

const MARKER_COLORS: Record<MarkerType, string> = {
  dropout: 'var(--color-neutral-400)',
  saturation: 'var(--color-red-500)',
  stuck: 'var(--color-yellow-500)',
  spike: 'var(--color-red-500)',
};

const renderMarkers = (markers: Marker[]) =>
  markers.map((marker, i) =>
    marker.start === marker.end ? (
      <ReferenceLine
        key={`${marker.type}-${i}`}
        x={marker.start}
        stroke={MARKER_COLORS[marker.type]}
        strokeDasharray="4 3"
        ifOverflow="hidden"
      />
    ) : (
      <ReferenceArea
        key={`${marker.type}-${i}`}
        x1={marker.start}
        x2={marker.end}
        fill={MARKER_COLORS[marker.type]}
        fillOpacity={0.2}
        ifOverflow="hidden"
      />
    )
  );

/** Last few seconds of the recording, for the scrolling live view. */
const tailWindow = (samples: SensorSample[]) => {
  const cutoff = (samples.at(-1)?.time ?? 0) - CHART_BUFFER_SECONDS;
  let start = samples.length;
  while (start > 0 && samples[start - 1].time >= cutoff) start--;
  return samples.slice(start);
};

const IssueList = ({ issues }: { issues: Issue[] }) => (
  <ul className="flex flex-col gap-1 text-sm">
    {issues.map((issue) => (
      <li key={issue.message} className="flex items-start gap-2">
        {issue.verdict === 'error' ? (
          <CircleX className="mt-0.5 size-4 shrink-0 text-red-500" />
        ) : (
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-yellow-500" />
        )}
        {issue.message}
      </li>
    ))}
  </ul>
);

const ChannelSummary = ({ report }: { report: ChannelReport }) => (
  <div className="mt-3 flex flex-col gap-2 border-t border-neutral-200 pt-3">
    <p className="text-xs text-neutral-500">
      Noise ±{report.noisePercent.toFixed(1)}% (limit ±{TOLERANCE_PERCENT}%) ·
      range {report.min}–{report.max} · mean {Math.round(report.mean)}
    </p>
    {report.issues.length > 0 ? (
      <IssueList issues={report.issues} />
    ) : (
      <p className="flex items-center gap-2 text-sm">
        <CircleCheck className="size-4 text-green-500" />
        Signal is steady, no measurement errors found
      </p>
    )}
  </div>
);

interface ChannelChartProps {
  finger: Finger;
  data: SensorSample[];
  xAxisDomain?: [number, number];
  report?: ChannelReport;
  dropouts?: Marker[];
}

const ChannelChart = ({
  finger,
  data,
  xAxisDomain,
  report,
  dropouts = [],
}: ChannelChartProps) => {
  const verdict = report && VERDICT_BADGE[report.verdict];
  const markers = report ? [...dropouts, ...report.markers] : [];

  return (
    <ChartLineMultiple
      data={data}
      config={SINGLE_FINGER_CHART_CONFIG[finger]}
      title={FINGER_LABELS[finger]}
      xAxisKey="time"
      xLabel="Time (s)"
      yLabel="FSR"
      xAxisTickFormatter={formatSecondsTick}
      xAxisDomain={xAxisDomain}
      yAxisDomain={Y_AXIS_DOMAIN}
      chartClassName="h-56 w-full"
      showLegend={false}
      badge={
        verdict && <Badge variant={verdict.variant} title={verdict.label} />
      }
      overlays={markers.length > 0 ? renderMarkers(markers) : undefined}
      footer={report && <ChannelSummary report={report} />}
    />
  );
};

const ChannelGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 xl:grid-cols-2">{children}</div>
);

/** Scrolling per-sensor charts while recording; re-renders every frame. */
const LiveCharts = ({ samples }: { samples: SensorSample[] }) => {
  const liveData = useMemo(() => tailWindow(samples), [samples]);
  const xAxisDomain = useScrollingWindow(
    samples.at(-1)?.time,
    CHART_WINDOW_SECONDS,
    true
  );

  return (
    <ChannelGrid>
      {FINGERS.map((finger) => (
        <ChannelChart
          key={finger}
          finger={finger}
          data={liveData}
          xAxisDomain={xAxisDomain}
        />
      ))}
    </ChannelGrid>
  );
};

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-neutral-500">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

/** Start → Stop → Analyze workflow with one chart per FSR sensor. */
const FsrMeasurement = () => {
  const { status, isDemoMode } = useBLEContext();
  const { state, samples, report, start, stop, analyze, canAnalyze } =
    useMeasurementSession('fsr');

  const hasDataSource = status === 'connected' || isDemoMode;
  const isRecording = state === 'recording';
  const duration = samples.at(-1)?.time ?? 0;
  const sampleRate = duration > 0 ? (samples.length - 1) / duration : 0;
  const stableCount = report
    ? FINGERS.filter((f) => report.channels[f].verdict === 'ok').length
    : 0;

  const hint = (() => {
    if (state === 'recording') return 'Recording… press Stop when done.';
    if (state === 'stopped') {
      if (report)
        return 'Analysis complete. Start a new measurement to repeat.';
      return canAnalyze
        ? 'Press Analyze signal to check the recording for noise and measurement errors.'
        : `Record at least ${MIN_ANALYSIS_SECONDS} s to analyze the signal.`;
    }
    return hasDataSource
      ? 'Calibrate with the hand relaxed (optional), then press Start to record all five sensors.'
      : 'Connect the device or enable demo mode to start a measurement.';
  })();

  const handleDownload = () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    downloadFile(toCsv(samples), `fsr_session_${timestamp}.csv`);
  };

  return (
    <>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Measurement</p>
            <p className="text-sm text-neutral-500">{hint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isRecording ? (
              <Button variant="destructive" onClick={stop}>
                <Square />
                Stop
              </Button>
            ) : (
              <Button onClick={start} disabled={!hasDataSource}>
                <Play />
                {state === 'stopped' ? 'New measurement' : 'Start'}
              </Button>
            )}
            <Button variant="outline" onClick={analyze} disabled={!canAnalyze}>
              <ScanSearch />
              Analyze signal
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={state !== 'stopped' || samples.length === 0}
            >
              <Download />
              Download CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-10">
          <Stat label="Duration" value={formatTime(duration)} />
          <Stat label="Samples" value={samples.length} />
          <Stat
            label="Sample rate"
            value={sampleRate > 0 ? `${sampleRate.toFixed(1)} Hz` : '–'}
          />
          {report && (
            <>
              <Stat
                label="Packet loss"
                value={`${report.packetLossPercent.toFixed(1)}%`}
              />
              <div>
                <p className="text-sm text-neutral-500">Result</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={VERDICT_BADGE[report.verdict].variant}
                    title={VERDICT_BADGE[report.verdict].label}
                    className="h-8"
                  />
                  <span className="text-sm text-neutral-500">
                    {stableCount} of {FINGERS.length} sensors stable
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {report && report.issues.length > 0 && (
          <IssueList issues={report.issues} />
        )}
      </Card>

      {isRecording ? (
        <LiveCharts samples={samples} />
      ) : (
        <ChannelGrid>
          {FINGERS.map((finger) => (
            <ChannelChart
              key={finger}
              finger={finger}
              data={samples}
              report={report?.channels[finger]}
              dropouts={report?.dropouts}
            />
          ))}
        </ChannelGrid>
      )}
    </>
  );
};

export default FsrMeasurement;
