import api from "../api/axios";
import type { PopulationComparison } from "../types/populationComparison";
import { MOCK_MODE_ENABLED } from "../mocks/fixtures";

// Not wired into mock mode: no mock Athena fixture exists, and PopulationComparison.tsx
// already treats a fetch failure here as expected rather than a real error.
export async function getPopulationComparison(playerId: string, matchId: string): Promise<PopulationComparison> {
  if (MOCK_MODE_ENABLED) {
    return { medianDamage: 0, sampleSize: 0, deltaPct: 0 };
  }

  const response = await api.get<PopulationComparison>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/population-comparison`
  );
  return response.data;
}
