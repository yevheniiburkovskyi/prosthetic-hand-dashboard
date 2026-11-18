import { Activity, Gauge, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';
import DemoControls from './DemoControls';
import NavigationItem from './ui/NavigationItem';

const NAV_ITEMS = [
  { label: 'Temperature', to: '/temperature', icon: Thermometer },
  { label: 'FSR Sensor', to: '/fsr', icon: Gauge },
];

const NavigationMenu = () => (
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
    <DemoControls />
  </aside>
);

export default NavigationMenu;
