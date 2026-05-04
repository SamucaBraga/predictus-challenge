import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/helpers/utils';

function Root({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

interface LabelProps extends ComponentProps<'label'> {
  children: ReactNode;
}

function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium text-gray-700', className)}
      {...props}
    >
      {children}
    </label>
  );
}

interface MessageProps extends ComponentProps<'span'> {
  error?: string | string[] | null;
  hint?: string;
}

function Message({ className, error, hint, ...props }: MessageProps) {
  const errorText = Array.isArray(error) ? error[0] : error;
  if (errorText) {
    return (
      <span className={cn('text-xs text-red-600', className)} {...props}>
        {errorText}
      </span>
    );
  }
  if (hint) {
    return (
      <span className={cn('text-xs text-gray-500', className)} {...props}>
        {hint}
      </span>
    );
  }
  return null;
}

export const FormField = { Root, Label, Message };
