import { Thermometer } from 'lucide-react';
import Header from '@/components/Header';
import SensorCharts from '@/components/SensorCharts';
import { Badge } from '@/components/ui/badge';
import Card from '@/components/ui/Card';
import { useBLEContext } from '@/context/BLEContext';
import { FINGER_LABELS, FINGERS, TEMPERATURE_LIMIT } from '@/lib/constants';
import { cn } from '@/lib/utils';

const Y_AXIS_DOMAIN = [0, 100];
const formatCelsiusTick = (value: number) => `${value}°C`;

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
          {FINGERS.map((finger) => {
            const { value } = readings.temperature[finger];
            const isHigh = value > TEMPERATURE_LIMIT;
            return (
              <li key={finger} className="flex-1">
                <Card
                  className={cn(
                    'flex flex-col justify-between gap-4',
                    isHigh && 'border-red-500'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{FINGER_LABELS[finger]}</p>
                    <Thermometer
                      stroke={isHigh ? 'var(--color-red-500)' : 'currentColor'}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{value}°C</p>
                    <Badge
                      variant={isHigh ? 'error' : 'success'}
                      title={isHigh ? 'High' : 'Normal'}
                    />
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
