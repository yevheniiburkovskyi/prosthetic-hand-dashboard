import {
  Crosshair,
  Loader,
  Power,
  PowerOff,
  RotateCcw,
  Sigma,
} from 'lucide-react';
import Card from './ui/Card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useBLEContext, type MotorStatus } from '@/context/BLEContext';
import {
  responseTimeMs,
  type Calibration,
  type CorrectionTarget,
} from '@/lib/calibration';
import { SENSOR_LABELS, SENSORS, MAX_FSR_VALUE } from '@/lib/constants';
import { TOLERANCE_PERCENT } from '@/lib/signalAnalysis';
import { cn } from '@/lib/utils';

const MAX_TOTAL_PRESSURE = MAX_FSR_VALUE * SENSORS.length;

const TARGET_LABELS: Record<CorrectionTarget, string> = {
  device: 'on the device',
  'demo-device': 'on the demo device',
  app: 'in the app (firmware has no calibration support yet)',
};

const MOTOR_INDICATOR: Record<
  MotorStatus,
  { label: string; box: string; dot: string }
> = {
  running: {
    label: 'Motor running',
    box: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    dot: 'animate-pulse bg-yellow-500',
  },
  stopped: {
    label: 'Motor stopped',
    box: 'border-neutral-300 bg-neutral-50 text-neutral-600',
    dot: 'bg-neutral-400',
  },
  fault: {
    label: 'Motor fault',
    box: 'border-red-400 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  unavailable: {
    label: 'Motor not available',
    box: 'border-dashed border-neutral-300 text-neutral-400',
    dot: 'bg-neutral-300',
  },
};

/** Shows the motor state as reported by the device. */
const MotorIndicator = ({ status }: { status: MotorStatus }) => {
  const { label, box, dot } = MOTOR_INDICATOR[status];
  return (
    <span
      role="status"
      aria-live="polite"
      title={
        status === 'unavailable'
          ? 'Connect a device whose firmware supports motor control'
          : 'State reported by the device'
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        box
      )}
    >
      <span className={cn('size-2 rounded-full', dot)} />
      {label}
    </span>
  );
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
  const isStable = SENSORS.every(
    (f) => calibration.sensors[f].noiseAfterPercent <= TOLERANCE_PERCENT
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
          {SENSORS.map((sensor) => {
            const c = calibration.sensors[sensor];
            const response = responseTimeMs(
              c.alpha,
              calibration.sampleIntervalMs
            );
            return (
              <tr key={sensor}>
                <td>{SENSOR_LABELS[sensor]}</td>
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

/** Total pressure across all sensors plus the FSR calibration loop. */
const FsrOverview = () => {
  const {
    readings,
    status,
    isDemoMode,
    fsrCalibration,
    isCalibratingFsr,
    capabilities,
    motorStatus,
    isMotorCommandPending,
    sendMotorCommand,
    calibrateFsr,
    resetFsrCalibration,
  } = useBLEContext();

  const total = SENSORS.reduce((sum, f) => sum + readings.fsr[f].value, 0);
  const hasDataSource = status === 'connected' || isDemoMode;
  const target: CorrectionTarget = isDemoMode
    ? 'demo-device'
    : capabilities.calibration
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
        <p className="text-xs text-neutral-500">
          Sum of all {SENSORS.length} FSR sensors
        </p>
      </div>

      <div className="w-px bg-neutral-200" />

      <div className="flex min-w-80 flex-[2] flex-col justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <p className="font-semibold">Calibration</p>
              <MotorIndicator status={motorStatus} />
            </div>
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
          {capabilities.motor && (
            <Button
              variant="outline"
              className="ml-auto"
              disabled={isCalibratingFsr || isMotorCommandPending}
              onClick={() =>
                sendMotorCommand(
                  motorStatus === 'running' ? 'motorStop' : 'motorStart'
                )
              }
            >
              {isMotorCommandPending ? (
                <Loader className="animate-spin" />
              ) : motorStatus === 'running' ? (
                <PowerOff />
              ) : (
                <Power />
              )}
              {motorStatus === 'running' ? 'Stop motor' : 'Start motor'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FsrOverview;
