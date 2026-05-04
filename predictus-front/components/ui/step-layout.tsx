import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/helpers/utils';

interface RootProps extends ComponentProps<'section'> {
  children: ReactNode;
}

function Root({ className, children, ...props }: RootProps) {
  return (
    <section
      className={cn('flex min-h-[calc(100dvh-80px)] flex-col px-5 py-6', className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface HeaderProps {
  title: string;
  description?: string;
}

function Header({ title, description }: HeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
    </header>
  );
}

function Body({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-1 flex-col', className)} {...props} />;
}

export const StepLayout = { Root, Header, Body };
