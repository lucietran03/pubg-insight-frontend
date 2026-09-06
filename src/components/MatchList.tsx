import { useEffect, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import StatTile from "./StatTile";

// Only the most recent few matches get an automatic rich preview (map/mode/placement/
// kills/damage) - PUBG has no batch endpoint, so previewing N matches costs N API calls
// against a 10 req/min free-tier limit. The rest stay as click-to-load chips.
const PREVIEW_COUNT = 5;

interface MatchListProps {
  playerId: string;
  matchIds: string[];
}

type PreviewState = Match | "loading" | "error";

interface MatchPreviewCardProps {
  state: PreviewState;
  selected: boolean;
  onClick: () => void;
}

function MatchPreviewCard({ state, selected, onClick }: MatchPreviewCardProps) {
  if (state === "loading") {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: "6px",
          bgcolor: "background.default",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={18} />
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box sx={{ p: 1.5, borderRadius: "6px", bgcolor: "background.default" }}>
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
        p: 1.5,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "transparent",
        cursor: "pointer",
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {state.mapName}
        </Typography>
        <Chip label={state.gameMode} size="small" />
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          #{state.winPlace}
        </Typography>
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

function MatchList({ playerId, matchIds }: MatchListProps) {
  const previewIds = matchIds.slice(0, PREVIEW_COUNT);
  const overflowIds = matchIds.slice(PREVIEW_COUNT);

  const [previewMatches, setPreviewMatches] = useState<Record<string, PreviewState>>(() =>
    Object.fromEntries(previewIds.map((id) => [id, "loading" as const]))
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  useEffect(() => {
    matchIds.slice(0, PREVIEW_COUNT).forEach((matchId) => {
      getMatchStats(playerId, matchId)
        .then((match) => setPreviewMatches((prev) => ({ ...prev, [matchId]: match })))
        .catch(() => setPreviewMatches((prev) => ({ ...prev, [matchId]: "error" })));
    });
  }, [playerId, matchIds]);

  const handleSelect = async (matchId: string) => {
    setSelectedMatchId(matchId);
    setSelectedError(null);

    const cached = previewMatches[matchId];
    if (cached && cached !== "loading" && cached !== "error") {
      setSelectedMatch(cached);
      return;
    }

    setSelectedMatch(null);
    setSelectedLoading(true);
    try {
      const result = await getMatchStats(playerId, matchId);
      setSelectedMatch(result);
    } catch (err) {
      setSelectedError(getErrorMessage(err, "This match could not be found for this player."));
    } finally {
      setSelectedLoading(false);
    }
  };

  if (matchIds.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No recent matches (PUBG only exposes roughly the last 14 days).
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 1,
        }}
      >
        {previewIds.map((matchId) => (
          <MatchPreviewCard
            key={matchId}
            state={previewMatches[matchId] ?? "loading"}
            selected={matchId === selectedMatchId}
            onClick={() => handleSelect(matchId)}
          />
        ))}
      </Box>

      {overflowIds.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            maxHeight: 120,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
            gap: 1,
            pr: 0.5,
          }}
        >
          {overflowIds.map((matchId, index) => (
            <Chip
              key={matchId}
              label={`Match ${PREVIEW_COUNT + index + 1}`}
              color={matchId === selectedMatchId ? "primary" : "default"}
              onClick={() => handleSelect(matchId)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      )}

      {selectedLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {selectedError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {selectedError}
        </Alert>
      )}

      {selectedMatch && (
        <Box sx={{ mt: 2, bgcolor: "background.default", borderRadius: "6px", p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedMatch.mapName}
            </Typography>
            <Chip label={selectedMatch.gameMode} size="small" />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
            <StatTile label="Placement" value={`#${selectedMatch.winPlace}`} />
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
