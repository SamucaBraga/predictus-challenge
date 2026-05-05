import type { ButtonHTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/helpers/utils';
import { LoadingSpinner } from './loading-spinner';

const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium hover:cursor-pointer',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ],
  variants: {
    variant: {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    },
    size: {
      default: 'h-12 px-4 py-3 text-base',
      sm: 'h-10 px-3 text-sm',
      lg: 'h-14 px-6 text-lg',
    },
    fullWidth: {
      true: 'w-full',
    },
    loading: {
      true: 'pointer-events-none',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
    fullWidth: true,
    loading: false,
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size, fullWidth, loading }), className)}
      disabled={disabled || loading || undefined}
      {...props}
    >
      {loading ? <LoadingSpinner /> : children}
    </button>
  );
}
