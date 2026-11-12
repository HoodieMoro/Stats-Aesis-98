import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { Game } from '../types';
import { useData } from '../lib/data';
import { href } from '../lib/router';
import { fmtDay, initials, mapsUrl, relDay } from '../lib/format';
import { won } from '../lib/stats';

export function TeamBadge({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const { teams, me } = useData();
  const t = teams[id];
  const s = { sm: 'h-6 w-6 text-[9px]', md: 'h-8 w-8 text-[11px]', lg: 'h-11 w-11 text-sm', xl: 'h-16 w-16 text-lg' }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight ${s} ${
        id === me ? 'bg-ball-500 text-white' : 'bg-ink-900 text-white'
      }`}
      aria-hidden="true"
    >
      {initials(t?.short ?? '?')}
    </span>
  );
}

export function TeamName({ id, short = false, link = true, className = '' }: { id: string; short?: boolean; link?: boolean; className?: string }) {
  const { teams, me } = useData();
  const t = teams[id];
  const label = short ? t?.short : t?.name;
  const cls = `${id === me ? 'font-semibold text-ink-950' : ''} ${className}`;
  return link ? (
    <a href={href('squadra', id)} className={`hover:underline ${cls}`}>
      {label}
    </a>
  ) : (
    <span className={cls}>{label}</span>
  );
}

export function FormDots({ form, n = 5 }: { form: boolean[]; n?: number }) {
  const last = form.slice(-n);
  return (
    <span className="inline-flex gap-1" aria-label={`Ultime ${last.length}: ${last.map((w) => (w ? 'V' : 'P')).join(' ')}`}>
      {last.map((w, i) => (
        <span
          key={i}
          className={`flex h-4 w-4 items-center justify-center rounded-[5px] text-[9px] font-bold ${w ? 'bg-emerald-600 text-white' : 'bg-ink-200 text-ink-600'}`}
        >
          {w ? 'V' : 'P'}
        </span>
      ))}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-ink-200/70 bg-white shadow-soft ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Stat({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${accent ? 'bg-ink-900 text-white' : 'bg-ink-100/80'}`}>
      <div className={`text-[11px] font-medium ${accent ? 'text-ink-300' : 'text-ink-500'}`}>{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">{value}</div>
      {sub && <div className={`text-[11px] ${accent ? 'text-ink-300' : 'text-ink-500'}`}>{sub}</div>}
    </div>
  );
}

export function VenueLink({ g, compact = false }: { g: Game; compact?: boolean }) {
  if (!g.venue?.name) return null;
  return (
    <a
      href={mapsUrl(g.venue)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1 text-ink-500 hover:text-ink-900"
      title="Apri in Google Maps"
      onClick={(e) => e.stopPropagation()}
    >
      <MapPin size={12} className="shrink-0" />
      <span className="truncate">{compact ? g.venue.city : `${g.venue.name} · ${g.venue.city}`}</span>
    </a>
  );
}

/** Riga partita: data/ora, squadre, punteggio. Cliccabile verso il dettaglio. */
export function GameRow({ g, showRound = false, focus }: { g: Game; showRound?: boolean; focus?: string }) {
  const { me } = useData();
  const involved = g.home === me || g.away === me;
  const homeWon = g.played && g.homePts! > g.awayPts!;
  const perspective = focus ?? (involved ? me : undefined);
  const outcome = perspective && g.played ? (won(g, perspective) ? 'V' : 'P') : null;
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => (window.location.hash = href('partita', g.id))}
      onKeyDown={(e) => e.key === 'Enter' && (window.location.hash = href('partita', g.id))}
      className={`group grid cursor-pointer grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink-50 sm:grid-cols-[92px_1fr_auto] ${
        involved && !focus ? 'bg-ball-50/60' : ''
      }`}
    >
      <div className="text-[11px] leading-tight text-ink-500">
        <div className="font-medium capitalize text-ink-700">{fmtDay(g.date)}</div>
        <div>{g.time ?? '--:--'}</div>
        {showRound && <div className="text-ink-400">{g.round}ª {g.leg === 1 ? 'And.' : 'Rit.'}</div>}
        {!g.played && relDay(g.date) && <div className="font-semibold text-ball-600">{relDay(g.date)}</div>}
      </div>
      <div className="min-w-0 space-y-1">
        {[
          [g.home, g.homePts, homeWon],
          [g.away, g.awayPts, g.played && !homeWon],
        ].map(([id, pts, w]) => (
          <div key={id as string} className="flex items-center gap-2">
            <TeamBadge id={id as string} size="sm" />
            <span className={`min-w-0 flex-1 truncate text-[14px] ${w ? 'font-semibold text-ink-950' : g.played ? 'text-ink-500' : 'text-ink-800'}`}>
              <TeamName id={id as string} short link={false} className="sm:hidden" />
              <TeamName id={id as string} link={false} className="hidden sm:inline" />
            </span>
            <span className={`w-8 text-right text-[15px] tabular-nums ${w ? 'font-bold' : 'text-ink-500'}`}>{pts ?? ''}</span>
          </div>
        ))}
        <div className="flex min-w-0 pl-8 text-[11px]">
          <VenueLink g={g} />
        </div>
      </div>
      <div className="flex w-6 justify-end">
        {outcome && (
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold ${outcome === 'V' ? 'bg-emerald-600 text-white' : 'bg-ink-200 text-ink-600'}`}>
            {outcome}
          </span>
        )}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">{children}</p>;
}

/** Grafico a barre minimale (punti per partita). */
export function Bars({ values, labels, highlight }: { values: (number | null)[]; labels: string[]; highlight?: number }) {
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  return (
    <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`Punti per partita: ${values.map((v) => v ?? 'ne').join(', ')}`}>
      {values.map((v, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] font-semibold tabular-nums text-ink-700">{v ?? 'ne'}</span>
          <div
            className={`w-full max-w-[38px] rounded-t-lg transition-[height] duration-700 ${v === null ? 'bg-ink-100' : i === highlight ? 'bg-ball-500' : 'bg-ink-800'}`}
            style={{ height: `${v === null ? 4 : Math.max(4, (v / max) * 100)}%` }}
          />
          <span className="w-full truncate text-center text-[10px] text-ink-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
