'use client';

import { useActionState } from 'react';
import { type FormState, INITIAL_STATE } from '@/lib/http/form-state';

type Action<T> = (prev: FormState<T>, formData: FormData) => Promise<FormState<T>>;

export function useFormState<T>(
  action: Action<T>,
  onSuccess?: (state: FormState<T>) => Promise<void> | void,
  onError?: (state: FormState<T>) => Promise<void> | void,
  initialState?: FormState<T>,
) {
  const [state, formAction, isPending] = useActionState<FormState<T>, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result.success) await onSuccess?.(result);
      else await onError?.(result);
      return result;
    },
    initialState ?? (INITIAL_STATE as FormState<T>),
  );

  return [state, formAction, isPending] as const;
}
