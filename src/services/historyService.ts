import api from "../api/axios";
import type { AnalysisHistoryEntry } from "../types/history";
import { MOCK_MODE_ENABLED, delay, mockHistoryFor, recordMockHistoryEntry } from "../mocks/fixtures";

export async function recordAnalysis(playerId: string, matchId: string): Promise<AnalysisHistoryEntry> {
  if (MOCK_MODE_ENABLED) {
    return delay(recordMockHistoryEntry(playerId, matchId), 200);
  }

  const response = await api.post<AnalysisHistoryEntry>(
    `/api/players/${encodeURIComponent(playerId)}/matches/${encodeURIComponent(matchId)}/history`
  );
  return response.data;
}

export async function getHistory(playerId: string): Promise<AnalysisHistoryEntry[]> {
  if (MOCK_MODE_ENABLED) {
    return delay(mockHistoryFor(playerId), 200);
  }

  const response = await api.get<AnalysisHistoryEntry[]>(`/api/players/${encodeURIComponent(playerId)}/history`);
  return response.data;
}
