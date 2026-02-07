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
import { Link } from 'react-router-dom';

const NavigationMenu = () => {
  return (
    <aside className="h-screen min-w-[250px] border-r border-neutral-200 bg-neutral-50 py-4">
      <Link className="mb-4 flex items-center gap-2 px-4" to="/">
        <Activity />
        <h3 className="text-xl font-semibold">Sensor System</h3>
      </Link>
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
