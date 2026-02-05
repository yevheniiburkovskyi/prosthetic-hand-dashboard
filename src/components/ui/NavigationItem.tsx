import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { Link, type LinkProps, useLocation } from 'react-router-dom';

interface Props extends LinkProps {
  label: string;
  icon?: LucideIcon;
}

const NavigationItem = ({ label, to, icon: Icon, ...props }: Props) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      {...props}
      to={to}
      className={`flex items-center gap-2 rounded px-3 py-2 transition duration-200 hover:bg-neutral-100 ${
        isActive ? 'bg-neutral-200 hover:bg-neutral-200' : ''
      }`}
    >
      {Icon && <Icon size={16} />}
      <p className="typography text-sm font-medium">{label}</p>
    </Link>
  );
};

export default memo(NavigationItem);
