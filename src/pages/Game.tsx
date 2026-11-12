import { AlertTriangle, CalendarPlus, Clock, ExternalLink, MapPin, Flag } from 'lucide-react';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtLong, mapsUrl, roundLabel } from '../lib/format';
import { downloadIcs } from '../lib/ics';
import { Card, Empty, SectionTitle, TeamBadge } from '../components/ui';
import type { BoxPlayer } from '../types';

function BoxTable({ team, players, coach }: { team: string; players: BoxPlayer[]; coach: string | null }) {
  const { teams } = useData();
  const sorted = [...players].sort((a, b) => (b.pts ?? -1) - (a.pts ?? -1));
  const total = players.reduce((s, p) => s + (p.pts ?? 0), 0);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-ink-100 px-4 py-3">
        <TeamBadge id={team} size="sm" />
        <a href={href('squadra', team)} className="font-semibold hover:underline">
          {teams[team]?.name}
        </a>
      </div>
      <table className="w-full text-[14px]">
        <tbody>
          {sorted.map((p) => (
            <tr key={p.name} className="border-b border-ink-100 last:border-0">
              <td className="py-2 pl-4">
                <a href={href('giocatore', team, p.name)} className={`hover:underline ${p.played ? '' : 'text-ink-400'}`}>
                  {p.name}
                </a>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {p.played ? <span className="font-semibold">{p.pts}</span> : <span className="text-[12px] text-ink-400">n.e.</span>}
              </td>
            </tr>
          ))}
          <tr className="bg-ink-50 text-[13px]">
            <td className="py-2 pl-4 text-ink-500">Totale tabellino{coach ? ` · All. ${coach}` : ''}</td>
            <td className="py-2 pr-4 text-right font-bold tabular-nums">{total}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

export default function Game({ id }: { id: string }) {
  const { data, teams, me } = useData();
  const g = data.games.find((x) => x.id === id);
  if (!g) return <Empty>Partita non trovata.</Empty>;
  const homeWon = g.played && g.homePts! > g.awayPts!;
  const box = g.boxscore;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-ink-950 px-5 py-6 text-white sm:px-8">
          <div className="text-center text-[12px] font-medium uppercase tracking-wider text-ink-400">
            {roundLabel(g)} · gara n. {g.id}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <a href={href('squadra', g.home)} className="flex flex-col items-center gap-2 text-center">
              <TeamBadge id={g.home} size="xl" />
              <span className={`text-[15px] leading-tight sm:text-lg ${homeWon ? 'font-bold' : 'font-medium text-ink-300'}`}>{teams[g.home].name}</span>
            </a>
            <div className="text-center">
              {g.played ? (
                <div className="text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl">
                  <span className={homeWon ? '' : 'text-ink-400'}>{g.homePts}</span>
                  <span className="mx-2 text-ink-600">–</span>
                  <span className={!homeWon ? '' : 'text-ink-400'}>{g.awayPts}</span>
                </div>
              ) : (
                <div className="text-lg font-semibold text-ink-400">{g.time ?? 'VS'}</div>
              )}
              <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-500">{g.played ? 'Finale' : 'Da giocare'}</div>
            </div>
            <a href={href('squadra', g.away)} className="flex flex-col items-center gap-2 text-center">
              <TeamBadge id={g.away} size="xl" />
              <span className={`text-[15px] leading-tight sm:text-lg ${g.played && !homeWon ? 'font-bold' : g.played ? 'font-medium text-ink-300' : 'font-medium'}`}>
                {teams[g.away].name}
              </span>
            </a>
          </div>
        </div>
        <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-3 sm:px-8">
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="mt-0.5 shrink-0 text-ink-400" />
            <span>
              <span className="font-semibold capitalize">{fmtLong(g.date)}</span>
              <span className="block text-ink-500">ore {g.time ?? 'da definire'}</span>
            </span>
          </div>
          <a href={mapsUrl(g.venue)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 hover:underline">
            <MapPin size={16} className="mt-0.5 shrink-0 text-ink-400" />
            <span className="min-w-0">
              <span className="block font-semibold">{g.venue.name}</span>
              <span className="block text-ink-500">
                {g.venue.address}, {g.venue.city} ({g.venue.province})
              </span>
            </span>
          </a>
          <div className="flex items-start gap-2.5">
            <Flag size={16} className="mt-0.5 shrink-0 text-ink-400" />
            <span>
              <span className="font-semibold">Arbitri</span>
              <span className="block text-ink-500">{g.referees.length ? g.referees.join(', ') : 'Non ancora designati'}</span>
            </span>
          </div>
        </div>
        {!g.played && (
          <div className="border-t border-ink-100 px-5 py-3 sm:px-8">
            <button
              type="button"
              onClick={() => downloadIcs([g], teams, `gara-${g.id}.ics`, `${teams[g.home].short} - ${teams[g.away].short}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-[13px] font-medium hover:bg-ink-50"
            >
              <CalendarPlus size={15} /> Aggiungi al calendario
            </button>
          </div>
        )}
      </Card>

      {box?.quarters && box.quarters.length > 0 && (
        <Card className="overflow-x-auto p-4 sm:p-5">
          <SectionTitle>Parziali</SectionTitle>
          <table className="w-full min-w-[360px] text-[14px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="pb-2 text-left font-semibold">Squadra</th>
                {box.quarters.map((_, i) => (
                  <th key={i} className="pb-2 font-semibold">
                    {i < 4 ? `${i + 1}°Q` : `OT${i - 3}`}
                  </th>
                ))}
                <th className="pb-2 font-semibold">Tot</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((side) => {
                const team = side === 0 ? g.home : g.away;
                return (
                  <tr key={side} className={team === me ? 'bg-ball-50' : ''}>
                    <td className="py-1.5 pr-2 font-medium">{teams[team].short}</td>
                    {box.quarters!.map((q, i) => {
                      const mine = q[side];
                      const other = q[1 - side];
                      return (
                        <td key={i} className={`text-center tabular-nums ${mine > other ? 'font-bold' : 'text-ink-500'}`}>
                          {mine}
                        </td>
                      );
                    })}
                    <td className="text-center font-bold tabular-nums">{side === 0 ? g.homePts : g.awayPts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {box ? (
        <>
          {box.check === 'mismatch' && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Il tabellino pubblicato dalla fonte è incompleto: la somma dei punti dei giocatori non coincide con il risultato ufficiale.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <BoxTable team={g.home} players={box.home} coach={box.homeCoach} />
            <BoxTable team={g.away} players={box.away} coach={box.awayCoach} />
          </div>
          <a href={box.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
            Tabellino originale su basketmarche.it <ExternalLink size={13} />
          </a>
        </>
      ) : g.played ? (
        <Empty>Il tabellino di questa partita non è ancora stato pubblicato.</Empty>
      ) : null}
    </div>
  );
}
