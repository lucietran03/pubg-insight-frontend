import api from "../api/axios";
import type { Match } from "../types/match";

export async function getMatchStats(playerId: string, matchId: string): Promise<Match> {
  const response = await api.get<Match>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}`
  );
  return response.data;
}
