import type { ComponentProps } from 'react';
import { cn } from '@/helpers/utils';

export function LoadingSpinner({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      {...props}
    />
  );
}
