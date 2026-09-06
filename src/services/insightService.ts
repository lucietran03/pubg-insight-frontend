import api from "../api/axios";
import type { Insight } from "../types/insight";

export async function getInsights(playerId: string, matchId: string): Promise<Insight> {
  const response = await api.get<Insight>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/insights`
  );
  return response.data;
}
