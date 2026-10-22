import { useEffect } from 'react';

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Thoran` : 'Thoran · Veja o raio antes do trovão';
  }, [title]);
}
