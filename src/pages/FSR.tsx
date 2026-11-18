import { Gauge } from 'lucide-react';
import Header from '@/components/Header';
import SensorCharts from '@/components/SensorCharts';
import Card from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { useBLEContext } from '@/context/BLEContext';
import { FINGER_LABELS, FINGERS, MAX_FSR_VALUE } from '@/lib/constants';

const Y_AXIS_DOMAIN = [0, MAX_FSR_VALUE];

const FSR = () => {
  const { readings } = useBLEContext();

  return (
    <>
      <Header title="FSR sensors" description="FSR sensor control" />
      <div className="flex flex-col gap-6 overflow-auto px-6 pb-6">
        <ul className="flex w-full flex-wrap gap-4">
          {FINGERS.map((finger) => {
            const { value } = readings.fsr[finger];
            return (
              <li key={finger} className="flex-1">
                <Card className="flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{FINGER_LABELS[finger]}</p>
                    <Gauge />
                  </div>
                  <div>
                    <p className="mb-2 text-2xl font-bold">{value}</p>
                    <Progress value={(value / MAX_FSR_VALUE) * 100} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <SensorCharts
          kind="fsr"
          title="FSR sensors"
          dataLabel="FSR"
          yLabel="FSR Value"
          yAxisDomain={Y_AXIS_DOMAIN}
        />
      </div>
    </>
  );
};

export default FSR;
