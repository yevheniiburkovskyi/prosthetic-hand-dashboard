import { Gauge } from 'lucide-react';
import FsrOverview from '@/components/FsrOverview';
import Header from '@/components/Header';
import FsrMeasurement from '@/components/FsrMeasurement';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { useBLEContext } from '@/context/BLEContext';
import {
  FINGER_LABELS,
  FINGERS,
  FSR_THRESHOLDS,
  MAX_FSR_VALUE,
} from '@/lib/constants';
import { getLevel, LEVEL_STYLES, type Level } from '@/lib/levels';
import { cn } from '@/lib/utils';

const LEVEL_LABELS: Record<Level, string> = {
  normal: 'Light',
  warning: 'Medium',
  critical: 'High',
};

const FSR = () => {
  const { readings, isDemoMode } = useBLEContext();

  return (
    <>
      <Header title="FSR sensors" description="FSR sensor control" />
      <div className="flex flex-col gap-6 overflow-auto px-6 pb-6">
        <FsrOverview />

        <ul className="flex w-full flex-wrap gap-4">
          {FINGERS.map((finger) => {
            const { value } = readings.fsr[finger];
            const level = getLevel(value, FSR_THRESHOLDS);
            const styles = LEVEL_STYLES[level];
            return (
              <li key={finger} className="flex-1">
                <Card
                  className={cn(
                    'flex flex-col justify-between gap-4',
                    styles.border
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{FINGER_LABELS[finger]}</p>
                    <Gauge stroke={styles.icon} />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-2xl font-bold">{value}</p>
                      <Badge
                        variant={styles.badge}
                        title={LEVEL_LABELS[level]}
                      />
                    </div>
                    <Progress
                      value={(value / MAX_FSR_VALUE) * 100}
                      indicatorClassName={styles.progress}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        {/* Remount on source change so demo and device data never mix. */}
        <FsrMeasurement key={isDemoMode ? 'demo' : 'device'} />
      </div>
    </>
  );
};

export default FSR;
