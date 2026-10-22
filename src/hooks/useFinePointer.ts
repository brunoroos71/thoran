import { useEffect, useState } from 'react';

/** true em desktop com mouse e sem prefers-reduced-motion: liga os efeitos de cursor. */
export function useFinePointer() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const q = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const set = () => setOk(q.matches);
    set();
    q.addEventListener('change', set);
    return () => q.removeEventListener('change', set);
  }, []);
  return ok;
}
