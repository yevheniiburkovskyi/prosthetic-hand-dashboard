import {
  Activity,
  Flame,
  Gauge,
  LayoutDashboard,
  Radio,
  Thermometer,
} from 'lucide-react';
import { memo } from 'react';
import NavigationItem from './ui/NavigationItem';

const NavigationMenu = () => {
  return (
    <aside className="min-w-[250px] border-r border-neutral-200 bg-neutral-50 py-4">
      <div className="mb-4 flex items-center gap-2 px-4">
        <Activity />
        <h1 className="text-xl">Sensor System</h1>
      </div>
      <div className="h-[1px] w-full bg-neutral-200" />
      <nav className="flex flex-col gap-1 px-2 py-4">
        <NavigationItem label={'Overview'} to={'/'} icon={LayoutDashboard} />
        <NavigationItem
          label={'Temperature'}
          to={'/temperature'}
          icon={Thermometer}
        />
        <NavigationItem label={'FSR Sensor'} to={'/fsr-sensor'} icon={Gauge} />
        <NavigationItem label={'Vibration'} to={'/vibration'} icon={Radio} />
        <NavigationItem label={'Heating'} to={'/heating'} icon={Flame} />
      </nav>
    </aside>
  );
};

export default memo(NavigationMenu);
