import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import config from '../config.mjs';
import { get, qs } from './http.mjs';
import { titleCase } from './fip.mjs';

/** Trova l'URL del calendario PDF più recente tra i documenti del Comitato Regionale. */
export async function findCalendarPdf() {
  const { site, query } = config.fip.calendarSearch;
  const list = await get(
    `${site}/wp-json/wp/v2/media?${qs({ search: query, per_page: 20, orderby: 'date', order: 'desc', _fields: 'date,source_url' })}`,
    { as: 'json' },
  );
  const pdfs = (list ?? []).filter((m) => /calend/i.test(m.source_url) && /\.pdf$/i.test(m.source_url));
  return pdfs[0]?.source_url ?? null;
}

const PROVINCES = { ANCONA: "AN", MACERATA: "MC", PESARO: "PU", URBINO: "PU", FERMO: "FM", "ASCOLI PICENO": "AP", ASCOLI: "AP", PERUGIA: "PG", TERNI: "TR" };
const provinceCode = (s) => PROVINCES[s.toUpperCase().trim()] ?? s.toUpperCase().trim();

const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Associa il nome (anche troncato) del PDF a un codice squadra confrontando i prefissi. */
function matchTeam(pdfName, fipNames) {
  const n = norm(pdfName);
  let best = null;
  for (const [code, names] of Object.entries(fipNames)) {
    for (const f of names) {
      const m = norm(f);
      if (!m) continue;
      if (n.startsWith(m) || m.startsWith(n)) {
        const score = Math.min(n.length, m.length);
        if (!best || score > best.score) best = { code, score };
      }
    }
  }
  return best?.code ?? null;
}

/**
 * Legge il calendario PDF ufficiale usando le coordinate del testo:
 * colonne "Gara N", "Squadra A", "Squadra B", "Giorno Data", "Ora".
 */
export async function parseCalendarPdf(url, fipNames, log) {
  const bytes = await get(url, { as: 'buffer' });
  const doc = await getDocument({ data: bytes, verbosity: 0 }).promise;
  const lines = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const { items } = await (await doc.getPage(i)).getTextContent();
    const rows = [];
    for (const it of items) {
      const s = it.str.trim();
      if (!s) continue;
      const y = it.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) <= 2.5);
      if (!row) rows.push((row = { y, cells: [] }));
      row.cells.push({ x: it.transform[4], s });
    }
    rows.sort((a, b) => b.y - a.y).forEach((r) => lines.push(r.cells.sort((a, b) => a.x - b.x)));
  }

  // colonne dall'intestazione
  const header = lines.find((l) => l.some((c) => /Squadra A/.test(c.s)));
  const colA = header.find((c) => /Squadra A/.test(c.s)).x;
  const colB = header.find((c) => /Squadra B/.test(c.s)).x;
  const colDay = header.find((c) => /Giorno/.test(c.s)).x;

  const games = [];
  let round = 0;
  let leg = 1;
  let cur = null;
  for (const cells of lines) {
    const text = cells.map((c) => c.s).join(' ');
    const rh = text.match(/^(\d+)\s+Giornata di (andata|ritorno)/i);
    if (rh) {
      round = Number(rh[1]);
      leg = /ritorno/i.test(rh[2]) ? 2 : 1;
      cur = null;
      continue;
    }
    const first = cells[0];
    if (/^\d{3,5}$/.test(first.s) && first.x < colA - 5) {
      const a = cells.filter((c) => c.x >= colA - 5 && c.x < colB - 5).map((c) => c.s).join(' ');
      const b = cells.filter((c) => c.x >= colB - 5 && c.x < colDay - 5).map((c) => c.s).join(' ');
      const date = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      const time = text.match(/\b(\d{1,2}):(\d{2})\b/);
      cur = {
        id: String(Number(first.s)),
        round,
        leg,
        a,
        b,
        date: date ? `${date[3]}-${date[2]}-${date[1]}` : null,
        time: time ? `${time[1].padStart(2, '0')}:${time[2]}` : null,
        venueText: '',
      };
      games.push(cur);
      continue;
    }
    if (!cur || /^(Pagina|Data:|Ora:|CALENDARIO|Campionato:|Fase|Girone|Gara N|FEDERAZIONE|CR MARCHE|COMUNICATO|UFFICIO|N\. \d)/.test(text)) continue;
    // continuazione dei nomi squadra (testo nelle colonne A/B)
    const inA = cells.filter((c) => c.x >= colA - 5 && c.x < colB - 5);
    const inB = cells.filter((c) => c.x >= colB - 5 && c.x < colDay - 5);
    const isVenue = / - /.test(text) || /^\(/.test(text) || (cur.venueText && !/\)\s*$/.test(cur.venueText));
    if (isVenue) {
      cur.venueText = `${cur.venueText} ${text}`.trim();
    } else if (inA.length || inB.length) {
      if (inA.length) cur.a += ` ${inA.map((c) => c.s).join(' ')}`;
      if (inB.length) cur.b += ` ${inB.map((c) => c.s).join(' ')}`;
    }
  }

  const out = [];
  for (const g of games) {
    const home = matchTeam(g.a, fipNames);
    const away = matchTeam(g.b, fipNames);
    if (!home || !away) {
      log(`  ⚠️  PDF gara ${g.id}: squadre non riconosciute (${g.a} / ${g.b})`);
      continue;
    }
    const parts = g.venueText.split(' - ').map((s) => s.trim());
    const prov = (parts.at(-1) ?? '').replace(/[()]/g, '');
    out.push({
      id: g.id,
      round: g.round,
      leg: g.leg,
      date: g.date,
      time: g.time,
      home,
      away,
      homePts: null,
      awayPts: null,
      played: false,
      status: 'da calendario',
      venue: {
        name: parts[0] ?? '',
        address: parts.length >= 4 ? parts.slice(1, -2).join(' - ') : parts[1] ?? '',
        city: titleCase(parts.length >= 3 ? parts.at(-2) : ''),
        province: provinceCode(prov),
      },
      referees: [],
      source: 'fip-pdf',
    });
  }
  log(`Calendario PDF: ${out.length} gare lette`);
  return out;
}
