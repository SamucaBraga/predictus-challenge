import type { ComponentProps } from 'react';
import { cn } from '@/helpers/utils';

interface RootProps extends ComponentProps<'div'> {
  error?: boolean;
}

function Root({ className, error, ...props }: RootProps) {
  return (
    <div
      data-error={error || undefined}
      className={cn(
        'relative flex h-12 w-full items-center gap-2 overflow-hidden rounded-lg border border-gray-300 bg-white px-3 shadow-sm transition focus-within:ring-2 focus-within:ring-primary',
        'data-error:border-red-500 data-error:focus-within:ring-red-500',
        className,
      )}
      {...props}
    />
  );
}

function Control({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex-1 overflow-hidden border-0 bg-transparent p-0 text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function Prefix({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center text-gray-500', className)} {...props} />;
}

function Suffix({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center text-gray-500', className)} {...props} />;
}

export const Input = { Root, Control, Prefix, Suffix };
