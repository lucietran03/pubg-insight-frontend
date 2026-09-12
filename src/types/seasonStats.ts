export interface RadarScores {
  combat: number;
  survival: number;
  precision: number;
  aggression: number;
  support: number;
  consistency: number;
}

// Percentage differences between the current season and the immediately preceding one,
// for the same metrics tracked on SeasonStats. Positive means the current season is
// higher than the previous one. Null on SeasonStats when there is no previous season to
// compare against (e.g. a brand-new account with no season history yet).
export interface SeasonComparison {
  winRateDeltaPct: number;
  avgDamageDeltaPct: number;
  killDeathRatioDeltaPct: number;
  headshotRateDeltaPct: number;
  top10RateDeltaPct: number;
}

export interface SeasonStats {
  wins: number;
  roundsPlayed: number;
  winRate: number;
  avgDamage: number;
  killDeathRatio: number;
  headshotRate: number;
  top10Rate: number;
  avgSurvivalSeconds: number;
  longestKillMeters: number;
  radar: RadarScores;
  archetype: string;
  previousSeasonComparison: SeasonComparison | null;
}
