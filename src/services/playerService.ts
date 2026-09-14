import api from "../api/axios";
import type { Player } from "../types/player";
import { MOCK_MODE_ENABLED, delay, mockPlayerFor } from "../mocks/fixtures";

export async function searchPlayer(name: string): Promise<Player> {
  if (MOCK_MODE_ENABLED) {
    return delay(mockPlayerFor(name));
  }

  const response = await api.get<Player>(`/api/players/${encodeURIComponent(name)}`);
  return response.data;
}

// Used to resolve a share link's bare account id (no display name) back into a Player.
export async function getPlayerById(accountId: string): Promise<Player> {
  if (MOCK_MODE_ENABLED) {
    return delay(mockPlayerFor(accountId));
  }

  const response = await api.get<Player>(`/api/players/by-id/${encodeURIComponent(accountId)}`);
  return response.data;
}
