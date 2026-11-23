import { SENSORS, MAX_FSR_VALUE } from '@/lib/constants';
import type { SensorId, SensorSample } from '@/types/sensorType';

/** Allowed measurement error, in % of the sensor range. */
export const TOLERANCE_PERCENT = 2;
export const MIN_ANALYSIS_SECONDS = 3;
const MIN_ANALYSIS_SAMPLES = 20;

/** 5-sample moving median: follows real movement, ignores single glitches. */
const SMOOTHING_HALF_WINDOW = 2;
/** A time step this many times the typical interval counts as lost data. */
const GAP_FACTOR = 2.5;
/** Spike = deviation from the smoothed signal above both limits. */
const SPIKE_MIN_PERCENT = 5;
const SPIKE_SIGMA = 6;
/** Readings at or above this fraction of the range count as saturated. */
export const SATURATION_LEVEL = 0.99;
const STUCK_MIN_SECONDS = 1.5;

const NOISE_ERROR_FACTOR = 2.5;
const SPIKES_ERROR_PERCENT = 3;
const SATURATION_ERROR_PERCENT = 10;
const PACKET_LOSS_ERROR_PERCENT = 5;

export type Verdict = 'ok' | 'warning' | 'error';

export interface Issue {
  verdict: Exclude<Verdict, 'ok'>;
  message: string;
}

export type MarkerType = 'spike' | 'saturation' | 'stuck' | 'dropout';

/** Time span (seconds) to highlight on a chart; start === end for a point. */
export interface Marker {
  type: MarkerType;
  start: number;
  end: number;
}

export interface ChannelReport {
  verdict: Verdict;
  issues: Issue[];
  markers: Marker[];
  /** ~95% noise band (2 × RMS) as % of range. */
  noisePercent: number;
  min: number;
  max: number;
  mean: number;
}

export interface SessionReport {
  verdict: Verdict;
  /** Issues affecting all sensors (timing / packet loss). */
  issues: Issue[];
  dropouts: Marker[];
  duration: number;
  sampleCount: number;
  sampleRate: number;
  packetLossPercent: number;
  channels: Record<SensorId, ChannelReport>;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const worstVerdict = (issues: Issue[]): Verdict => {
  if (issues.some((issue) => issue.verdict === 'error')) return 'error';
  return issues.length > 0 ? 'warning' : 'ok';
};

/** Consecutive index ranges [first, last] where `predicate` holds. */
const findRuns = (
  length: number,
  predicate: (index: number) => boolean
): [number, number][] => {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= length; i++) {
    const inRun = i < length && predicate(i);
    if (inRun && start === -1) start = i;
    if (!inRun && start !== -1) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  return runs;
};

const fmt = (value: number, digits = 1) => value.toFixed(digits);

const duration = (samples: SensorSample[]) =>
  samples.length > 1 ? samples[samples.length - 1].time - samples[0].time : 0;

export const canAnalyze = (samples: SensorSample[]) =>
  samples.length >= MIN_ANALYSIS_SAMPLES &&
  duration(samples) >= MIN_ANALYSIS_SECONDS;

const analyzeTiming = (times: number[]) => {
  const steps = times.slice(1).map((t, i) => t - times[i]);
  const interval = median(steps.filter((step) => step > 0)) || 0.1;
  const issues: Issue[] = [];
  const dropouts: Marker[] = [];
  let lostPackets = 0;

  steps.forEach((step, i) => {
    if (step > interval * GAP_FACTOR) {
      dropouts.push({ type: 'dropout', start: times[i], end: times[i + 1] });
      lostPackets += Math.round(step / interval) - 1;
    }
  });

  const packetLossPercent = (lostPackets / (times.length + lostPackets)) * 100;

  if (dropouts.length > 0) {
    const longest = Math.max(...dropouts.map((d) => d.end - d.start));
    issues.push({
      verdict:
        packetLossPercent > PACKET_LOSS_ERROR_PERCENT ? 'error' : 'warning',
      message: `${dropouts.length} gap(s) in data, ~${fmt(packetLossPercent)}% of packets lost (longest ${fmt(longest)} s)`,
    });
  }

  const outOfOrder = steps.filter((step) => step <= 0).length;
  if (outOfOrder > 0) {
    issues.push({
      verdict: 'warning',
      message: `${outOfOrder} sample(s) with repeated or backwards timestamps`,
    });
  }

  return { interval, dropouts, packetLossPercent, issues };
};

const analyzeChannel = (
  times: number[],
  values: number[],
  range: number
): ChannelReport => {
  const n = values.length;
  const issues: Issue[] = [];
  const markers: Marker[] = [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, v) => sum + v, 0) / n;

  // Whole-session checks: a sensor that never changes can't be judged further.
  if (min === max) {
    issues.push(
      max === 0
        ? {
            verdict: 'warning',
            message:
              'No signal: reads 0 for the whole session (no load or sensor not connected)',
          }
        : {
            verdict: 'error',
            message: `Signal frozen at ${max} for the whole session`,
          }
    );
    return {
      verdict: worstVerdict(issues),
      issues,
      markers,
      noisePercent: 0,
      min,
      max,
      mean,
    };
  }

  const smoothed = values.map((_, i) =>
    median(
      values.slice(
        Math.max(0, i - SMOOTHING_HALF_WINDOW),
        i + SMOOTHING_HALF_WINDOW + 1
      )
    )
  );
  const residuals = values.map((v, i) => v - smoothed[i]);

  // Spikes: isolated samples far from the smoothed signal.
  const robustSigma = 1.4826 * median(residuals.map(Math.abs));
  const spikeLimit = Math.max(
    SPIKE_SIGMA * robustSigma,
    (range * SPIKE_MIN_PERCENT) / 100
  );
  const spikeIndices = new Set(
    residuals.flatMap((r, i) => (Math.abs(r) > spikeLimit ? [i] : []))
  );
  spikeIndices.forEach((i) =>
    markers.push({ type: 'spike', start: times[i], end: times[i] })
  );
  if (spikeIndices.size > 0) {
    const percent = (spikeIndices.size / n) * 100;
    issues.push({
      verdict: percent > SPIKES_ERROR_PERCENT ? 'error' : 'warning',
      message: `${spikeIndices.size} spike(s): sudden jumps of more than ${Math.round(spikeLimit)}`,
    });
  }

  // Noise: spread of the remaining residuals.
  const clean = residuals.filter((_, i) => !spikeIndices.has(i));
  const rms = Math.sqrt(
    clean.reduce((sum, r) => sum + r * r, 0) / Math.max(1, clean.length)
  );
  const noisePercent = ((2 * rms) / range) * 100;
  if (noisePercent > TOLERANCE_PERCENT) {
    issues.push({
      verdict:
        noisePercent > TOLERANCE_PERCENT * NOISE_ERROR_FACTOR
          ? 'error'
          : 'warning',
      message: `Noise ±${fmt(noisePercent)}% of range exceeds the ±${TOLERANCE_PERCENT}% limit`,
    });
  }

  // Saturation: readings pinned at the top of the sensor range.
  const saturationValue = range * SATURATION_LEVEL;
  const isSaturated = (i: number) => values[i] >= saturationValue;
  const saturatedRuns = findRuns(n, isSaturated);
  if (saturatedRuns.length > 0) {
    const saturatedCount = saturatedRuns.reduce(
      (s, [a, b]) => s + b - a + 1,
      0
    );
    const percent = (saturatedCount / n) * 100;
    saturatedRuns.forEach(([a, b]) =>
      markers.push({ type: 'saturation', start: times[a], end: times[b] })
    );
    issues.push({
      verdict: percent > SATURATION_ERROR_PERCENT ? 'error' : 'warning',
      message: `At sensor maximum ${fmt(percent)}% of the time: force above measurable range`,
    });
  }

  // Stuck: identical non-zero readings for too long (real signals jitter).
  const stuckRuns = findRuns(
    n,
    (i) =>
      i > 0 && values[i] === values[i - 1] && values[i] > 0 && !isSaturated(i)
  )
    .map(([a, b]) => [a - 1, b] as const)
    .filter(([a, b]) => times[b] - times[a] >= STUCK_MIN_SECONDS);
  if (stuckRuns.length > 0) {
    const longest = Math.max(...stuckRuns.map(([a, b]) => times[b] - times[a]));
    stuckRuns.forEach(([a, b]) =>
      markers.push({ type: 'stuck', start: times[a], end: times[b] })
    );
    issues.push({
      verdict: 'warning',
      message: `Signal frozen ${stuckRuns.length} time(s), longest ${fmt(longest)} s`,
    });
  }

  return {
    verdict: worstVerdict(issues),
    issues,
    markers,
    noisePercent,
    min,
    max,
    mean,
  };
};

/**
 * Checks a recorded session for measurement problems: data gaps, noise above
 * tolerance, spikes, saturation and frozen readings.
 */
export const analyzeSession = (
  samples: SensorSample[],
  range = MAX_FSR_VALUE
): SessionReport => {
  const times = samples.map((s) => s.time);
  const timing = analyzeTiming(times);

  const channels = Object.fromEntries(
    SENSORS.map((sensor) => [
      sensor,
      analyzeChannel(
        times,
        samples.map((s) => s[sensor]),
        range
      ),
    ])
  ) as Record<SensorId, ChannelReport>;

  const allIssues = [
    ...timing.issues,
    ...SENSORS.flatMap((f) => channels[f].issues),
  ];

  return {
    verdict: worstVerdict(allIssues),
    issues: timing.issues,
    dropouts: timing.dropouts,
    duration: duration(samples),
    sampleCount: samples.length,
    sampleRate: 1 / timing.interval,
    packetLossPercent: timing.packetLossPercent,
    channels,
  };
};
