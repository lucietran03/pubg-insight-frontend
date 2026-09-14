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
  avgSurvivalDeltaPct: number;
  longestKillDeltaPct: number;
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
  // Kills / knockdowns for the season - can exceed 1.0 since a kill without a preceding
  // knock (e.g. a headshot) still counts as a kill.
  knockToKillRate: number;
  radar: RadarScores;
  archetype: string;
  // Null when there is no previous season to compare against.
  previousSeasonComparison: SeasonComparison | null;
}
