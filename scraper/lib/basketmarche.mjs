import config from '../config.mjs';
import { get } from './http.mjs';

export function decode(s) {
  return String(s ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Righe di una pagina giornata: squadre, punteggio e link al tabellino. */
export async function fetchRound(leg, round) {
  const url = `${config.basketmarche.base}${config.basketmarche.path}/${leg === 2 ? 'Ritorno' : 'Andata'}/${round}`;
  const html = await get(url);
  const rows = [];
  for (const tr of html.split(/<tr[\s>]/i).slice(1)) {
    const teams = [...tr.matchAll(/title="News squadra:[^"]*"[^>]*>([^<]+)<\/a>/gi)].map((m) => decode(m[1]));
    if (teams.length < 2) continue;
    const score = tr.match(/>\s*(\d{1,3})\s*-\s*(\d{1,3})\s*</);
    const tab = tr.match(/href="([^"]*tabellino-campionato-basket\/[^"]*\/(\d+))"/i);
    rows.push({
      home: teams[0],
      away: teams[1],
      homePts: score ? Number(score[1]) : null,
      awayPts: score ? Number(score[2]) : null,
      tabUrl: tab?.[1] ?? null,
      tabId: tab?.[2] ?? null,
    });
  }
  return { url, rows };
}

/**
 * Interpreta un tabellino testuale, es.:
 *   "Aesis Jesi: Rossi 12, Bianchi ne, Verdi, Neri 4. All. Mosca"
 * "ne" = non entrato; nessun numero = entrato senza segnare (0 punti).
 */
export function parseBoxscore(html) {
  const start = html.indexOf('class="interno_news"');
  if (start < 0) return null;
  let block = html.slice(start, start + 8000);
  block = block.slice(block.indexOf('>') + 1);
  const end = block.search(/<!--|<div/i);
  if (end > 0) block = block.slice(0, end);
  const lines = block
    .split(/<br\s*\/?>/i)
    .map((l) => decode(l.replace(/<[^>]+>/g, ' ')))
    .filter(Boolean);

  const teams = [];
  let quarters = null;
  for (const line of lines) {
    const q = line.match(/^Parziali\s*:\s*(.+)$/i);
    if (q) {
      quarters = [...q[1].matchAll(/(\d{1,3})\s*-\s*(\d{1,3})/g)].map((m) => [Number(m[1]), Number(m[2])]);
      continue;
    }
    if (/^(Progressivi|Uscit[oi]|Arbitri|Note|Spettatori|Tiri|Parziale)/i.test(line)) continue;
    const m = line.match(/^([^:]{2,60}):\s*(.+)$/);
    if (!m || teams.length >= 2) continue;
    let body = m[2];
    let coach = null;
    const c = body.match(/\.?\s*All(?:enatore|\.)\s*:?\s*(.+)$/i);
    if (c) {
      coach = c[1].replace(/[.\s]+$/, '').trim();
      body = body.slice(0, c.index);
    }
    const players = body
      .replace(/\.\s*$/, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const pm = s.match(/^(.+?)\s+(\d{1,3}|ne|n\.e\.)\s*$/i);
        if (!pm) return { name: s.replace(/\.$/, '').trim(), pts: 0, played: true };
        const v = pm[2].toLowerCase();
        if (v === 'ne' || v === 'n.e.') return { name: pm[1].trim(), pts: null, played: false };
        return { name: pm[1].trim(), pts: Number(v), played: true };
      })
      // "Rossi A" e "Rossi A." sono la stessa scrittura: normalizza l'iniziale con il punto
      .map((p) => ({ ...p, name: p.name.replace(/\s+([A-Z])\.?$/, ' $1.').replace(/\s+/g, ' ') }))
      .filter((p) => p.name && p.name.length <= 40);
    if (players.length >= 3) teams.push({ label: m[1].trim(), players, coach });
  }
  if (teams.length < 2) return null;
  return { home: teams[0], away: teams[1], quarters };
}

export async function fetchBoxscore(url) {
  return parseBoxscore(await get(url));
}
