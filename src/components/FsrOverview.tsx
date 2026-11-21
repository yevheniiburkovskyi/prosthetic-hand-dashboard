import { Crosshair, Loader, RotateCcw, Sigma } from 'lucide-react';
import Card from './ui/Card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useBLEContext } from '@/context/BLEContext';
import {
  responseTimeMs,
  type Calibration,
  type CorrectionTarget,
} from '@/lib/calibration';
import { FINGER_LABELS, FINGERS, MAX_FSR_VALUE } from '@/lib/constants';
import { TOLERANCE_PERCENT } from '@/lib/signalAnalysis';
import { cn } from '@/lib/utils';

const MAX_TOTAL_PRESSURE = MAX_FSR_VALUE * FINGERS.length;

const TARGET_LABELS: Record<CorrectionTarget, string> = {
  device: 'on the device',
  'demo-device': 'on the demo device',
  app: 'in the app (firmware has no calibration support yet)',
};

const NoiseValue = ({ percent }: { percent: number }) => (
  <span
    className={cn(
      'font-medium',
      percent > TOLERANCE_PERCENT ? 'text-red-600' : 'text-green-700'
    )}
  >
    ±{percent.toFixed(1)}%
  </span>
);

const CalibrationResult = ({ calibration }: { calibration: Calibration }) => {
  const isStable = FINGERS.every(
    (f) => calibration.fingers[f].noiseAfterPercent <= TOLERANCE_PERCENT
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={isStable ? 'success' : 'warning'}
          title={isStable ? 'Signal stable' : 'Still noisy'}
        />
        <span className="text-sm text-neutral-500">
          Applied {TARGET_LABELS[calibration.appliedOn]} at{' '}
          {new Date(calibration.calibratedAt).toLocaleTimeString()}
        </span>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-neutral-500">
          <tr>
            <th className="font-normal">Sensor</th>
            <th className="font-normal">Noise before</th>
            <th className="font-normal">Noise after</th>
            <th className="font-normal">Filter response</th>
            <th className="font-normal">Zero offset</th>
          </tr>
        </thead>
        <tbody>
          {FINGERS.map((finger) => {
            const c = calibration.fingers[finger];
            const response = responseTimeMs(
              c.alpha,
              calibration.sampleIntervalMs
            );
            return (
              <tr key={finger}>
                <td>{FINGER_LABELS[finger]}</td>
                <td>
                  <NoiseValue percent={c.noiseBeforePercent} />
                </td>
                <td>
                  <NoiseValue percent={c.noiseAfterPercent} />
                </td>
                <td>{response > 0 ? `${Math.round(response)} ms` : 'off'}</td>
                <td>{c.offset}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Total pressure across all fingers plus the FSR calibration loop. */
const FsrOverview = () => {
  const {
    readings,
    status,
    isDemoMode,
    fsrCalibration,
    isCalibratingFsr,
    deviceSupportsCalibration,
    calibrateFsr,
    resetFsrCalibration,
  } = useBLEContext();

  const total = FINGERS.reduce((sum, f) => sum + readings.fsr[f].value, 0);
  const hasDataSource = status === 'connected' || isDemoMode;
  const target: CorrectionTarget = isDemoMode
    ? 'demo-device'
    : deviceSupportsCalibration
      ? 'device'
      : 'app';

  return (
    <Card className="flex flex-wrap items-stretch gap-6">
      <div className="flex min-w-64 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Total pressure</p>
          <Sigma />
        </div>
        <p className="text-3xl font-bold">
          {Math.round(total)}
          <span className="ml-2 text-sm font-normal text-neutral-500">
            / {MAX_TOTAL_PRESSURE}
          </span>
        </p>
        <Progress value={(total / MAX_TOTAL_PRESSURE) * 100} />
        <p className="text-xs text-neutral-500">Sum of all five FSR sensors</p>
      </div>

      <div className="w-px bg-neutral-200" />

      <div className="flex min-w-80 flex-[2] flex-col justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Calibration</p>
            <Crosshair />
          </div>
          {isCalibratingFsr ? (
            <p className="text-sm text-neutral-500">
              Keep the hand relaxed and unloaded…
            </p>
          ) : fsrCalibration ? (
            <CalibrationResult calibration={fsrCalibration} />
          ) : (
            <p className="text-sm text-neutral-500">
              Measures each sensor's noise at rest, then sets a zero offset and
              a filter so the signal stays within ±{TOLERANCE_PERCENT}%.
              {hasDataSource &&
                ` Settings will be applied ${TARGET_LABELS[target]}.`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={calibrateFsr}
            disabled={!hasDataSource || isCalibratingFsr}
            title={
              hasDataSource
                ? 'Measure resting noise and stabilize the signal'
                : 'Connect the device or enable demo mode first'
            }
          >
            {isCalibratingFsr ? (
              <Loader className="animate-spin" />
            ) : (
              <Crosshair />
            )}
            {isCalibratingFsr
              ? 'Calibrating…'
              : fsrCalibration
                ? 'Recalibrate'
                : 'Calibrate'}
          </Button>
          {fsrCalibration && !isCalibratingFsr && (
            <Button variant="outline" onClick={resetFsrCalibration}>
              <RotateCcw />
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FsrOverview;
