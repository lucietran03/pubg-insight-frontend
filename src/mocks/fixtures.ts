import type { Player } from "../types/player";
import type { SeasonStats } from "../types/seasonStats";
import type { Match } from "../types/match";
import type { Insight } from "../types/insight";

// Lets the whole app be exercised with a fully populated UI (many matches, season
// stats, AI insights) without needing the real backend or PUBG at all - see
// src/services/*.ts, each checks this before making a real API call. Enable with
// VITE_USE_MOCK_DATA=true in a local .env file, then `npm run dev`.
export const MOCK_MODE_ENABLED = import.meta.env.VITE_USE_MOCK_DATA === "true";

const MOCK_PLAYER_ID = "mock-account-1";
const MOCK_MATCH_COUNT = 23; // more than one page (PAGE_SIZE=6 in MatchList.tsx), so pagination is actually exercised
const MAPS = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Taego", "Deston", "Paramo"];
const MODES = ["Squad", "Squad FPP", "Duo", "Duo FPP", "Solo", "Solo FPP"];

function buildMockMatch(index: number): Match {
  const hoursAgo = index * 7 + (index % 3) * 2;
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  const winPlace = ((index * 7) % 42) + 1;
  const kills = (index * 3) % 11;
  const headshotKills = Math.min(kills, (index * 2) % 5);

  return {
    matchId: `mock-match-${index}`,
    mapName: MAPS[index % MAPS.length],
    gameMode: MODES[index % MODES.length],
    kills,
    headshotKills,
    headshotRate: kills === 0 ? 0 : headshotKills / kills,
    damageDealt: 80 + ((index * 137) % 820),
    timeSurvivedSeconds: 240 + ((index * 211) % 1500),
    winPlace,
    createdAt,
  };
}

const mockMatchesById: Record<string, Match> = Object.fromEntries(
  Array.from({ length: MOCK_MATCH_COUNT }, (_, i) => i + 1).map((i) => [`mock-match-${i}`, buildMockMatch(i)])
);

export function mockPlayerFor(name: string): Player {
  return {
    id: MOCK_PLAYER_ID,
    name,
    shardId: "steam",
    recentMatchIds: Object.keys(mockMatchesById),
  };
}

export const mockSeasonStats: SeasonStats = {
  wins: 9,
  roundsPlayed: 134,
  winRate: 9 / 134,
};

export const mockInsight: Insight = {
  summary:
    "Solid aggressive performance with a strong finish - you closed the gap fast in the final circles and converted early kills into a top-placement finish.",
  strengths: ["High headshot rate", "Efficient rotations", "Good damage output"],
  weaknesses: ["Low survival time in the early game", "Exposed positioning in open areas"],
  recommendations: ["Rotate earlier to avoid the circle edge", "Find cover before engaging at range"],
};

export function getMockMatch(matchId: string): Match | undefined {
  return mockMatchesById[matchId];
}

// Small artificial delay so loading/skeleton states are actually visible while testing
// with mock data, instead of resolving instantly.
export function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
