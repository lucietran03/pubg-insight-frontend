import api from "../api/axios";
import type { MatchCombatBreakdown } from "../types/weaponKill";
import { MOCK_MODE_ENABLED } from "../mocks/fixtures";

// New, strictly-additive endpoint (GET /api/players/{playerId}/matches/{matchId}/weapons) -
// a telemetry-derived breakdown of which weapon got each of this player's kills in this
// match, plus a shot-distance histogram from the same kill events. Not wired into mock mode:
// there's no mock telemetry fixture, and this call failing (404/network error) is an expected,
// silently-handled case for WeaponBreakdown.tsx, not an error - see that component.
export async function getWeaponBreakdown(playerId: string, matchId: string): Promise<MatchCombatBreakdown> {
  if (MOCK_MODE_ENABLED) {
    return { weapons: [], shotDistances: [] };
  }

  const response = await api.get<MatchCombatBreakdown>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/weapons`
  );
  return response.data;
}
