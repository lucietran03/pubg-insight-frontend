import api from "../api/axios";
import type { SeasonStats } from "../types/seasonStats";

export async function getSeasonStats(playerId: string): Promise<SeasonStats> {
  const response = await api.get<SeasonStats>(
    `/api/players/${encodeURIComponent(playerId)}/season-stats`
  );
  return response.data;
}
