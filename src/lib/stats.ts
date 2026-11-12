import type { Game, League, StandingRow } from '../types';

export interface TeamStats {
  id: string;
  played: number;
  won: number;
  lost: number;
  pf: number;
  pa: number;
  avgFor: number;
  avgAgainst: number;
  diff: number;
  home: { won: number; lost: number; pf: number; pa: number; played: number };
  away: { won: number; lost: number; pf: number; pa: number; played: number };
  /** Ultimi risultati, dal più vecchio al più recente: true = vittoria */
  form: boolean[];
  streak: { win: boolean; count: number } | null;
  best: { game: Game; margin: number } | null;
}

export interface PlayerGame {
  game: Game;
  pts: number | null;
  played: boolean;
}

export interface PlayerStats {
  key: string;
  name: string;
  team: string;
  games: PlayerGame[];
  gp: number;
  total: number;
  avg: number;
  max: number;
  last: number | null;
}

export interface Derived {
  teamStats: Record<string, TeamStats>;
  standings: (StandingRow & { stats: TeamStats })[];
  players: PlayerStats[];
  playersByTeam: Record<string, PlayerStats[]>;
  playedGames: Game[];
  upcomingGames: Game[];
}

export const won = (g: Game, team: string) =>
  g.played && (g.home === team ? g.homePts! > g.awayPts! : g.awayPts! > g.homePts!);

export const playerKey = (team: string, name: string) => `${team}~${name}`;

export function gameTime(g: Game): number {
  if (!g.date) return Number.MAX_SAFE_INTEGER;
  return new Date(`${g.date}T${g.time ?? '00:00'}:00`).getTime();
}

export function derive(data: League): Derived {
  const playedGames = data.games.filter((g) => g.played).sort((a, b) => gameTime(a) - gameTime(b));
  const upcomingGames = data.games.filter((g) => !g.played).sort((a, b) => gameTime(a) - gameTime(b));

  const teamStats: Record<string, TeamStats> = {};
  for (const t of data.teams) {
    const empty = () => ({ won: 0, lost: 0, pf: 0, pa: 0, played: 0 });
    const s: TeamStats = {
      id: t.id,
      played: 0,
      won: 0,
      lost: 0,
      pf: 0,
      pa: 0,
      avgFor: 0,
      avgAgainst: 0,
      diff: 0,
      home: empty(),
      away: empty(),
      form: [],
      streak: null,
      best: null,
    };
    for (const g of playedGames) {
      if (g.home !== t.id && g.away !== t.id) continue;
      const isHome = g.home === t.id;
      const pf = isHome ? g.homePts! : g.awayPts!;
      const pa = isHome ? g.awayPts! : g.homePts!;
      const w = pf > pa;
      s.played++;
      s.pf += pf;
      s.pa += pa;
      if (w) s.won++;
      else s.lost++;
      const split = isHome ? s.home : s.away;
      split.played++;
      split.pf += pf;
      split.pa += pa;
      if (w) split.won++;
      else split.lost++;
      s.form.push(w);
      if (w && (!s.best || pf - pa > s.best.margin)) s.best = { game: g, margin: pf - pa };
    }
    s.avgFor = s.played ? s.pf / s.played : 0;
    s.avgAgainst = s.played ? s.pa / s.played : 0;
    s.diff = s.pf - s.pa;
    if (s.form.length) {
      const lastW = s.form[s.form.length - 1];
      let c = 0;
      for (let i = s.form.length - 1; i >= 0 && s.form[i] === lastW; i--) c++;
      s.streak = { win: lastW, count: c };
    }
    teamStats[t.id] = s;
  }

  // Classifica ufficiale FIP (se disponibile), altrimenti calcolata dai risultati.
  let standings: Derived['standings'];
  if (data.standings.length) {
    standings = [...data.standings].sort((a, b) => a.pos - b.pos).map((r) => ({ ...r, stats: teamStats[r.team] }));
  } else {
    standings = Object.values(teamStats)
      .sort((a, b) => b.won * 2 - a.won * 2 || b.diff - a.diff)
      .map((s, i) => ({ team: s.id, pos: i + 1, played: s.played, won: s.won, lost: s.lost, pf: s.pf, pa: s.pa, points: s.won * 2, penalty: 0, stats: s }));
  }

  // Giocatori dai tabellini
  const map = new Map<string, PlayerStats>();
  for (const g of playedGames) {
    if (!g.boxscore) continue;
    for (const [team, list] of [
      [g.home, g.boxscore.home],
      [g.away, g.boxscore.away],
    ] as const) {
      for (const p of list) {
        const key = playerKey(team, p.name);
        let ps = map.get(key);
        if (!ps) map.set(key, (ps = { key, name: p.name, team, games: [], gp: 0, total: 0, avg: 0, max: 0, last: null }));
        ps.games.push({ game: g, pts: p.pts, played: p.played });
        if (p.played) {
          ps.gp++;
          ps.total += p.pts ?? 0;
          ps.max = Math.max(ps.max, p.pts ?? 0);
          ps.last = p.pts ?? 0;
        }
      }
    }
  }
  const players = [...map.values()].map((p) => ({ ...p, avg: p.gp ? p.total / p.gp : 0 }));
  players.sort((a, b) => b.avg - a.avg || b.total - a.total);
  const playersByTeam: Record<string, PlayerStats[]> = {};
  for (const p of players) (playersByTeam[p.team] ??= []).push(p);

  return { teamStats, standings, players, playersByTeam, playedGames, upcomingGames };
}
