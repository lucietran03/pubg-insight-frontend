import api from "../api/axios";
import type { Match } from "../types/match";
import { MOCK_MODE_ENABLED, delay, getMockMatch } from "../mocks/fixtures";

export async function getMatchStats(playerId: string, matchId: string): Promise<Match> {
  if (MOCK_MODE_ENABLED) {
    const match = getMockMatch(matchId);
    if (!match) {
      throw new Error(`No mock data for match '${matchId}'`);
    }
    return delay(match);
  }

  const response = await api.get<Match>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}`
  );
  return response.data;
}
