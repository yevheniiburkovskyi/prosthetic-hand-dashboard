import { memo, useMemo } from 'react';
import { Button } from './ui/button';
import { Bluetooth, Loader, Unplug } from 'lucide-react';
import { useBLEContext } from '@/context/BLEContext';
import { Badge } from './ui/badge';

interface Props extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

const Header = ({ title, description, ...props }: Props) => {
  const { connectServer, disconnectServer, isBLEConnected, isBLEConnecting } =
    useBLEContext();

  const BadgeComponent = useMemo(() => {
    switch (true) {
      case isBLEConnected:
        return <Badge variant="success" title="Connected" className="h-9" />;
      case isBLEConnecting:
        return (
          <Badge variant="warning" title="Connecting..." className="h-9" />
        );
      default:
        return <Badge variant="error" title="Disconnected" className="h-9" />;
    }
  }, [isBLEConnected, isBLEConnecting]);

  return (
    <header className="flex w-full justify-between px-6 pt-6" {...props}>
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="text-neutral-500">{description}</p>}
      </div>
      <div className="flex items-center gap-4">
        {BadgeComponent}
        <Button
          onClick={isBLEConnected ? disconnectServer : connectServer}
          disabled={isBLEConnecting}
        >
          {!isBLEConnecting && (isBLEConnected ? <Unplug /> : <Bluetooth />)}
          {!isBLEConnecting &&
            (isBLEConnected ? 'Disconnect Device' : 'Connect Device')}
          {isBLEConnecting && <Loader className="animate-spin" />}
          {isBLEConnecting && 'Connecting...'}
        </Button>
      </div>
    </header>
  );
};

export default memo(Header);
