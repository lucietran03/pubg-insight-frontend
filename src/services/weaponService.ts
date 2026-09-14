import api from "../api/axios";
import type { MatchCombatBreakdown } from "../types/weaponKill";
import { MOCK_MODE_ENABLED } from "../mocks/fixtures";

// Not wired into mock mode: no mock telemetry fixture exists, and WeaponBreakdown.tsx already
// treats a 404/network error here as expected rather than a real failure.
export async function getWeaponBreakdown(playerId: string, matchId: string): Promise<MatchCombatBreakdown> {
  if (MOCK_MODE_ENABLED) {
    return { weapons: [], shotDistances: [], bodyPartDamage: [] };
  }

  const response = await api.get<MatchCombatBreakdown>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/weapons`
  );
  return response.data;
}
