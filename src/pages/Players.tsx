import { useMemo, useState } from 'react';
import { ArrowDown, Search } from 'lucide-react';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg } from '../lib/format';
import { Card, PageHeader, TeamBadge } from '../components/ui';

type SortKey = 'avg' | 'total' | 'gp' | 'max' | 'name';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Players() {
  const { players, teams, me, data } = useData();
  const [team, setTeam] = useState<string>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('avg');
  const [minGames, setMinGames] = useState(1);

  const rows = useMemo(() => {
    const term = norm(q.trim());
    const list = players.filter(
      (p) => (team === 'all' || p.team === team) && p.gp >= minGames && (!term || norm(`${p.name} ${teams[p.team]?.name}`).includes(term)),
    );
    const cmp: Record<SortKey, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      avg: (a, b) => b.avg - a.avg || b.total - a.total,
      total: (a, b) => b.total - a.total || b.avg - a.avg,
      gp: (a, b) => b.gp - a.gp || b.avg - a.avg,
      max: (a, b) => b.max - a.max || b.avg - a.avg,
      name: (a, b) => a.name.localeCompare(b.name, 'it'),
    };
    return [...list].sort(cmp[sort]);
  }, [players, team, q, sort, minGames, teams]);

  const Th = ({ k, children, className = '' }: { k: SortKey; children: string; className?: string }) => (
    <th className={`px-2 py-3 font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => setSort(k)}
        className={`inline-flex items-center gap-0.5 uppercase tracking-wider ${sort === k ? 'text-ink-900' : 'hover:text-ink-700'}`}
        aria-label={`Ordina per ${children}`}
      >
        {children}
        {sort === k && <ArrowDown size={11} />}
      </button>
    </th>
  );

  const withBox = data.games.filter((g) => g.boxscore).length;
  const played = data.games.filter((g) => g.played).length;

  return (
    <>
      <PageHeader title="Giocatori" subtitle={`Punti dai tabellini · ${withBox} di ${played} partite giocate con tabellino`} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca giocatore o squadra"
            className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ink-900/10"
          />
        </div>
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm shadow-soft focus:outline-none"
          aria-label="Filtra per squadra"
        >
          <option value="all">Tutte le squadre</option>
          {[...data.teams]
            .sort((a, b) => (a.id === me ? -1 : b.id === me ? 1 : a.name.localeCompare(b.name)))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
        <select
          value={minGames}
          onChange={(e) => setMinGames(Number(e.target.value))}
          className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm shadow-soft focus:outline-none"
          aria-label="Partite minime giocate"
        >
          <option value={0}>Tutti (anche non entrati)</option>
          <option value={1}>Almeno 1 partita</option>
          <option value={2}>Almeno 2 partite</option>
          <option value={3}>Almeno 3 partite</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] text-ink-400">
                <th className="w-10 py-3 pl-4 text-left font-semibold">#</th>
                <Th k="name" className="text-left">
                  Giocatore
                </Th>
                <Th k="gp">PG</Th>
                <Th k="total">Punti</Th>
                <Th k="avg">Media</Th>
                <Th k="max" className="pr-4">
                  Max
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.key} className={`border-b border-ink-100 last:border-0 ${p.team === me ? 'bg-ball-50/60' : 'hover:bg-ink-50'}`}>
                  <td className="py-2 pl-4 text-[12px] tabular-nums text-ink-400">{i + 1}</td>
                  <td className="px-2 py-2">
                    <a href={href('giocatore', p.team, p.name)} className="flex items-center gap-2.5">
                      <TeamBadge id={p.team} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:underline">{p.name}</span>
                        <span className="block truncate text-[11px] text-ink-500">{teams[p.team]?.short}</span>
                      </span>
                    </a>
                  </td>
                  <td className="px-2 text-center tabular-nums text-ink-600">{p.gp}</td>
                  <td className="px-2 text-center tabular-nums">{p.total}</td>
                  <td className="px-2 text-center font-bold tabular-nums">{p.gp ? fmtAvg(p.avg) : '—'}</td>
                  <td className="px-2 pr-4 text-center tabular-nums text-ink-600">{p.gp ? p.max : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-500">Nessun giocatore trovato.</p>}
        </div>
      </Card>
      <p className="mt-3 text-[12px] text-ink-400">
        PG = partite giocate (entrato in campo). I tabellini pubblicati riportano solo i punti: rimbalzi, assist e percentuali non sono disponibili.
        I giocatori sono identificati dal nome scritto nel tabellino.
      </p>
    </>
  );
}
