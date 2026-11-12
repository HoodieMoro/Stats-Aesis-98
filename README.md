# Aesis Stats · Divisione Regionale 2 – Girone B

Sito con classifica, calendario (data, ora, palazzetto), risultati, tabellini e statistiche dei giocatori
del girone dell'**Aesis '98 Jesi**. Si aggiorna da solo e si apre da qualsiasi telefono.

## Da dove arrivano i dati

| Dato | Fonte |
|---|---|
| Calendario, orari, campi, arbitri, risultati, classifica | API ufficiale FIP (`backend.fip.it`) |
| Partite non ancora nel portale FIP (es. ritorno) | Calendario PDF del Comitato Regionale FIP Marche |
| Punti dei giocatori e parziali | Tabellini di basketmarche.it |

Il raccoglitore (`scraper/`) fa poche richieste, con pause tra l'una e l'altra, e salva i tabellini già letti in
`scraper/cache/` per non scaricarli di nuovo.

## Pubblicare il sito (una volta sola, ~10 minuti)

1. Crea un account gratuito su **github.com**.
2. Crea un nuovo repository (es. `aesis-stats`), **pubblico**, senza README.
3. Carica il contenuto di questa cartella nel repository
   (dal sito: *Add file → Upload files*, trascinando tutto **tranne** `node_modules`, `dist` e `.claude`;
   la cartella `.github` va caricata: se il Finder la nasconde premi ⌘ + Maiusc + .).
4. Nel repository vai su **Settings → Pages** e in *Source* scegli **GitHub Actions**.
5. Vai su **Actions**, abilita i workflow se richiesto, apri **Aggiorna sito** → **Run workflow**.
6. Dopo 1–2 minuti il sito è online su `https://<tuo-utente>.github.io/aesis-stats/`.
   Manda questo link nel gruppo della squadra.

Da quel momento il sito si aggiorna da solo ogni sera e ogni mattina.

## Correggere un nome giocatore

Se nei tabellini lo stesso giocatore compare scritto in due modi, in `scraper/config.mjs`:

```js
playerAliases: {
  '042467': { 'Ogiemwony': 'Ogiemwonyi' }, // codice squadra → { nome sbagliato: nome giusto }
},
```

I possibili doppioni vengono segnalati nel log del workflow (voce "Nome ambiguo").

## Nuova stagione

In `scraper/config.mjs` aggiorna `season`, `fip.params.codice_girone` (dal link del portale risultati FIP),
`fip.calendarSearch.query`, `basketmarche.path` e l'elenco `teams`, poi svuota `scraper/cache/tabellini`.

## Sviluppo in locale

```bash
npm install
npm run data   # scarica i dati in public/data/league.json
npm run dev    # http://127.0.0.1:5174
```
