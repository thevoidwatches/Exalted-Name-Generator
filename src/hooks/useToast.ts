import { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_MS } from '@/styles';

/** A short confirmation message that clears itself. */
export function useToast(duration: number = TOAST_MS) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback(
    (text: string) => {
      setMessage(text);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, show };
}
