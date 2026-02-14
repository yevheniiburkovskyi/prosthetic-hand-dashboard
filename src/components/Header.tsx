import { memo } from 'react';
import { Button } from './ui/button';
import { Bluetooth } from 'lucide-react';
import { useBLEContext } from '@/context/BLEContext';

interface Props extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

const Header = ({ title, description, ...props }: Props) => {
  const { connectBluetooth } = useBLEContext();

  return (
    <header className="flex w-full justify-between px-6 pt-6" {...props}>
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="text-neutral-500">{description}</p>}
      </div>
      <Button onClick={connectBluetooth}>
        <Bluetooth />
        Connect Device
      </Button>
    </header>
  );
};

export default memo(Header);
