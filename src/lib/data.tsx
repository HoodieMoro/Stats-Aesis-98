import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { League, Team } from '../types';
import { derive, type Derived } from './stats';

interface Ctx extends Derived {
  data: League;
  teams: Record<string, Team>;
  me: string;
}

const DataContext = createContext<Ctx | null>(null);

export function useData(): Ctx {
  const c = useContext(DataContext);
  if (!c) throw new Error('useData fuori da <DataProvider>');
  return c;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<League | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/league.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!data) return null;
    return { data, teams: Object.fromEntries(data.teams.map((t) => [t.id, t])), me: data.highlightTeam, ...derive(data) };
  }, [data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">Dati non disponibili</p>
          <p className="mt-1 text-sm text-ink-500">Impossibile caricare il campionato ({error}). Riprova tra poco.</p>
        </div>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ball-500" aria-label="Caricamento" />
      </div>
    );
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
