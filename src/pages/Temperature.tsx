import { Thermometer } from 'lucide-react';
import Header from '@/components/Header';
import SensorCharts from '@/components/SensorCharts';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import { useBLEContext } from '@/context/BLEContext';
import {
  SENSOR_LABELS,
  SENSORS,
  TEMPERATURE_THRESHOLDS,
} from '@/lib/constants';
import { getLevel, LEVEL_STYLES, type Level } from '@/lib/levels';
import { cn } from '@/lib/utils';

const Y_AXIS_DOMAIN = [0, 100];
const formatCelsiusTick = (value: number) => `${value}°C`;

const LEVEL_LABELS: Record<Level, string> = {
  normal: 'Normal',
  warning: 'Warm',
  critical: 'High',
};

const Temperature = () => {
  const { readings } = useBLEContext();

  return (
    <>
      <Header
        title="Temperature sensors"
        description="Temperature sensor control"
      />
      <div className="flex flex-col gap-6 overflow-auto px-6 pb-6">
        <ul className="flex w-full flex-wrap gap-4">
          {SENSORS.map((sensor) => {
            const { value } = readings.temperature[sensor];
            const level = getLevel(value, TEMPERATURE_THRESHOLDS);
            const styles = LEVEL_STYLES[level];
            return (
              <li key={sensor} className="flex-1">
                <Card
                  className={cn(
                    'flex flex-col justify-between gap-4',
                    styles.border
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{SENSOR_LABELS[sensor]}</p>
                    <Thermometer stroke={styles.icon} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{value}°C</p>
                    <Badge variant={styles.badge} title={LEVEL_LABELS[level]} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <SensorCharts
          kind="temperature"
          title="Temperature sensors"
          dataLabel="temperature"
          yLabel="Temperature (°C)"
          yAxisDomain={Y_AXIS_DOMAIN}
          yAxisTickFormatter={formatCelsiusTick}
        />
      </div>
    </>
  );
};

export default Temperature;
