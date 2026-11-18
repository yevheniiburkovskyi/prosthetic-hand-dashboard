import { Activity, Gauge, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavigationItem from './ui/NavigationItem';
import { Switch } from './ui/switch';
import { useBLEContext } from '@/context/BLEContext';

const NAV_ITEMS = [
  { label: 'Temperature', to: '/temperature', icon: Thermometer },
  { label: 'FSR Sensor', to: '/fsr', icon: Gauge },
];

const NavigationMenu = () => {
  const { isDemoMode, setDemoMode, status } = useBLEContext();
  // Avoid mixing demo data with a live device stream.
  const isDemoToggleDisabled = status !== 'disconnected';

  return (
    <aside className="flex h-screen min-w-[250px] flex-col border-r border-neutral-200 bg-neutral-50 py-4">
      <Link className="mb-4 flex items-center gap-2 px-4" to="/">
        <Activity />
        <h3 className="text-xl font-semibold">Prosthetic System</h3>
      </Link>
      <div className="h-px w-full bg-neutral-200" />
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => (
          <NavigationItem key={item.to} {...item} />
        ))}
      </nav>
      <div className="border-t border-neutral-200 px-4 pt-4">
        <label
          htmlFor="demo-mode"
          className="flex cursor-pointer items-center justify-between gap-2"
          title={
            isDemoToggleDisabled
              ? 'Disconnect the device to use demo mode'
              : undefined
          }
        >
          <span>
            <span className="block text-sm font-medium">Demo mode</span>
            <span className="block text-xs text-neutral-500">
              Stream mock sensor data
            </span>
          </span>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={setDemoMode}
            disabled={isDemoToggleDisabled}
          />
        </label>
      </div>
    </aside>
  );
};

export default NavigationMenu;
