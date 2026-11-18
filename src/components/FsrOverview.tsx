import { Crosshair, Loader, RotateCcw, Sigma } from 'lucide-react';
import Card from './ui/Card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useBLEContext } from '@/context/BLEContext';
import { FINGERS, MAX_FSR_VALUE } from '@/lib/constants';

const MAX_TOTAL_PRESSURE = MAX_FSR_VALUE * FINGERS.length;

/** Total pressure across all fingers plus FSR calibration controls. */
const FsrOverview = () => {
  const {
    readings,
    status,
    isDemoMode,
    fsrCalibration,
    isCalibratingFsr,
    calibrateFsr,
    resetFsrCalibration,
  } = useBLEContext();

  const total = FINGERS.reduce((sum, f) => sum + readings.fsr[f].value, 0);
  const hasDataSource = status === 'connected' || isDemoMode;
  const noiseBand = fsrCalibration
    ? Math.max(...FINGERS.map((f) => fsrCalibration.fingers[f].threshold))
    : 0;

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

      <div className="flex min-w-64 flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Calibration</p>
            <Crosshair />
          </div>
          <p className="text-sm text-neutral-500">
            {isCalibratingFsr
              ? 'Keep the hand relaxed and unloaded…'
              : fsrCalibration
                ? `Calibrated at ${new Date(fsrCalibration.calibratedAt).toLocaleTimeString()} · noise band ±${noiseBand}`
                : 'Not calibrated: readings include sensor offset and noise.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={calibrateFsr}
            disabled={!hasDataSource || isCalibratingFsr}
            title={
              hasDataSource
                ? 'Measure resting values and remove sensor noise'
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
