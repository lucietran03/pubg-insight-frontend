import api from "../api/axios";
import type { Insight } from "../types/insight";
import { MOCK_MODE_ENABLED, delay, mockInsight } from "../mocks/fixtures";

export async function getInsights(playerId: string, matchId: string): Promise<Insight> {
  if (MOCK_MODE_ENABLED) {
    // Real Gemini generation takes noticeably longer than a plain data fetch - a longer
    // delay here keeps the "Generating..." button state meaningfully testable.
    return delay(mockInsight, 1200);
  }

  const response = await api.get<Insight>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/insights`
  );
  return response.data;
}
