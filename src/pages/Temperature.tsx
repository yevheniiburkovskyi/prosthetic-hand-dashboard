import Header from '@/components/Header';
import { Thermometer } from 'lucide-react';
import { memo } from 'react';

interface Temperature {
  id: number;
  name: string;
  value: number;
}

const mockedTemperature = [
  {
    id: 1,
    name: 'Thumb',
    value: 22.5,
  },
  {
    id: 2,
    name: 'Index',
    value: 23.0,
  },
  {
    id: 3,
    name: 'Middle',
    value: 22.8,
  },
  {
    id: 4,
    name: 'Ring',
    value: 23.2,
  },
  {
    id: 5,
    name: 'Pinky',
    value: 22.7,
  },
];

const Temperature = () => {
  return (
    <>
      <Header
        title="Temperature sensors"
        description="Temperature sensor control"
      />
      <div>
        <ul className="flex w-full flex-wrap gap-4">
          {mockedTemperature.map((sensor) => (
            <li
              key={sensor.id}
              className="flex h-24 flex-1 flex-col gap-4 rounded-lg border border-neutral-200 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-md font-semibold">{sensor.name}</p>
                <Thermometer />
              </div>
              <p className="text-2xl font-bold">{sensor.value}°C</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default memo(Temperature);
