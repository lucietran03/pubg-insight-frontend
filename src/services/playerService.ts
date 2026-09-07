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
