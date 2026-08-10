import api from "../api/axios";
import type { Player } from "../types/player";

export async function searchPlayer(name: string): Promise<Player> {
  const response = await api.get<Player>(`/api/players/${encodeURIComponent(name)}`);
  return response.data;
}
