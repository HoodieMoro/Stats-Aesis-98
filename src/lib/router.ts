import { useEffect, useState } from 'react';

/** Router minimale basato sull'hash: funziona su qualsiasi hosting statico (GitHub Pages). */
export function useRoute(): string[] {
  const read = () =>
    decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
      .split('/')
      .filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (...parts: string[]) => `#/${parts.map((p) => encodeURIComponent(p)).join('/')}`;
