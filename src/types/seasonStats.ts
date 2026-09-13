export interface RadarScores {
  combat: number;
  survival: number;
  precision: number;
  aggression: number;
  support: number;
  consistency: number;
}

// Positive means the current season is higher than the previous one.
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
  // Null when there is no previous season to compare against.
  previousSeasonComparison: SeasonComparison | null;
}
