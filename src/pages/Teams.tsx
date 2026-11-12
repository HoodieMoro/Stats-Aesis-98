import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg, signed } from '../lib/format';
import { Card, FormDots, PageHeader, TeamBadge } from '../components/ui';

export default function Teams() {
  const { standings, teams, me } = useData();
  return (
    <>
      <PageHeader title="Squadre" subtitle="Tocca una squadra per risultati, roster e statistiche" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {standings.map((r) => {
          const t = teams[r.team];
          const s = r.stats;
          return (
            <a key={r.team} href={href('squadra', r.team)} className="block transition hover:-translate-y-0.5">
              <Card className={`h-full p-4 ${r.team === me ? 'ring-2 ring-ball-500' : ''}`}>
                <div className="flex items-center gap-3">
                  <TeamBadge id={r.team} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{t.name}</div>
                    <div className="text-[12px] text-ink-500">
                      {r.pos}° · {r.points} pt · {r.won}V {r.lost}P
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">Fatti</div>
                    <div className="font-bold tabular-nums">{fmtAvg(s.avgFor)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">Subiti</div>
                    <div className="font-bold tabular-nums">{fmtAvg(s.avgAgainst)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">Diff.</div>
                    <div className="font-bold tabular-nums">{signed(s.diff)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
                  <span className="truncate">{t.venue?.city ?? ''}</span>
                  <FormDots form={s.form} />
                </div>
              </Card>
            </a>
          );
        })}
      </div>
    </>
  );
}
