import type { Game, Venue } from '../types';

const dayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const stampFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

const toDate = (iso: string) => new Date(`${iso}T12:00:00`);

export const fmtDay = (iso: string | null) => (iso ? dayFmt.format(toDate(iso)).replace('.', '') : 'Da definire');
export const fmtLong = (iso: string | null) => (iso ? longFmt.format(toDate(iso)) : 'Data da definire');
export const fmtStamp = (iso: string) => stampFmt.format(new Date(iso));
export const fmtAvg = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export const roundLabel = (g: Pick<Game, 'round' | 'leg'>) => `${g.round}ª ${g.leg === 1 ? 'andata' : 'ritorno'}`;

export function mapsUrl(v: Venue) {
  const q = [v.name, v.address, v.city, v.province].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

export function relDay(iso: string | null) {
  const d = daysUntil(iso);
  if (d === null) return '';
  if (d === 0) return 'Oggi';
  if (d === 1) return 'Domani';
  if (d > 1 && d < 7) return `Tra ${d} giorni`;
  return '';
}

export function initials(name: string) {
  const words = name.replace(/['’]/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  return (words.length >= 2 ? words[0][0] + words[1][0] : words[0]?.slice(0, 2) ?? '?').toUpperCase();
}
