import type { ComponentProps } from 'react';
import { Bluetooth, Loader, Unplug } from 'lucide-react';
import { Button } from './ui/button';
import { Badge, type BadgeVariant } from './ui/badge';
import { useBLEContext, type ConnectionStatus } from '@/context/BLEContext';

const STATUS_BADGE: Record<
  ConnectionStatus,
  { variant: BadgeVariant; title: string }
> = {
  connected: { variant: 'success', title: 'Connected' },
  connecting: { variant: 'warning', title: 'Connecting...' },
  disconnected: { variant: 'error', title: 'Disconnected' },
};

interface Props extends ComponentProps<'header'> {
  title: string;
  description?: string;
}

const Header = ({ title, description, ...props }: Props) => {
  const { status, connect, disconnect } = useBLEContext();
  const badge = STATUS_BADGE[status];

  return (
    <header className="flex w-full justify-between px-6 pt-6" {...props}>
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="text-neutral-500">{description}</p>}
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={badge.variant} title={badge.title} className="h-9" />
        {status === 'connecting' && (
          <Button disabled>
            <Loader className="animate-spin" />
            Connecting...
          </Button>
        )}
        {status === 'connected' && (
          <Button onClick={disconnect}>
            <Unplug />
            Disconnect Device
          </Button>
        )}
        {status === 'disconnected' && (
          <Button onClick={connect}>
            <Bluetooth />
            Connect Device
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
