import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useData } from '../lib/data';
import { gameTime } from '../lib/stats';
import { downloadIcs } from '../lib/ics';
import { Card, GameRow, PageHeader } from '../components/ui';
import type { Game } from '../types';

export default function Calendar() {
  const { data, teams, me, upcomingGames } = useData();
  const [team, setTeam] = useState<string>(me);
  const nextRef = useRef<HTMLDivElement>(null);

  const rounds = useMemo(() => {
    const map = new Map<string, { leg: 1 | 2; round: number; games: Game[] }>();
    for (const g of data.games) {
      if (team !== 'all' && g.home !== team && g.away !== team) continue;
      const k = `${g.leg}-${String(g.round).padStart(2, '0')}`;
      if (!map.has(k)) map.set(k, { leg: g.leg, round: g.round, games: [] });
      map.get(k)!.games.push(g);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ key: k, ...v, games: v.games.sort((a, b) => gameTime(a) - gameTime(b)) }));
  }, [data.games, team]);

  const nextGame = upcomingGames.find((g) => team === 'all' || g.home === team || g.away === team);
  const nextKey = nextGame ? `${nextGame.leg}-${String(nextGame.round).padStart(2, '0')}` : null;

  useEffect(() => {
    const t = setTimeout(() => nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [team]);

  const teamGames = data.games.filter((g) => team === 'all' || g.home === team || g.away === team);
  const sortedTeams = [...data.teams].sort((a, b) => (a.id === me ? -1 : b.id === me ? 1 : a.name.localeCompare(b.name)));

  return (
    <>
      <PageHeader title="Calendario" subtitle="Date, orari e campi dal calendario ufficiale FIP · tocca una partita per il tabellino">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium shadow-soft focus:outline-none focus:ring-2 focus:ring-ink-900/10"
            aria-label="Filtra per squadra"
          >
            <option value="all">Tutte le squadre</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {team !== 'all' && (
            <button
              type="button"
              onClick={() =>
                downloadIcs(
                  teamGames.filter((g) => !g.played),
                  teams,
                  `${teams[team].short.toLowerCase().replace(/\W+/g, '-')}-partite.ics`,
                  `${teams[team].name} · partite`,
                )
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium shadow-soft hover:bg-ink-50"
              title="Scarica le prossime partite per il calendario del telefono"
            >
              <CalendarPlus size={15} /> <span className="hidden sm:inline">Aggiungi al calendario</span>
              <span className="sm:hidden">.ics</span>
            </button>
          )}
        </div>
      </PageHeader>

      <div className={team === 'all' ? 'space-y-5' : 'grid gap-x-5 gap-y-1 md:grid-cols-2'}>
        {(team === 'all' ? [1, 2] : [1, 2]).map((leg) => {
          const list = rounds.filter((r) => r.leg === leg);
          if (!list.length) return null;
          return (
            <div key={leg} className={team === 'all' ? '' : 'space-y-1'}>
              <h2 className="mb-2 mt-2 text-[13px] font-semibold uppercase tracking-wider text-ink-500">
                {leg === 1 ? 'Andata' : 'Ritorno'}
              </h2>
              <Card className={team === 'all' ? 'divide-y divide-ink-100 overflow-hidden' : 'divide-y divide-ink-100 overflow-hidden'}>
                {list.map((r) => (
                  <div key={r.key} ref={r.key === nextKey ? nextRef : undefined} className="scroll-mt-24 p-2 sm:p-3">
                    {team === 'all' && (
                      <div className="flex items-center justify-between px-3 pb-1 pt-1">
                        <span className="text-[13px] font-semibold">{r.round}ª giornata</span>
                        {r.key === nextKey && <span className="rounded-full bg-ball-500 px-2 py-0.5 text-[11px] font-semibold text-white">Prossima</span>}
                      </div>
                    )}
                    {r.games.map((g) => (
                      <GameRow key={g.id} g={g} showRound={team !== 'all'} focus={team !== 'all' ? team : undefined} />
                    ))}
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
      {data.games.some((g) => g.source === 'fip-pdf') && (
        <p className="mt-4 text-[12px] text-ink-400">
          Le partite non ancora presenti nel portale FIP (es. girone di ritorno) sono riprese dal calendario ufficiale in PDF: eventuali spostamenti
          compariranno appena la FIP li pubblica.
        </p>
      )}
    </>
  );
}
