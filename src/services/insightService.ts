import api from "../api/axios";
import type { Insight } from "../types/insight";
import { MOCK_MODE_ENABLED, delay, mockInsight } from "../mocks/fixtures";

export async function getInsights(playerId: string, matchId: string): Promise<Insight> {
  if (MOCK_MODE_ENABLED) {
    // Longer than the default delay to keep the "Generating..." button state testable.
    return delay(mockInsight, 1200);
  }

  const response = await api.get<Insight>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/insights`
  );
  return response.data;
}
