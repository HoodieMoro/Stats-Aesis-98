/**
 * Configurazione del campionato seguito.
 * Per una nuova stagione aggiornare `fip` (codice_girone), `basketmarche.path` e le squadre.
 */
export default {
  season: '2026/27',
  league: 'Divisione Regionale 2 · Girone B',
  region: 'FIP Marche',
  /** Squadra evidenziata nel sito (codice FIP). */
  highlightTeam: '042467',

  fip: {
    api: 'https://backend.fip.it/api/v1/',
    params: {
      sesso: 'M',
      comitato_codice: 'RMA',
      codice_campionato: 'PM',
      codice_fase: '1',
      codice_girone: '85532',
    },
    roundsPerLeg: 11,
    publicUrl:
      'https://fip.it/risultati/?group=campionati-regionali&regione_codice=MA&comitato_codice=RMA&sesso=M&codice_campionato=PM&codice_fase=1&codice_girone=85532',
    /** Ricerca del calendario PDF ufficiale tra i documenti del Comitato Regionale. */
    calendarSearch: { site: 'https://marche.fip.it', query: 'DR2 gir-B calend 26-27' },
  },

  basketmarche: {
    base: 'https://www.basketmarche.it',
    path: '/campionato-basket/divisione-regionale-2/girone-b',
  },

  /**
   * Squadre: codice FIP → nomi usati dalle varie fonti.
   * `bm` = nome nelle pagine giornata di basketmarche; `pdf` = prefisso nel calendario PDF.
   */
  teams: {
    '042467': { name: "Aesis '98 Jesi", short: 'Aesis 98', bm: ["Aesis '98 Jesi"] },
    '000334': { name: 'Adriatico Ancona', short: 'Adriatico', bm: ['Adriatico Ancona'] },
    '056402': { name: 'Conero Razorbacks', short: 'Razorbacks', bm: ['Conero Razorbacks'] },
    '000568': { name: 'Montevalle Academy', short: 'Montevalle', bm: ['Montevalle Academy'] },
    '052284': { name: 'Unione Basket 2010 Jesi', short: 'Unione Basket', bm: ['Unione Basket 2010 Jesi'] },
    '055995': { name: 'Gladiatores Matelica', short: 'Gladiatores', bm: ['Gladiatores Matelica'] },
    '001433': { name: 'Vis Castelfidardo', short: 'Vis Castelfidardo', bm: ['Vis Castelfidardo'] },
    '030272': { name: 'PB 1992 Polverigi', short: 'Polverigi', bm: ['PB 1992 Polverigi Camerata Basket Blu'] },
    '001423': { name: 'Falconara Basket', short: 'Falconara', bm: ['Falconara Basket'] },
    '054458': { name: 'Project Basket Osimo', short: 'Project Osimo', bm: ['Project Basket Osimo'] },
    '006291': { name: 'Pietralacroce 73 Ancona', short: 'Pietralacroce', bm: ['Pietralacroce 73 Ancona'] },
    '051572': { name: 'Basket School Fabriano', short: 'Basket School', bm: ['Basket School Fabriano'] },
  },

  /**
   * Correzioni dei nomi giocatore nei tabellini (errori di battitura).
   * Formato: { codiceSquadra: { 'Nome errato': 'Nome corretto' } }
   */
  playerAliases: {},

  http: { userAgent: 'AesisStatsBot/1.0 (statistiche per uso della squadra)', delayMs: 700 },
};
