import { ArrowRight, CalendarPlus, Clock, MapPin, Trophy } from 'lucide-react';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg, fmtLong, mapsUrl, relDay, roundLabel, signed } from '../lib/format';
import { won } from '../lib/stats';
import { downloadIcs } from '../lib/ics';
import { Card, FormDots, GameRow, SectionTitle, Stat, TeamBadge, TeamName } from '../components/ui';

export default function Home() {
  const { data, teams, me, teamStats, standings, upcomingGames, playedGames, playersByTeam } = useData();
  const meTeam = teams[me];
  const s = teamStats[me];
  const row = standings.find((r) => r.team === me);
  const next = upcomingGames.find((g) => g.home === me || g.away === me);
  const last = [...playedGames].reverse().find((g) => g.home === me || g.away === me);
  const myUpcoming = upcomingGames.filter((g) => g.home === me || g.away === me);
  const scorers = (playersByTeam[me] ?? []).filter((p) => p.gp > 0).slice(0, 5);
  const latestRound = [...playedGames].reverse()[0];
  const roundGames = latestRound ? data.games.filter((g) => g.leg === latestRound.leg && g.round === latestRound.round) : [];

  return (
    <div className="space-y-6">
      {/* Prossima partita */}
      {next && (
        <Card className="overflow-hidden">
          <div className="bg-ink-950 px-5 py-5 text-white sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium uppercase tracking-wider text-ink-400">
              <span>Prossima partita · {roundLabel(next)}</span>
              {relDay(next.date) && <span className="rounded-full bg-ball-500 px-2.5 py-0.5 text-white">{relDay(next.date)}</span>}
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {[next.home, next.away].map((id, i) => (
                <a key={id} href={href('squadra', id)} className={`flex flex-col items-center gap-2 text-center ${i === 1 ? 'order-3' : ''}`}>
                  <TeamBadge id={id} size="xl" />
                  <span className="text-[15px] font-semibold leading-tight sm:text-lg">{teams[id].name}</span>
                  <span className="text-[11px] text-ink-400">
                    {teamStats[id].won}V – {teamStats[id].lost}P
                  </span>
                </a>
              ))}
              <span className="order-2 text-sm font-semibold text-ink-500">VS</span>
            </div>
          </div>
          <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-3 sm:px-7">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="shrink-0 text-ink-400" />
              <span>
                <span className="font-semibold capitalize">{fmtLong(next.date)}</span>
                <span className="text-ink-500"> · ore {next.time ?? 'da definire'}</span>
              </span>
            </div>
            <a href={mapsUrl(next.venue)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:underline">
              <MapPin size={16} className="shrink-0 text-ink-400" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{next.venue.name}</span>
                <span className="block truncate text-ink-500">
                  {next.venue.address}, {next.venue.city}
                </span>
              </span>
            </a>
            <div className="flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => downloadIcs(myUpcoming, teams, 'aesis-partite.ics', `${meTeam.name} · partite`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-[13px] font-medium hover:bg-ink-50"
              >
                <CalendarPlus size={15} /> Aggiungi al calendario
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Situazione squadra */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Posizione" value={row ? `${row.pos}°` : '—'} sub={row ? `${row.points} punti in classifica` : undefined} accent />
        <Stat label="Record" value={`${s.won} – ${s.lost}`} sub={s.streak ? `${s.streak.win ? 'Vittorie' : 'Sconfitte'} consecutive: ${s.streak.count}` : '—'} />
        <Stat label="Punti fatti / gara" value={fmtAvg(s.avgFor)} sub={`Subiti ${fmtAvg(s.avgAgainst)}`} />
        <Stat label="Differenza punti" value={signed(s.diff)} sub={<FormDots form={s.form} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          {last && (
            <Card className="p-4 sm:p-5">
              <SectionTitle
                action={
                  <a href={href('partita', last.id)} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-950">
                    Tabellino <ArrowRight size={14} />
                  </a>
                }
              >
                Ultima partita · {won(last, me) ? 'vittoria' : 'sconfitta'}
              </SectionTitle>
              <GameRow g={last} />
            </Card>
          )}

          <Card className="p-4 sm:p-5">
            <SectionTitle
              action={
                <a href="#/calendario" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-950">
                  Calendario <ArrowRight size={14} />
                </a>
              }
            >
              Ultima giornata · {latestRound ? roundLabel(latestRound) : ''}
            </SectionTitle>
            <div className="-mx-1">
              {roundGames.map((g) => (
                <GameRow key={g.id} g={g} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 sm:p-5">
            <SectionTitle
              action={
                <a href="#/classifica" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-950">
                  Completa <ArrowRight size={14} />
                </a>
              }
            >
              Classifica
            </SectionTitle>
            <ol className="space-y-0.5">
              {standings.map((r) => (
                <li key={r.team}>
                  <a
                    href={href('squadra', r.team)}
                    className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-[14px] transition hover:bg-ink-50 ${r.team === me ? 'bg-ball-50' : ''}`}
                  >
                    <span className="w-5 text-right text-[12px] font-semibold tabular-nums text-ink-400">{r.pos}</span>
                    <TeamBadge id={r.team} size="sm" />
                    <TeamName id={r.team} link={false} className="min-w-0 flex-1 truncate" />
                    <span className="text-[12px] tabular-nums text-ink-400">
                      {r.won}-{r.lost}
                    </span>
                    <span className="w-6 text-right font-bold tabular-nums">{r.points}</span>
                  </a>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionTitle
              action={
                <a href={href('squadra', me)} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-950">
                  Roster <ArrowRight size={14} />
                </a>
              }
            >
              Migliori marcatori {meTeam.short}
            </SectionTitle>
            {scorers.length === 0 ? (
              <p className="text-sm text-ink-500">Nessun tabellino disponibile.</p>
            ) : (
              <ol className="space-y-1">
                {scorers.map((p, i) => (
                  <li key={p.key}>
                    <a href={href('giocatore', p.team, p.name)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ink-50">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${i === 0 ? 'bg-ball-500 text-white' : 'bg-ink-100 text-ink-600'}`}>
                        {i === 0 ? <Trophy size={13} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{p.name}</span>
                      <span className="text-[12px] text-ink-400">{p.gp} pg</span>
                      <span className="w-14 text-right text-[15px] font-bold tabular-nums">{fmtAvg(p.avg)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-right text-[11px] text-ink-400">punti di media a partita</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
