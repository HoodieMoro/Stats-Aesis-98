export interface Venue {
  name: string;
  address: string;
  city: string;
  province: string;
}

export interface BoxPlayer {
  name: string;
  /** null = non entrato */
  pts: number | null;
  played: boolean;
}

export interface Boxscore {
  url: string;
  quarters: [number, number][] | null;
  home: BoxPlayer[];
  away: BoxPlayer[];
  homeCoach: string | null;
  awayCoach: string | null;
  /** 'mismatch' = la somma dei punti nel tabellino della fonte non coincide con il risultato */
  check: 'ok' | 'mismatch';
}

export interface Game {
  id: string;
  round: number;
  leg: 1 | 2;
  date: string | null;
  time: string | null;
  home: string;
  away: string;
  homePts: number | null;
  awayPts: number | null;
  played: boolean;
  status: string;
  venue: Venue;
  referees: string[];
  source: 'fip-api' | 'fip-pdf';
  newsUrl?: string;
  boxscore?: Boxscore;
}

export interface Team {
  id: string;
  name: string;
  short: string;
  venue: Venue | null;
}

export interface StandingRow {
  team: string;
  pos: number;
  played: number;
  won: number;
  lost: number;
  pf: number;
  pa: number;
  points: number;
  penalty: number;
  /** gare giocate ma non ancora omologate dalla FIP, già incluse nei totali */
  provisional?: number;
}

export interface League {
  season: string;
  league: string;
  region: string;
  highlightTeam: string;
  updatedAt: string;
  sources: { fip: string; calendarPdf: string | null; basketmarche: string };
  teams: Team[];
  standings: StandingRow[];
  games: Game[];
  warnings: string[];
}
