import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  to: string;
  icon?: LucideIcon;
}

const NavigationItem = ({ label, to, icon: Icon }: Props) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2 rounded px-3 py-2 transition duration-200 hover:bg-neutral-100',
        isActive && 'bg-neutral-200 hover:bg-neutral-200'
      )
    }
  >
    {Icon && <Icon size={16} />}
    <p className="text-sm font-medium">{label}</p>
  </NavLink>
);

export default NavigationItem;
