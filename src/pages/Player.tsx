import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg, fmtDay } from '../lib/format';
import { playerKey, won } from '../lib/stats';
import { Bars, Card, Empty, PageHeader, SectionTitle, Stat, TeamBadge, TeamName } from '../components/ui';

export default function Player({ team, name }: { team: string; name: string }) {
  const { players, teams, playersByTeam } = useData();
  const p = players.find((x) => x.key === playerKey(team, name));
  if (!p) return <Empty>Giocatore non trovato.</Empty>;

  const rank = (playersByTeam[team] ?? []).filter((x) => x.gp > 0).findIndex((x) => x.key === p.key) + 1;
  const best = p.games.reduce<number>((bi, g, i, arr) => ((g.pts ?? -1) > (arr[bi]?.pts ?? -1) ? i : bi), 0);
  const opp = (gid: string) => {
    const g = p.games.find((x) => x.game.id === gid)!.game;
    return g.home === team ? g.away : g.home;
  };

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <TeamBadge id={team} size="sm" /> <TeamName id={team} />
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Media punti" value={p.gp ? fmtAvg(p.avg) : '—'} sub={rank ? `${rank}° in squadra` : undefined} accent />
        <Stat label="Punti totali" value={p.total} />
        <Stat label="Partite giocate" value={p.gp} sub={`su ${p.games.length} a referto`} />
        <Stat label="Massimo" value={p.gp ? p.max : '—'} />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <SectionTitle>Punti partita per partita</SectionTitle>
        <Bars
          values={p.games.map((g) => (g.played ? g.pts ?? 0 : null))}
          labels={p.games.map((g) => teams[opp(g.game.id)]?.short.split(' ')[0] ?? '')}
          highlight={p.gp ? best : undefined}
        />
      </Card>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400">
              <th className="py-3 pl-4 text-left font-semibold">Data</th>
              <th className="px-2 text-left font-semibold">Avversario</th>
              <th className="px-2 font-semibold">Risultato</th>
              <th className="py-3 pl-2 pr-4 text-right font-semibold">Punti</th>
            </tr>
          </thead>
          <tbody>
            {p.games.map(({ game: g, pts, played }) => {
              const home = g.home === team;
              const w = won(g, team);
              return (
                <tr key={g.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="py-2.5 pl-4 text-[12px] capitalize text-ink-500">{fmtDay(g.date)}</td>
                  <td className="px-2">
                    <a href={href('partita', g.id)} className="hover:underline">
                      <span className="text-ink-400">{home ? 'vs' : '@'}</span> {teams[home ? g.away : g.home]?.name}
                    </a>
                  </td>
                  <td className="px-2 text-center text-[13px] tabular-nums">
                    <span className={`mr-1.5 inline-block w-4 font-bold ${w ? 'text-emerald-700' : 'text-ink-400'}`}>{w ? 'V' : 'P'}</span>
                    {home ? `${g.homePts}-${g.awayPts}` : `${g.awayPts}-${g.homePts}`}
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-right font-bold tabular-nums">{played ? pts : <span className="text-[12px] font-normal text-ink-400">non entrato</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
