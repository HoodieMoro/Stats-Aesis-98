import config from '../config.mjs';
import { get, qs } from './http.mjs';

const clean = (s) =>
  String(s ?? '')
    .replace(/[їЇ]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const score = (uff, raw) => (uff >= 0 ? uff : raw >= 0 ? raw : null);

function mapGame(p) {
  const referees = [
    [p.nome_primo_arbitro, p.cognome_primo_arbitro],
    [p.nome_secondo_arbitro, p.cognome_secondo_arbitro],
    [p.nome_terzo_arbitro, p.cognome_terzo_arbitro],
  ]
    .filter(([, c]) => c)
    .map(([n, c]) => titleCase(`${n} ${c}`));
  const homePts = score(p.punti_casa_uff, p.punti_casa);
  const awayPts = score(p.punti_ospite_uff, p.punti_ospite);
  return {
    id: String(Number(p.numero_gara)),
    round: Number(p.giornata),
    leg: Number(p.codice_andata_ritorno) === 2 ? 2 : 1,
    date: p.data_partita || null,
    time: p.ora_partita || null,
    home: String(p.C01_B01_CASA_FK),
    away: String(p.C01_B01_OSPITE_FK),
    homeFipName: clean(p.casa),
    awayFipName: clean(p.ospite),
    homePts,
    awayPts,
    played: homePts !== null && awayPts !== null,
    status: clean(p.stato_gara),
    venue: {
      name: clean(p.campo_gioco),
      address: clean(p.indirizzo_campo_gioco),
      city: titleCase(clean(p.citta_campo_gioco)),
      province: clean(p.provincia_campo_gioco),
    },
    referees,
    source: 'fip-api',
  };
}

export function titleCase(s) {
  return clean(s)
    .toLowerCase()
    .replace(/(^|[\s'’.-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

/** Scarica tutte le giornate disponibili dall'API (andata e, quando pubblicato, ritorno). */
export async function fetchFipGames(log) {
  const games = [];
  for (const leg of [1, 2]) {
    let emptyStreak = 0;
    for (let round = 1; round <= config.fip.roundsPerLeg; round++) {
      const url = `${config.fip.api}risultati?${qs({ ...config.fip.params, giornata: round, codice_andata_ritorno: leg })}`;
      const data = await get(url, { as: 'json' });
      const list = (data.partite ?? []).filter((p) => Number(p.codice_andata_ritorno) === leg);
      if (list.length === 0) {
        emptyStreak++;
        if (emptyStreak >= 2 && leg === 2) break; // ritorno non ancora pubblicato
        continue;
      }
      emptyStreak = 0;
      games.push(...list.map(mapGame));
    }
    log(`FIP API: ${games.filter((g) => g.leg === leg).length} gare ${leg === 1 ? 'andata' : 'ritorno'}`);
  }
  return games;
}

export async function fetchFipStandings() {
  const data = await get(`${config.fip.api}classifica?${qs(config.fip.params)}`, { as: 'json' });
  const rows = Array.isArray(data) ? data : Object.values(data ?? {});
  return rows.map((t) => ({
    team: String(t.squadra_codice),
    fipName: clean(t.nome_squadra),
    pos: Number(t.posizione),
    played: Number(t.disputate),
    won: Number(t.vinte),
    lost: Number(t.perse),
    pf: Number(t.punti_segnati),
    pa: Number(t.punti_subiti),
    points: Number(t.punti_classifica),
    penalty: Number(t.punti_penalita) || 0,
    homeVenue: { name: clean(t.squadra_campo_nome), city: titleCase(t.squadra_campo_citta), province: clean(t.squadra_campo_provincia) },
  }));
}
