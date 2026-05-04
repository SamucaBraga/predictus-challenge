import { cn } from '@/helpers/utils';

interface Props {
  current: number;
  total: number;
  labels?: readonly string[];
}

export function Stepper({ current, total, labels }: Props) {
  return (
    <div className="w-full">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={`step-${i}`}
            className={cn(
              'h-1 flex-1 rounded transition-colors',
              i < current ? 'bg-primary' : 'bg-gray-200',
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>
          Passo {current} de {total}
        </span>
        {labels?.[current - 1] && (
          <span className="font-medium text-gray-700">{labels[current - 1]}</span>
        )}
      </div>
    </div>
  );
}
