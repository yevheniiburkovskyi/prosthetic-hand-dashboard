import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const Card = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('rounded-lg border border-neutral-200 p-3', className)}
    {...props}
  />
);

export default Card;
