import api from "../api/axios";
import type { MatchCombatBreakdown } from "../types/weaponKill";
import { MOCK_MODE_ENABLED } from "../mocks/fixtures";

// Not wired into mock mode: no mock telemetry fixture exists, and a 404/network error here
// is an expected, silently-handled case in WeaponBreakdown.tsx rather than a real failure.
export async function getWeaponBreakdown(playerId: string, matchId: string): Promise<MatchCombatBreakdown> {
  if (MOCK_MODE_ENABLED) {
    return { weapons: [], shotDistances: [], bodyPartDamage: [] };
  }

  const response = await api.get<MatchCombatBreakdown>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/weapons`
  );
  return response.data;
}
