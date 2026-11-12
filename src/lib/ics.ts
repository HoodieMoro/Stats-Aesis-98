import type { Game, Team } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

/** Genera un file .ics con le partite (ora locale italiana) e lo scarica. */
export function downloadIcs(games: Game[], teams: Record<string, Team>, filename: string, title: string) {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aesis Stats//IT', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(title)}`];
  for (const g of games) {
    if (!g.date) continue;
    const [y, m, d] = g.date.split('-').map(Number);
    const [hh, mm] = (g.time ?? '21:00').split(':').map(Number);
    const start = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
    const endDate = new Date(y, m - 1, d, hh + 2, mm);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    const loc = [g.venue.name, g.venue.address, g.venue.city].filter(Boolean).join(', ');
    lines.push(
      'BEGIN:VEVENT',
      `UID:gara-${g.id}@aesis-stats`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Rome:${start}`,
      `DTEND;TZID=Europe/Rome:${end}`,
      `SUMMARY:${esc(`${teams[g.home]?.name} - ${teams[g.away]?.name}`)}`,
      `LOCATION:${esc(loc)}`,
      `DESCRIPTION:${esc(`Divisione Regionale 2 · ${g.round}ª giornata di ${g.leg === 1 ? 'andata' : 'ritorno'} · gara n. ${g.id}`)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
