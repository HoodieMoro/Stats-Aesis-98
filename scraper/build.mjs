/**
 * Raccoglie i dati del campionato e scrive public/data/league.json.
 *
 *  1. API ufficiale FIP  → calendario, orari, campi, arbitri, risultati, classifica
 *  2. Calendario PDF FIP → gare non ancora presenti nell'API (es. ritorno)
 *  3. basketmarche.it    → tabellini con i punti dei giocatori e i parziali
 *
 * I tabellini già letti sono memorizzati in scraper/cache per ridurre le richieste.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config.mjs';
import { fetchFipGames, fetchFipStandings } from './lib/fip.mjs';
import { findCalendarPdf, parseCalendarPdf } from './lib/calendarPdf.mjs';
import { fetchRound, fetchBoxscore } from './lib/basketmarche.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'scraper/cache/tabellini');
const outFile = join(root, 'public/data/league.json');
const warnings = [];
const log = (m) => console.log(m);
const warn = (m) => {
  warnings.push(m);
  console.warn(`⚠️  ${m}`);
};

mkdirSync(cacheDir, { recursive: true });
mkdirSync(dirname(outFile), { recursive: true });

const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : null;

// ── 1. FIP API ───────────────────────────────────────────────────────────
log('▶ FIP: gare e classifica');
let apiGames = [];
let standings = [];
try {
  apiGames = await fetchFipGames(log);
  standings = await fetchFipStandings();
} catch (e) {
  warn(`API FIP non raggiungibile (${e.message}): uso i dati precedenti dove possibile`);
  apiGames = previous?.games?.filter((g) => g.source === 'fip-api') ?? [];
  standings = previous?.standings ?? [];
}

// nomi FIP per riconoscere le squadre nel PDF
const fipNames = {};
for (const g of apiGames) {
  (fipNames[g.home] ??= new Set()).add(g.homeFipName);
  (fipNames[g.away] ??= new Set()).add(g.awayFipName);
}
for (const s of standings) (fipNames[s.team] ??= new Set()).add(s.fipName);
const fipNameList = Object.fromEntries(Object.entries(fipNames).map(([k, v]) => [k, [...v]]));

// ── 2. Calendario PDF (integrazione) ─────────────────────────────────────
log('▶ FIP: calendario PDF');
let pdfGames = [];
let calendarUrl = previous?.sources?.calendarPdf ?? null;
try {
  calendarUrl = (await findCalendarPdf()) ?? calendarUrl;
  if (calendarUrl) pdfGames = await parseCalendarPdf(calendarUrl, fipNameList, log);
} catch (e) {
  warn(`Calendario PDF non disponibile (${e.message})`);
  pdfGames = previous?.games?.filter((g) => g.source === 'fip-pdf') ?? [];
}

const games = new Map();
for (const g of pdfGames) games.set(g.id, g);
for (const g of apiGames) {
  // l'API ha la precedenza; il PDF completa i nomi dei campi che l'API tronca
  const pdf = games.get(g.id);
  const venue = { ...g.venue };
  if (pdf?.venue?.name && pdf.venue.name.length > venue.name.length && pdf.venue.name.toLowerCase().startsWith(venue.name.toLowerCase())) {
    venue.name = pdf.venue.name;
  }
  const { homeFipName, awayFipName, ...rest } = g;
  games.set(g.id, { ...rest, venue });
}
const known = new Set(Object.keys(config.teams));
for (const g of games.values()) {
  for (const t of [g.home, g.away]) if (!known.has(t)) warn(`Squadra con codice ${t} non presente in config.teams`);
}

// ── 3. basketmarche: tabellini ───────────────────────────────────────────
log('▶ basketmarche: giornate e tabellini');
const bmToCode = {};
for (const [code, t] of Object.entries(config.teams)) for (const n of t.bm) bmToCode[n.toLowerCase()] = code;

const normName = (n) => n.replace(/\s+([A-Z])\.?$/, " $1.").replace(/\s+/g, " ").trim();
const aliasFor = (team, name) => config.playerAliases?.[team]?.[normName(name)] ?? normName(name);
let newTab = 0;
// Riusa i tabellini già associati nell'aggiornamento precedente (stesso risultato):
// le pagine giornata vengono rilette solo dove manca ancora qualche tabellino.
const prevById = new Map((previous?.games ?? []).map((g) => [g.id, g]));
for (const g of games.values()) {
  const p = prevById.get(g.id);
  if (p?.boxscore && p.homePts === g.homePts && p.awayPts === g.awayPts && p.home === g.home) {
    const fix = (team, list) => list.map((x) => ({ ...x, name: aliasFor(team, x.name) }));
    g.boxscore = { ...p.boxscore, home: fix(g.home, p.boxscore.home), away: fix(g.away, p.boxscore.away) };
    if (p.newsUrl) g.newsUrl = p.newsUrl;
  }
}
const roundsToRead = new Set([...games.values()].filter((g) => g.played && !g.boxscore).map((g) => `${g.leg}:${g.round}`));
log(`  giornate da rileggere: ${roundsToRead.size}`);
for (const key of [...roundsToRead].sort()) {
  const [leg, round] = key.split(':').map(Number);
  let page;
  try {
    page = await fetchRound(leg, round);
  } catch (e) {
    warn(`basketmarche giornata ${round} ${leg === 1 ? 'andata' : 'ritorno'} non leggibile (${e.message})`);
    continue;
  }
  for (const row of page.rows) {
    const home = bmToCode[row.home.toLowerCase()];
    const away = bmToCode[row.away.toLowerCase()];
    if (!home || !away) {
      warn(`basketmarche: squadra non riconosciuta "${!home ? row.home : row.away}" (aggiungerla a config.teams[].bm)`);
      continue;
    }
    const game = [...games.values()].find((g) => g.home === home && g.away === away && g.leg === leg);
    if (!game) continue;
    game.newsUrl = page.url;
    if (!row.tabUrl) continue;
    const cacheFile = join(cacheDir, `${row.tabId}.json`);
    let box = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : null;
    if (!box) {
      try {
        box = await fetchBoxscore(row.tabUrl);
        newTab++;
        if (box) writeFileSync(cacheFile, JSON.stringify(box, null, 1));
      } catch (e) {
        warn(`Tabellino ${row.tabId} non leggibile (${e.message})`);
      }
    }
    if (!box) {
      warn(`Tabellino ${row.tabId} (${row.home} - ${row.away}) in formato non riconosciuto`);
      continue;
    }
    const fix = (team, list) => list.map((p) => ({ ...p, name: aliasFor(team, p.name) }));
    const sum = (list) => list.reduce((s, p) => s + (p.pts ?? 0), 0);
    const hp = fix(home, box.home.players);
    const ap = fix(away, box.away.players);
    const check = game.played && sum(hp) === game.homePts && sum(ap) === game.awayPts ? 'ok' : 'mismatch';
    if (check !== 'ok' && game.played) {
      warn(`Gara ${game.id}: somma punti tabellino ${sum(hp)}-${sum(ap)} ≠ risultato ${game.homePts}-${game.awayPts}`);
    }
    game.boxscore = {
      url: row.tabUrl,
      quarters: box.quarters,
      home: hp,
      away: ap,
      homeCoach: box.home.coach,
      awayCoach: box.away.coach,
      check,
    };
  }
}
log(`  tabellini nuovi scaricati: ${newTab}`);

// Possibili doppioni nei nomi (es. "Rossi" e "Rossi M." nella stessa squadra):
// non vengono uniti in automatico (potrebbero essere fratelli), ma segnalati.
const namesByTeam = {};
for (const g of games.values()) {
  if (!g.boxscore) continue;
  for (const [team, list] of [[g.home, g.boxscore.home], [g.away, g.boxscore.away]]) {
    for (const p of list) (namesByTeam[team] ??= new Set()).add(p.name);
  }
}
const hasInitial = (n) => /\s[A-Z]\.$/.test(n);
const surname = (n) => n.replace(/\s+[A-Z]\.$/, '').toLowerCase();
for (const [team, set] of Object.entries(namesByTeam)) {
  const list = [...set];
  for (const bare of list.filter((n) => !hasInitial(n))) {
    const withInit = list.filter((n) => hasInitial(n) && surname(n) === surname(bare));
    if (withInit.length) {
      warn(
        `Nome ambiguo in ${config.teams[team]?.name}: "${bare}" e ${withInit.map((n) => `"${n}"`).join(', ')} — se sono la stessa persona aggiungi un alias in config.playerAliases`,
      );
    }
  }
}

// ── 4. output ────────────────────────────────────────────────────────────
const venues = {};
for (const g of games.values()) if (g.source === 'fip-api' && g.venue?.name) venues[g.home] ??= g.venue;

const teams = Object.entries(config.teams).map(([id, t]) => ({
  id,
  name: t.name,
  short: t.short,
  venue: venues[id] ?? standings.find((s) => s.team === id)?.homeVenue ?? null,
}));

const sortedGames = [...games.values()].sort(
  (a, b) => a.leg - b.leg || a.round - b.round || String(a.date).localeCompare(String(b.date)) || String(a.time).localeCompare(String(b.time)),
);

const out = {
  season: config.season,
  league: config.league,
  region: config.region,
  highlightTeam: config.highlightTeam,
  updatedAt: new Date().toISOString(),
  sources: {
    fip: config.fip.publicUrl,
    calendarPdf: calendarUrl,
    basketmarche: `${config.basketmarche.base}${config.basketmarche.path}`,
  },
  teams,
  standings: standings.map(({ fipName, homeVenue, ...s }) => s),
  games: sortedGames,
  warnings,
};
writeFileSync(outFile, JSON.stringify(out, null, 1));
const played = sortedGames.filter((g) => g.played).length;
const withBox = sortedGames.filter((g) => g.boxscore).length;
log(`✔ Scritto public/data/league.json — ${sortedGames.length} gare (${played} giocate, ${withBox} con tabellino), ${warnings.length} avvisi`);
