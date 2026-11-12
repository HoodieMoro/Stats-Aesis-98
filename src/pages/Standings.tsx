import { useState } from 'react';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtAvg, signed } from '../lib/format';
import { Card, FormDots, PageHeader, TeamBadge, TeamName } from '../components/ui';

type View = 'totale' | 'casa' | 'trasferta';

export default function Standings() {
  const { standings, me, data } = useData();
  const [view, setView] = useState<View>('totale');

  const rows = standings.map((r) => {
    const s = r.stats;
    const split = view === 'casa' ? s.home : view === 'trasferta' ? s.away : null;
    return split
      ? { ...r, played: split.played, won: split.won, lost: split.lost, pf: split.pf, pa: split.pa, points: split.won * 2 }
      : r;
  });
  if (view !== 'totale') rows.sort((a, b) => b.points - a.points || b.pf - b.pa - (a.pf - a.pa));

  return (
    <>
      <PageHeader title="Classifica" subtitle={`${data.league} · classifica FIP aggiornata con gli ultimi risultati`}>
        <div role="tablist" className="inline-flex rounded-xl bg-ink-200/60 p-0.5 text-[13px]">
          {(['totale', 'casa', 'trasferta'] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-[10px] px-3 py-1.5 font-medium capitalize transition ${view === v ? 'bg-white shadow-soft' : 'text-ink-500 hover:text-ink-900'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400">
                <th className="sticky left-0 z-10 bg-white py-3 pl-4 pr-2 text-left font-semibold">Squadra</th>
                <th className="px-2 font-semibold" title="Punti in classifica">Pt</th>
                <th className="px-2 font-semibold" title="Giocate">G</th>
                <th className="px-2 font-semibold" title="Vinte">V</th>
                <th className="px-2 font-semibold" title="Perse">P</th>
                <th className="px-2 font-semibold" title="Punti segnati">PF</th>
                <th className="px-2 font-semibold" title="Punti subiti">PS</th>
                <th className="px-2 font-semibold" title="Media punti segnati">Media F</th>
                <th className="px-2 font-semibold" title="Media punti subiti">Media S</th>
                <th className="px-2 font-semibold" title="Differenza">Diff</th>
                <th className="py-3 pl-2 pr-4 text-left font-semibold">Ultime 5</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const mine = r.team === me;
                const diff = r.pf - r.pa;
                return (
                  <tr key={r.team} className={`border-b border-ink-100 last:border-0 ${mine ? 'bg-ball-50' : 'hover:bg-ink-50'}`}>
                    <td className={`sticky left-0 z-10 py-2.5 pl-4 pr-2 ${mine ? 'bg-ball-50' : 'bg-white'}`}>
                      <a href={href('squadra', r.team)} className="flex items-center gap-2.5">
                        <span className="w-5 text-right text-[12px] font-semibold tabular-nums text-ink-400">{view === 'totale' ? r.pos : i + 1}</span>
                        <TeamBadge id={r.team} size="sm" />
                        <TeamName id={r.team} link={false} className="whitespace-nowrap" />
                        {view === 'totale' && (r.provisional ?? 0) > 0 && (
                          <span className="text-[12px] font-semibold text-ball-600" title="Include risultati non ancora omologati dalla FIP">*</span>
                        )}
                      </a>
                    </td>
                    <td className="px-2 text-center font-bold tabular-nums">
                      {r.points}
                      {view === 'totale' && r.penalty > 0 && <span className="ml-0.5 text-[10px] text-red-600" title="Punti di penalizzazione">−{r.penalty}</span>}
                    </td>
                    <td className="px-2 text-center tabular-nums text-ink-600">{r.played}</td>
                    <td className="px-2 text-center tabular-nums">{r.won}</td>
                    <td className="px-2 text-center tabular-nums">{r.lost}</td>
                    <td className="px-2 text-center tabular-nums text-ink-600">{r.pf}</td>
                    <td className="px-2 text-center tabular-nums text-ink-600">{r.pa}</td>
                    <td className="px-2 text-center tabular-nums">{r.played ? fmtAvg(r.pf / r.played) : '—'}</td>
                    <td className="px-2 text-center tabular-nums">{r.played ? fmtAvg(r.pa / r.played) : '—'}</td>
                    <td className={`px-2 text-center font-medium tabular-nums ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : ''}`}>{signed(diff)}</td>
                    <td className="py-2.5 pl-2 pr-4">
                      <FormDots form={r.stats.form} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-[12px] text-ink-400">
        2 punti per vittoria.
        {standings.some((r) => (r.provisional ?? 0) > 0) && (
          <> * Include risultati già giocati ma non ancora omologati dalla FIP (la classifica ufficiale li conta dopo l'omologazione).</>
        )}{' '}
        Le viste "casa" e "trasferta" sono calcolate dai risultati delle partite giocate.
      </p>
    </>
  );
}
