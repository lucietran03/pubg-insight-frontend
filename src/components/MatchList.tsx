import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import StatTile from "./StatTile";

// Only the most recent few matches get an automatic rich preview (map/mode/placement/
// kills/damage) - PUBG has no batch endpoint, so previewing N matches costs N API calls.
// Kept low because a single player search already costs 1 (player) + 1 (season stats,
// after caching the season id) + N (previews) calls against a 10 req/min free-tier limit.
// Matches beyond this are loaded lazily, one API call per click, instead of eagerly -
// see the older-match list below.
const PREVIEW_COUNT = 3;

interface MatchListProps {
  playerId: string;
  matchIds: string[];
}

type MatchState = Match | "loading" | "error";

function formatMatchDate(createdAt: string, includeTime = false): string {
  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!includeTime) return dateLabel;
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}, ${timeLabel}`;
}

interface MatchPreviewCardProps {
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function MatchPreviewCard({ state, selected, onClick }: MatchPreviewCardProps) {
  if (state === undefined || state === "loading") {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: "6px",
          bgcolor: "background.default",
          display: "flex",
          justifyContent: "center",
          minHeight: 84,
          alignItems: "center",
        }}
      >
        <CircularProgress size={18} />
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box sx={{ p: 2, borderRadius: "6px", bgcolor: "background.default", minHeight: 84 }}>
        <Typography variant="caption" color="error">
          Failed to load
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "transparent",
        cursor: "pointer",
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatMatchDate(state.createdAt)} · #{state.winPlace}
        </Typography>
        <Chip label={state.gameMode} size="small" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {state.mapName}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {state.kills} kills
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {state.damageDealt.toFixed(0)} dmg
        </Typography>
      </Stack>
    </Box>
  );
}

interface OlderMatchRowProps {
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function OlderMatchRow({ state, selected, onClick }: OlderMatchRowProps) {
  let content: ReactNode;
  if (state === "loading") {
    content = <CircularProgress size={14} />;
  } else if (state === "error") {
    content = (
      <Typography variant="caption" color="error">
        Failed to load
      </Typography>
    );
  } else if (state === undefined) {
    content = (
      <Typography variant="caption" color="text.secondary">
        Older match · tap to view details
      </Typography>
    );
  } else {
    content = (
      <Typography variant="caption">
        {formatMatchDate(state.createdAt, true)} · #{state.winPlace} · {state.mapName} · {state.gameMode}
      </Typography>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "transparent",
        cursor: "pointer",
      }}
    >
      {content}
    </Box>
  );
}

function MatchList({ playerId, matchIds }: MatchListProps) {
  const previewIds = matchIds.slice(0, PREVIEW_COUNT);
  const overflowIds = matchIds.slice(PREVIEW_COUNT);

  // Holds fetched state for ANY match, whether auto-previewed or lazily loaded from the
  // older-match list on click - one cache instead of separate preview/selected state, so
  // a match that's already been loaded once is never re-fetched.
  const [matchCache, setMatchCache] = useState<Record<string, MatchState>>(() =>
    Object.fromEntries(previewIds.map((id) => [id, "loading" as const]))
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  useEffect(() => {
    matchIds.slice(0, PREVIEW_COUNT).forEach((matchId) => {
      getMatchStats(playerId, matchId)
        .then((match) => setMatchCache((prev) => ({ ...prev, [matchId]: match })))
        .catch(() => setMatchCache((prev) => ({ ...prev, [matchId]: "error" })));
    });
  }, [playerId, matchIds]);

  const handleSelect = async (matchId: string) => {
    setSelectedMatchId(matchId);
    setSelectedError(null);

    const cached = matchCache[matchId];
    if (cached && cached !== "error") {
      return;
    }

    setMatchCache((prev) => ({ ...prev, [matchId]: "loading" }));
    try {
      const result = await getMatchStats(playerId, matchId);
      setMatchCache((prev) => ({ ...prev, [matchId]: result }));
    } catch (err) {
      setMatchCache((prev) => ({ ...prev, [matchId]: "error" }));
      setSelectedError(getErrorMessage(err, "This match could not be found for this player."));
    }
  };

  if (matchIds.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No recent matches (PUBG only exposes roughly the last 14 days).
      </Typography>
    );
  }

  const selectedState = selectedMatchId ? matchCache[selectedMatchId] : undefined;
  const selectedMatch = selectedState && selectedState !== "loading" && selectedState !== "error" ? selectedState : null;

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {previewIds.map((matchId) => (
          <MatchPreviewCard
            key={matchId}
            state={matchCache[matchId]}
            selected={matchId === selectedMatchId}
            onClick={() => handleSelect(matchId)}
          />
        ))}
      </Box>

      {overflowIds.length > 0 && (
        <Stack
          spacing={0.75}
          sx={{
            mt: 1.5,
            maxHeight: 200,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {overflowIds.map((matchId) => (
            <OlderMatchRow
              key={matchId}
              state={matchCache[matchId]}
              selected={matchId === selectedMatchId}
              onClick={() => handleSelect(matchId)}
            />
          ))}
        </Stack>
      )}

      {selectedState === "loading" && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {selectedError && selectedState === "error" && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {selectedError}
        </Alert>
      )}

      {selectedMatch && (
        <Box sx={{ mt: 2, bgcolor: "background.default", borderRadius: "6px", p: 2.5 }}>
          <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
            <Box sx={{ minWidth: 90 }}>
              <Typography variant="overline" color="text.secondary">
                Placement
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  color: selectedMatch.winPlace === 1 ? "primary.main" : "text.primary",
                }}
              >
                #{selectedMatch.winPlace}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {selectedMatch.mapName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                <Chip label={selectedMatch.gameMode} size="small" />
                <Typography variant="caption" color="text.secondary">
                  {formatMatchDate(selectedMatch.createdAt, true)}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
            <StatTile label="Kills" value={selectedMatch.kills} />
            <StatTile label="Headshot" value={`${(selectedMatch.headshotRate * 100).toFixed(0)}%`} />
            <StatTile label="Damage" value={selectedMatch.damageDealt.toFixed(0)} />
            <StatTile label="Survived" value={`${Math.round(selectedMatch.timeSurvivedSeconds / 60)}m`} />
          </Box>

          {selectedMatchId && <AiInsights playerId={playerId} matchId={selectedMatchId} />}
        </Box>
      )}
    </Box>
  );
}

export default MatchList;
