export interface AnalysisHistoryEntry {
  playerId: string;
  matchId: string;
  mapName: string;
  gameMode: string;
  kills: number;
  headshotRate: number;
  damageDealt: number;
  timeSurvivedSeconds: number;
  winPlace: number;
  insightSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: string;
}
