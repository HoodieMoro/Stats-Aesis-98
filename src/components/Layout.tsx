import type { ReactNode } from 'react';
import { CalendarDays, Home, ListOrdered, Shield, Users } from 'lucide-react';
import { useData } from '../lib/data';
import { fmtStamp } from '../lib/format';

const NAV = [
  { to: '', label: 'Home', icon: Home },
  { to: 'classifica', label: 'Classifica', icon: ListOrdered },
  { to: 'calendario', label: 'Calendario', icon: CalendarDays },
  { to: 'giocatori', label: 'Giocatori', icon: Users },
  { to: 'squadre', label: 'Squadre', icon: Shield },
];

const ACTIVE: Record<string, string> = { squadra: 'squadre', giocatore: 'giocatori', partita: 'calendario' };

export default function Layout({ section, children }: { section: string; children: ReactNode }) {
  const { data } = useData();
  const current = ACTIVE[section] ?? section;
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-ink-100/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900">
              <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
                <circle cx="16" cy="16" r="13" fill="none" stroke="#f97316" strokeWidth="2" />
                <path d="M3 16h26M16 3v26M7 7c5 4 5 14 0 18M25 7c-5 4-5 14 0 18" fill="none" stroke="#f97316" strokeWidth="1.6" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block text-[14px] font-extrabold tracking-tight">AESIS STATS</span>
              <span className="mt-0.5 block text-[11px] text-ink-500">
                {data.league} · {data.season}
              </span>
            </span>
          </a>
          <nav className="ml-auto hidden gap-1 md:flex" aria-label="Sezioni">
            {NAV.map((n) => (
              <a
                key={n.to}
                href={`#/${n.to}`}
                aria-current={current === n.to ? 'page' : undefined}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  current === n.to ? 'bg-white text-ink-950 shadow-soft' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-[12px] leading-relaxed text-ink-400 sm:px-6">
        <p>
          Aggiornato il {fmtStamp(data.updatedAt)}. Fonti:{' '}
          <a className="underline hover:text-ink-700" href={data.sources.fip} target="_blank" rel="noopener noreferrer">
            FIP – risultati ufficiali
          </a>
          {data.sources.calendarPdf && (
            <>
              ,{' '}
              <a className="underline hover:text-ink-700" href={data.sources.calendarPdf} target="_blank" rel="noopener noreferrer">
                calendario FIP Marche
              </a>
            </>
          )}
          ,{' '}
          <a className="underline hover:text-ink-700" href={data.sources.basketmarche} target="_blank" rel="noopener noreferrer">
            tabellini di basketmarche.it
          </a>
          .
        </p>
        <p className="mt-1">Sito non ufficiale realizzato per la squadra. I punti dei giocatori sono quelli riportati nei tabellini pubblicati.</p>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Sezioni"
      >
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = current === n.to;
            return (
              <a
                key={n.to}
                href={`#/${n.to}`}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${active ? 'text-ink-950' : 'text-ink-400'}`}
              >
                <n.icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-ball-600' : ''} />
                {n.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
