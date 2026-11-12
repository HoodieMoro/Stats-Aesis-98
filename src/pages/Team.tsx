import { MapPin } from 'lucide-react';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg, mapsUrl, signed } from '../lib/format';
import { Card, Empty, FormDots, GameRow, PageHeader, SectionTitle, Stat, TeamBadge } from '../components/ui';

export default function Team({ id }: { id: string }) {
  const { teams, teamStats, standings, playersByTeam, playedGames, upcomingGames } = useData();
  const t = teams[id];
  if (!t) return <Empty>Squadra non trovata.</Empty>;
  const s = teamStats[id];
  const row = standings.find((r) => r.team === id);
  const results = playedGames.filter((g) => g.home === id || g.away === id).reverse();
  const next = upcomingGames.filter((g) => g.home === id || g.away === id).slice(0, 3);
  const roster = playersByTeam[id] ?? [];
  const pct = (w: number, n: number) => (n ? Math.round((w / n) * 100) : 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <TeamBadge id={id} size="lg" />
            {t.name}
          </span>
        }
        subtitle={
          t.venue ? (
            <a href={mapsUrl(t.venue)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
              <MapPin size={13} /> {t.venue.name}, {t.venue.city}
            </a>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Classifica" value={row ? `${row.pos}°` : '—'} sub={row ? `${row.points} punti` : undefined} accent />
        <Stat label="Vinte – perse" value={`${s.won} – ${s.lost}`} sub={<FormDots form={s.form} />} />
        <Stat label="Punti fatti / gara" value={fmtAvg(s.avgFor)} sub={`totale ${s.pf}`} />
        <Stat label="Punti subiti / gara" value={fmtAvg(s.avgAgainst)} sub={`differenza ${signed(s.diff)}`} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {(
          [
            ['In casa', s.home],
            ['In trasferta', s.away],
          ] as const
        ).map(([label, x]) => (
          <div key={label} className="rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
              <span className="text-[12px] font-medium text-ink-500">{label}</span>
              <span className="text-[11px] text-ink-400">{pct(x.won, x.played)}% vittorie</span>
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums">
              {x.won} – {x.lost}
            </div>
            <div className="text-[12px] tabular-nums text-ink-500">
              {x.played ? `${fmtAvg(x.pf / x.played)} fatti · ${fmtAvg(x.pa / x.played)} subiti` : 'Nessuna partita'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {next.length > 0 && (
            <Card className="p-3 sm:p-4">
              <SectionTitle>Prossime partite</SectionTitle>
              {next.map((g) => (
                <GameRow key={g.id} g={g} showRound focus={id} />
              ))}
            </Card>
          )}
          <Card className="p-3 sm:p-4">
            <SectionTitle>Risultati</SectionTitle>
            {results.length ? results.map((g) => <GameRow key={g.id} g={g} showRound focus={id} />) : <Empty>Nessuna partita giocata.</Empty>}
          </Card>
        </div>

        <Card className="overflow-hidden self-start">
          <div className="px-4 pt-4">
            <SectionTitle>Roster e punti</SectionTitle>
          </div>
          {roster.length === 0 ? (
            <div className="px-4 pb-4">
              <Empty>Nessun tabellino disponibile.</Empty>
            </div>
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="py-2 pl-4 text-left font-semibold">Giocatore</th>
                  <th className="px-2 font-semibold">PG</th>
                  <th className="px-2 font-semibold">Punti</th>
                  <th className="px-2 font-semibold">Media</th>
                  <th className="py-2 pl-2 pr-4 font-semibold">Max</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => (
                  <tr key={p.key} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="py-2 pl-4">
                      <a href={href('giocatore', id, p.name)} className="font-medium hover:underline">
                        {p.name}
                      </a>
                    </td>
                    <td className="px-2 text-center tabular-nums text-ink-600">{p.gp}</td>
                    <td className="px-2 text-center tabular-nums">{p.total}</td>
                    <td className="px-2 text-center font-bold tabular-nums">{p.gp ? fmtAvg(p.avg) : '—'}</td>
                    <td className="py-2 pl-2 pr-4 text-center tabular-nums text-ink-600">{p.gp ? p.max : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
