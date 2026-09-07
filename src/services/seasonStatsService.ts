import api from "../api/axios";
import type { SeasonStats } from "../types/seasonStats";
import { MOCK_MODE_ENABLED, delay, mockSeasonStats } from "../mocks/fixtures";

export async function getSeasonStats(playerId: string): Promise<SeasonStats> {
  if (MOCK_MODE_ENABLED) {
    return delay(mockSeasonStats);
  }

  const response = await api.get<SeasonStats>(
    `/api/players/${encodeURIComponent(playerId)}/season-stats`
  );
  return response.data;
}
