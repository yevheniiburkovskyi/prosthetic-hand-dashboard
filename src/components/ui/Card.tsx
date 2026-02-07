import { memo, type ComponentProps } from 'react';

const Card = ({ children, className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={`rounded-lg border border-neutral-200 p-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default memo(Card);
