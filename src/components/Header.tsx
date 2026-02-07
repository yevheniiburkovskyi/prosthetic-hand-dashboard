import { memo } from 'react';
import { Button } from './ui/button';
import { Bluetooth } from 'lucide-react';

interface Props extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

const Header = ({ title, description, ...props }: Props) => {
  return (
    <header className="flex w-full justify-between" {...props}>
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="text-neutral-500">{description}</p>}
      </div>
      <Button>
        <Bluetooth />
        Connect Device
      </Button>
    </header>
  );
};

export default memo(Header);
