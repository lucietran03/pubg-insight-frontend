import api from "../api/axios";
import type { WeaponKill } from "../types/weaponKill";
import { MOCK_MODE_ENABLED } from "../mocks/fixtures";

// New, strictly-additive endpoint (GET /api/players/{playerId}/matches/{matchId}/weapons) -
// a telemetry-derived breakdown of which weapon got each of this player's kills in this
// match. Not wired into mock mode: there's no mock telemetry fixture, and this call failing
// (404/network error) is an expected, silently-handled case for WeaponBreakdown.tsx, not an
// error - see that component.
export async function getWeaponBreakdown(playerId: string, matchId: string): Promise<WeaponKill[]> {
  if (MOCK_MODE_ENABLED) {
    return [];
  }

  const response = await api.get<WeaponKill[]>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/weapons`
  );
  return response.data;
}
